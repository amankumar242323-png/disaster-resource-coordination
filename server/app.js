
const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");
require("dotenv").config();

const store = require("./reports/store");
const pool = require("./db");
const { problem } = require("./reports/errors");
const photoUpload = require("./reports/photoUpload");
const photoStore = require("./reports/photoStore");

const app = express();

const VALID_SEVERITIES = new Set([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

const ALLOWED_SORT_FIELDS = new Set([
  "reportId",
  "createdAt",
  "severity",
]);

// CORS and common security headers
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(express.json({ limit: "1mb" }));

function validateReport(body) {
  const errors = [];

  if (
    !Number.isSafeInteger(body.shelterId) ||
    body.shelterId <= 0
  ) {
    errors.push(["shelterId", "must be a positive integer"]);
  }

  if (
    !Number.isSafeInteger(body.reportedBy) ||
    body.reportedBy <= 0
  ) {
    errors.push(["reportedBy", "must be a positive integer"]);
  }

  if (
    typeof body.reportType !== "string" ||
    !body.reportType.trim() ||
    body.reportType.trim().length > 50
  ) {
    errors.push([
      "reportType",
      "required string, maximum 50 characters",
    ]);
  }

  if (!VALID_SEVERITIES.has(body.severity)) {
    errors.push([
      "severity",
      "must be LOW, MEDIUM, HIGH or CRITICAL",
    ]);
  }

  if (
    typeof body.description !== "string" ||
    !body.description.trim()
  ) {
    errors.push([
      "description",
      "required non-empty string",
    ]);
  }

  if (
    body.occupancyCount !== undefined &&
    body.occupancyCount !== null &&
    (
      !Number.isSafeInteger(body.occupancyCount) ||
      body.occupancyCount < 0
    )
  ) {
    errors.push([
      "occupancyCount",
      "must be a non-negative integer or null",
    ]);
  }

  return errors;
}

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      service: "disaster-resource-coordination",
      status: "alive",
      database: "connected",
    });
  } catch (error) {
    return res.status(503).json({
      service: "disaster-resource-coordination",
      status: "unavailable",
      database: "disconnected",
    });
  }
});

// Create a report with Idempotency-Key support
app.post("/reports", async (req, res, next) => {
  try {
    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "Expected a JSON object"
      );

      return res.status(400).json(err.body);
    }

    const errors = validateReport(body);

    if (errors.length > 0) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "One or more fields are invalid"
      );

      return res.status(400).json({
        ...err.body,
        errors,
      });
    }

    const key = req.get("Idempotency-Key");

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!key || !uuidPattern.test(key)) {
      const err = problem(
        400,
        "invalid-idempotency-key",
        "Invalid Idempotency-Key",
        "A valid UUID Idempotency-Key header is required"
      );

      return res.status(400).json(err.body);
    }

    const payload = {
      shelterId: body.shelterId,
      reportedBy: body.reportedBy,
      reportType: body.reportType.trim(),
      severity: body.severity,
      description: body.description.trim(),
      occupancyCount: body.occupancyCount ?? null,
    };

    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    const previous = await store.findByKey(key);

    if (previous) {
      if (previous.requestHash !== requestHash) {
        const err = problem(
          409,
          "idempotency-conflict",
          "Conflict",
          "This Idempotency-Key was already used with a different request"
        );

        return res.status(409).json(err.body);
      }

      if (previous.response) {
        return res.status(200).json(previous.response);
      }

      const existing = await store.find(previous.reportId);

      if (existing) {
        return res.status(200).json(existing.asJson());
      }
    }

    const result = await store.create(
      payload,
      key,
      requestHash
    );

    return res
      .status(result.replayed ? 200 : 201)
      .location(`/reports/${result.report.reportId}`)
      .json(result.report);
  } catch (error) {
    if (error.status === 409) {
      const err = problem(
        409,
        "idempotency-conflict",
        "Conflict",
        error.message
      );

      return res.status(409).json(err.body);
    }

    next(error);
  }
});

// List reports with filtering, sorting and pagination
app.get("/reports", async (req, res, next) => {
  try {
    const {
      shelterId,
      severity,
      limit = "20",
      offset = "0",
      sortBy = "reportId",
      order = "desc",
    } = req.query;

    let parsedShelterId;
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    // shelterId validation
    if (shelterId !== undefined) {
      parsedShelterId = Number(shelterId);

      if (
        !Number.isSafeInteger(parsedShelterId) ||
        parsedShelterId <= 0
      ) {
        const err = problem(
          400,
          "invalid-request",
          "Invalid request",
          "shelterId must be a positive integer"
        );

        return res.status(400).json(err.body);
      }
    }

    // Severity validation
    if (
      severity !== undefined &&
      !VALID_SEVERITIES.has(severity)
    ) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "severity must be LOW, MEDIUM, HIGH or CRITICAL"
      );

      return res.status(400).json(err.body);
    }

    // Limit validation
    if (
      !Number.isSafeInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "limit must be an integer between 1 and 100"
      );

      return res.status(400).json(err.body);
    }

    // Offset validation
    if (
      !Number.isSafeInteger(parsedOffset) ||
      parsedOffset < 0
    ) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "offset must be a non-negative integer"
      );

      return res.status(400).json(err.body);
    }

    // Sort field validation
    if (!ALLOWED_SORT_FIELDS.has(sortBy)) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "sortBy must be reportId, createdAt or severity"
      );

      return res.status(400).json(err.body);
    }

    // Sort direction validation
    if (!["asc", "desc"].includes(order)) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "order must be asc or desc"
      );

      return res.status(400).json(err.body);
    }

    const reports = await store.list({
      shelterId: parsedShelterId,
      severity,
      limit: parsedLimit,
      offset: parsedOffset,
      sortBy,
      order,
    });

    return res
      .status(200)
      .json(reports.map((report) => report.asJson()));
  } catch (error) {
    next(error);
  }
});

