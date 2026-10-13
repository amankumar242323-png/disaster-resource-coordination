
const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");
require("dotenv").config();

const store = require("./reports/store");
const { problem } = require("./reports/errors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const VALID_SEVERITIES = new Set([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

function validateReport(body) {
  const errors = [];

  if (!Number.isSafeInteger(body.shelterId) || body.shelterId <= 0) {
    errors.push(["shelterId", "must be a positive integer"]);
  }

  if (!Number.isSafeInteger(body.reportedBy) || body.reportedBy <= 0) {
    errors.push(["reportedBy", "must be a positive integer"]);
  }

  if (
    typeof body.reportType !== "string" ||
    !body.reportType.trim() ||
    body.reportType.length > 50
  ) {
    errors.push(["reportType", "required string, maximum 50 characters"]);
  }

  if (!VALID_SEVERITIES.has(body.severity)) {
    errors.push(["severity", "must be LOW, MEDIUM, HIGH or CRITICAL"]);
  }

  if (
    typeof body.description !== "string" ||
    !body.description.trim()
  ) {
    errors.push(["description", "required non-empty string"]);
  }

  if (
    body.occupancyCount !== undefined &&
    body.occupancyCount !== null &&
    (!Number.isSafeInteger(body.occupancyCount) ||
      body.occupancyCount < 0)
  ) {
    errors.push([
      "occupancyCount",
      "must be a non-negative integer or null",
    ]);
  }

  return errors;
}

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "disaster-resource-coordination",
    status: "alive",
  });
});

// POST /reports - Create a report
app.post("/reports", (req, res) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const err = problem(
      400,
      "invalid-request",
      "Invalid request",
      "Expected a JSON object"
    );
    return res.status(err.status).json(err.body);
  }

  const errors = validateReport(body);

  if (errors.length > 0) {
    const err = problem(
      400,
      "invalid-request",
      "Invalid request",
      "One or more fields are invalid"
    );
    return res.status(err.status).json({ ...err.body, errors });
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
    return res.status(err.status).json(err.body);
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

  const previous = store.findByKey(key);

  if (previous) {
    if (previous.requestHash !== requestHash) {
      const err = problem(
        409,
        "idempotency-conflict",
        "Conflict",
        "This Idempotency-Key was already used with a different request"
      );
      return res.status(err.status).json(err.body);
    }

    const original = store.find(previous.reportId);

    if (original) {
      return res.status(200).json(original.asJson());
    }
  }

  const report = store.create(payload, key, requestHash);

  return res
    .status(201)
    .location(`/reports/${report.reportId}`)
    .json(report.asJson());
});

// GET /reports - List reports with optional filters
app.get("/reports", (req, res) => {
  const { shelterId, severity, limit = "20" } = req.query;
  let parsedShelterId;
  const parsedLimit = Number(limit);

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
      return res.status(err.status).json(err.body);
    }
  }

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
    return res.status(err.status).json(err.body);
  }

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
    return res.status(err.status).json(err.body);
  }

  const reports = store.list({
    shelterId: parsedShelterId,
    severity,
    limit: parsedLimit,
  });

  return res
    .status(200)
    .json(reports.map((report) => report.asJson()));
});

// GET /reports/:reportId - Retrieve a single report
app.get("/reports/:reportId", (req, res) => {
  const reportId = Number(req.params.reportId);

  if (!Number.isSafeInteger(reportId) || reportId <= 0) {
    const err = problem(
      400,
      "invalid-request",
      "Invalid request",
      "reportId must be a positive integer"
    );
    return res.status(err.status).json(err.body);
  }

  const report = store.find(reportId);

  if (!report) {
    const err = problem(
      404,
      "not-found",
      "Report not found",
      `No report exists with ID ${reportId}`
    );
    return res.status(err.status).json(err.body);
  }

  return res.status(200).json(report.asJson());
});

// 404 handler
app.use((req, res) => {
  const err = problem(
    404,
    "not-found",
    "Not Found",
    `Route ${req.method} ${req.originalUrl} not found`
  );

  return res.status(err.status).json(err.body);
});

// Global error handler
app.use((err, req, res, next) => {
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

    return res.status(p.status).json(p.body);
  }

  console.error(err);

  const p = problem(
    500,
    "internal-error",
    "Internal Server Error",
    "An unexpected error occurred"
  );

  return res.status(p.status).json(p.body);
});

// Start server
const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DRC API running at http://localhost:${PORT}`);
  });
}

module.exports = app;