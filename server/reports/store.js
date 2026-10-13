
const crypto = require("node:crypto");
const pool = require("../db");
const Report = require("./models/report");

function mapRow(row) {
  return new Report({
    reportId: Number(row.report_id),
    shelterId: Number(row.shelter_id),
    reportedBy: Number(row.reported_by),
    reportType: row.report_type,
    severity: row.severity,
    description: row.description,
    occupancyCount:
      row.occupancy_count === null
        ? null
        : Number(row.occupancy_count),
    createdAt: row.created_at,
  });
}

function makeEtag(report) {
  return `"${crypto
    .createHash("sha256")
    .update(JSON.stringify(report.asJson()))
    .digest("hex")}"`;
}

async function create(data, key, requestHash) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [key]
    );

    const existing = await client.query(
      `SELECT idempotency_key, request_hash, response_snapshot, expires_at
       FROM reports.report_idempotency
       WHERE idempotency_key = $1
       FOR UPDATE`,
      [key]
    );

    if (existing.rows.length > 0) {
      const record = existing.rows[0];

      if (new Date(record.expires_at) <= new Date()) {
        await client.query(
          "DELETE FROM reports.report_idempotency WHERE idempotency_key = $1",
          [key]
        );
      } else {
        if (record.request_hash !== requestHash) {
          const error = new Error(
            "Idempotency key reused with a different request"
          );
          error.status = 409;
          throw error;
        }

        if (record.response_snapshot) {
          await client.query("COMMIT");
          return {
            report: record.response_snapshot,
            replayed: true,
          };
        }
      }
    }

    const result = await client.query(
      `INSERT INTO reports.field_reports
       (shelter_id, reported_by, report_type, severity, description, occupancy_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.shelterId,
        data.reportedBy,
        data.reportType,
        data.severity,
        data.description,
        data.occupancyCount,
      ]
    );

    const report = mapRow(result.rows[0]).asJson();

    await client.query(
      `INSERT INTO reports.report_idempotency
       (idempotency_key, report_id, request_hash, response_snapshot, expires_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW() + INTERVAL '24 hours')
       ON CONFLICT (idempotency_key) DO UPDATE
       SET report_id = EXCLUDED.report_id,
           request_hash = EXCLUDED.request_hash,
           response_snapshot = EXCLUDED.response_snapshot,
           created_at = NOW(),
           expires_at = EXCLUDED.expires_at`,
      [key, report.reportId, requestHash, JSON.stringify(report)]
    );

    await client.query("COMMIT");
    return { report, replayed: false };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Transaction rollback failed:",
        rollbackError.message
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

async function find(id) {
  const result = await pool.query(
    "SELECT * FROM reports.field_reports WHERE report_id = $1",
    [id]
  );

  return result.rows.length ? mapRow(result.rows[0]) : null;
}

async function findByKey(key) {
  const result = await pool.query(
    `SELECT request_hash, report_id, response_snapshot
     FROM reports.report_idempotency
     WHERE idempotency_key = $1
       AND expires_at > NOW()`,
    [key]
  );

  if (!result.rows.length) return null;

  return {
    requestHash: result.rows[0].request_hash,
    reportId: result.rows[0].report_id,
    response: result.rows[0].response_snapshot,
  };
}

async function list({
  shelterId,
  severity,
  limit = 20,
  offset = 0,
  sortBy = "reportId",
  order = "desc",
} = {}) {
  const allowedSortColumns = {
    reportId: "report_id",
    createdAt: "created_at",
    severity: "severity",
  };

  const sortColumn = allowedSortColumns[sortBy];

  if (!sortColumn) {
    const error = new Error("Invalid sortBy field");
    error.status = 400;
    throw error;
  }

  const normalizedOrder = String(order).toLowerCase();

  if (!["asc", "desc"].includes(normalizedOrder)) {
    const error = new Error("Invalid sort order");
    error.status = 400;
    throw error;
  }

  const conditions = [];
  const values = [];

  if (shelterId != null) {
    values.push(shelterId);
    conditions.push(`shelter_id = $${values.length}`);
  }

  if (severity) {
    values.push(severity);
    conditions.push(`severity = $${values.length}`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  values.push(limit);
  const limitPlaceholder = `$${values.length}`;

  values.push(offset);
  const offsetPlaceholder = `$${values.length}`;

  const result = await pool.query(
    `SELECT * FROM reports.field_reports
     ${where}
     ORDER BY ${sortColumn} ${normalizedOrder.toUpperCase()}, report_id DESC
     LIMIT ${limitPlaceholder}
     OFFSET ${offsetPlaceholder}`,
    values
  );

  return result.rows.map(mapRow);
}

async function update(id, patch, expectedEtag) {
  const allowedColumns = {
    reportType: "report_type",
    severity: "severity",
    description: "description",
    occupancyCount: "occupancy_count",
  };

  const fields = Object.keys(patch);

  if (fields.length === 0) {
    const error = new Error("PATCH body must contain at least one field");
    error.status = 400;
    throw error;
  }

  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(allowedColumns, field)) {
      const error = new Error(`Field '${field}' cannot be updated`);
      error.status = 400;
      throw error;
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const selected = await client.query(
      `SELECT *
       FROM reports.field_reports
       WHERE report_id = $1
       FOR UPDATE`,
      [id]
    );

    if (!selected.rows.length) {
      await client.query("COMMIT");
      return null;
    }

    const current = mapRow(selected.rows[0]);
    const currentEtag = makeEtag(current);

    if (currentEtag !== expectedEtag) {
      await client.query("COMMIT");
      return false;
    }

    const values = [];
    const assignments = fields.map((field) => {
      values.push(patch[field]);
      return `${allowedColumns[field]} = $${values.length}`;
    });

    values.push(id);

    const result = await client.query(
      `UPDATE reports.field_reports
       SET ${assignments.join(", ")}
       WHERE report_id = $${values.length}
       RETURNING *`,
      values
    );

    await client.query("COMMIT");
    return mapRow(result.rows[0]);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Transaction rollback failed:",
        rollbackError.message
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  create,
  find,
  findByKey,
  list,
  update,
};