// Retrieve one report
app.get("/reports/:reportId", async (req, res, next) => {
  try {
    const reportId = Number(req.params.reportId);

    if (
      !Number.isSafeInteger(reportId) ||
      reportId <= 0
    ) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "reportId must be a positive integer"
      );

      return res.status(400).json(err.body);
    }

    const report = await store.find(reportId);

    if (!report) {
      const err = problem(
        404,
        "not-found",
        "Report not found",
        `No report exists with ID ${reportId}`
      );

      return res.status(404).json(err.body);
    }

    return res.status(200).json(report.asJson());
  } catch (error) {
    next(error);
  }
});

// Upload a photo for an existing report
app.post(
  "/reports/:reportId/photos",

  (req, res, next) => {
    const reportId = Number(req.params.reportId);

    if (
      !Number.isSafeInteger(reportId) ||
      reportId <= 0
    ) {
      const err = problem(
        400,
        "invalid-request",
        "Invalid request",
        "reportId must be a positive integer"
      );

      return res.status(400).json(err.body);
    }

    next();
  },

  async (req, res, next) => {
    try {
      const report = await store.find(
        Number(req.params.reportId)
      );

      if (!report) {
        const err = problem(
          404,
          "not-found",
          "Report not found",
          `No report exists with ID ${req.params.reportId}`
        );

        return res.status(404).json(err.body);
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  photoUpload.single("photo"),
  photoUpload.validateContent,

  async (req, res, next) => {
    try {
      if (!req.file) {
        const err = problem(
          400,
          "missing-photo",
          "Missing photo",
          'Upload one image using the multipart field "photo"'
        );

        return res.status(400).json(err.body);
      }

      const saved = await photoStore.savePhoto(
        Number(req.params.reportId),
        req.file
      );

      return res
        .status(201)
        .location(
          `/reports/${saved.report_id}/photos/${saved.photo_id}`
        )
        .json({
          photoId: Number(saved.photo_id),
          reportId: Number(saved.report_id),
          fileName: saved.file_name,
          contentType: saved.content_type,
          fileSizeBytes: saved.file_size_bytes,
          storagePath: saved.storage_path,
          uploadedAt: saved.uploaded_at,
        });
    } catch (error) {
      next(error);
    }
  }
);

// OPTIONS support: advertise supported methods
app.options("/reports", (req, res) => {
  res.setHeader("Allow", "GET, POST, HEAD, OPTIONS");
  return res.status(204).end();
});

app.options("/reports/:reportId", (req, res) => {
  res.setHeader("Allow", "GET, HEAD, OPTIONS");
  return res.status(204).end();
});

app.options("/reports/:reportId/photos", (req, res) => {
  res.setHeader("Allow", "POST, OPTIONS");
  return res.status(204).end();
});

// Handle unknown routes
app.use((req, res) => {
  const err = problem(
    404,
    "not-found",
    "Not Found",
    `Route ${req.method} ${req.originalUrl} not found`
  );

  return res.status(404).json(err.body);
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    const p = problem(
      400,
      "invalid-json",
      "Invalid JSON",
      "Request body contains malformed JSON"
    );

    return res.status(400).json(p.body);
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    const p = problem(
      413,
      "file-too-large",
      "Payload Too Large",
      "Photo size must not exceed 5 MB"
    );

    return res.status(413).json(p.body);
  }

  if (
    err.code === "LIMIT_FILE_COUNT" ||
    err.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    const p = problem(
      400,
      "invalid-upload",
      "Invalid upload",
      "Upload exactly one image using the multipart field 'photo'"
    );

    return res.status(400).json(p.body);
  }

  if (
    err.code === "INVALID_FILE_TYPE" ||
    err.status === 400
  ) {
    const p = problem(
      400,
      "invalid-file-type",
      "Invalid file type",
      err.message || "Only JPEG, PNG and WebP images are allowed"
    );

    return res.status(400).json(p.body);
  }

  console.error(err.message);

  const p = problem(
    500,
    "internal-error",
    "Internal Server Error",
    "An unexpected error occurred"
  );

  return res.status(500).json(p.body);
});

const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DRC API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
