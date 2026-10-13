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
    occupancyCount: row.occupancy_count,
    createdAt: row.created_at,
  });
}

async function create(data, key, requestHash) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Serialize requests using the same idempotency key.
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
      const isExpired = new Date(record.expires_at) <= new Date();

      if (isExpired) {
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
      console.error("Transaction rollback failed:", rollbackError.message);
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

async function list({ shelterId, severity, limit = 20 } = {}) {
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

  values.push(limit);

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query(
    `SELECT * FROM reports.field_reports
     ${where}
     ORDER BY report_id DESC
     LIMIT $${values.length}`,
    values
  );

  return result.rows.map(mapRow);
}

module.exports = { create, find, findByKey, list };
