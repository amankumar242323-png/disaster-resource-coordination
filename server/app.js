
const express = require("express");
const cors = require("cors");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
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

// Consistent Problem Details response
function sendProblem(res, status, code, title, detail, errors) {
  const result = problem(status, code, title, detail, errors);

  return res
    .status(result.status)
    .type("application/problem+json")
    .send(JSON.stringify(result.body));
}

// Consistent JSON response
function sendJson(res, status, body) {
  return res
    .status(status)
    .type("application/json")
    .json(body);
}

// Content negotiation: JSON by default, XML when requested
function acceptsXml(req) {
  const accept = req.get("Accept");

  if (!accept || accept.trim() === "" || accept.includes("*/*")) {
    return false;
  }

  const types = accept.split(",").map((entry) => {
    const parts = entry.trim().split(";");
    const type = parts[0].trim().toLowerCase();
    const qPart = parts.find((part) => part.trim().startsWith("q="));
    const q = qPart ? Number(qPart.trim().slice(2)) : 1;

    return { type, q };
  });

  const xml = types.some(
    (entry) =>
      entry.q > 0 &&
      (entry.type === "application/xml" ||
        entry.type === "text/xml")
  );

  const json = types.some(
    (entry) =>
      entry.q > 0 &&
      (entry.type === "application/json" ||
        entry.type === "application/*")
  );

  return xml && !json;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function objectToXml(value, rootName = "response") {
  function element(name, item) {
    const safeName = /^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)
      ? name
      : "item";

    if (item === null || item === undefined) {
      return `<${safeName}/>`;
    }

    if (Array.isArray(item)) {
      return item.map((entry) => element("item", entry)).join("");
    }

    if (typeof item === "object") {
      const children = Object.entries(item)
        .map(([key, child]) => element(key, child))
        .join("");

      return `<${safeName}>${children}</${safeName}>`;
    }

    return `<${safeName}>${escapeXml(item)}</${safeName}>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>${element(
    rootName,
    value
  )}`;
}

function sendData(req, res, status, body, rootName = "response") {
  if (acceptsXml(req)) {
    return res
      .status(status)
      .type("application/xml")
      .send(objectToXml(body, rootName));
  }

  return sendJson(res, status, body);
}

function sendApiProblem(
  req,
  res,
  status,
  code,
  title,
  detail,
  errors
) {
  const result = problem(status, code, title, detail, errors);

  if (acceptsXml(req)) {
    return res
      .status(status)
      .type("application/xml")
      .send(objectToXml(result.body, "problem"));
  }

  return sendProblem(res, status, code, title, detail, errors);
}

function requireSupportedAccept(req, res, next) {
  const accept = req.get("Accept");

  if (!accept || accept.trim() === "" || accept.includes("*/*")) {
    return next();
  }

  const supported = accept.split(",").some((entry) => {
    const [type, ...params] = entry.trim().toLowerCase().split(";");
    const qPart = params.find((param) => param.trim().startsWith("q="));
    const q = qPart ? Number(qPart.trim().slice(2)) : 1;

    return (
      q > 0 &&
      [
        "application/json",
        "application/xml",
        "text/xml",
        "application/*",
      ].includes(type.trim())
    );
  });

  if (!supported) {
    return sendProblem(
      res,
      406,
      "not-acceptable",
      "Not Acceptable",
      "This API supports application/json and application/xml"
    );
  }

  next();
}

// CORS and common security headers
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(requireSupportedAccept);
app.use(express.json({ limit: "1mb" }));

// Rate limiting: production default is 100 requests per minute.
// Tests using X-Test-Rate-Key get their own isolated counter and limit.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,

  limit: (req) => {
    if (process.env.NODE_ENV === "test" && req.get("X-Test-Rate-Key")) {
      return 2;
    }

    return Number(process.env.API_RATE_LIMIT || 100);
  },

  keyGenerator: (req) => {
    if (process.env.NODE_ENV === "test" && req.get("X-Test-Rate-Key")) {
      return req.get("X-Test-Rate-Key");
    }

    return ipKeyGenerator(req.ip);
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    res.setHeader("Retry-After", "60");

    return sendProblem(
      res,
      429,
      "rate-limit-exceeded",
      "Too Many Requests",
      "Request limit exceeded. Retry after 60 seconds."
    );
  },
});

app.use("/reports", apiLimiter);

// Validate report fields before database work
function validateReport(body) {
  const errors = [];

  if (
    !Number.isSafeInteger(body.shelterId) ||
    body.shelterId <= 0
  ) {
    errors.push([
      "shelterId",
      "must be a positive integer",
    ]);
  }

  if (
    !Number.isSafeInteger(body.reportedBy) ||
    body.reportedBy <= 0
  ) {
    errors.push([
      "reportedBy",
      "must be a positive integer",
    ]);
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

    return sendData(req, res, 200, {
      service: "disaster-resource-coordination",
      status: "alive",
      database: "connected",
    });
  } catch (error) {
    res.setHeader("Retry-After", "30");

    return sendApiProblem(
      req,
      res,
      503,
      "service-unavailable",
      "Service Unavailable",
      "Database is disconnected; retry after 30 seconds"
    );
  }
});

// Create report with Idempotency-Key support
app.post("/reports", async (req, res, next) => {
  try {
    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "Expected a JSON object"
      );
    }

    const errors = validateReport(body);

    if (errors.length > 0) {
      return sendApiProblem(
        req,
        res,
        422,
        "validation-error",
        "Validation Failed",
        "One or more fields are invalid",
        errors
      );
    }

    const key = req.get("Idempotency-Key");

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!key || !uuidPattern.test(key)) {
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-idempotency-key",
        "Invalid Idempotency-Key",
        "A valid UUID Idempotency-Key header is required"
      );
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
        return sendApiProblem(
          req,
          res,
          409,
          "idempotency-conflict",
          "Conflict",
          "This Idempotency-Key was already used with a different request"
        );
      }

      if (previous.response) {
        return sendData(req, res, 200, previous.response, "report");
      }

      const existing = await store.find(previous.reportId);

      if (existing) {
        return sendData(req, res, 200, existing.asJson(), "report");
      }
    }

    const result = await store.create(
      payload,
      key,
      requestHash
    );

    return sendData(
      req,
      res,
      result.replayed ? 200 : 201,
      result.report,
      "report"
    ).location(`/reports/${result.report.reportId}`);
  } catch (error) {
    if (error.status === 409) {
      return sendApiProblem(
        req,
        res,
        409,
        "idempotency-conflict",
        "Conflict",
        error.message
      );
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

    if (shelterId !== undefined) {
      parsedShelterId = Number(shelterId);

      if (
        !Number.isSafeInteger(parsedShelterId) ||
        parsedShelterId <= 0
      ) {
        return sendApiProblem(
          req,
          res,
          400,
          "invalid-request",
          "Invalid request",
          "shelterId must be a positive integer"
        );
      }
    }

    if (
      severity !== undefined &&
      !VALID_SEVERITIES.has(severity)
    ) {
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "severity must be LOW, MEDIUM, HIGH or CRITICAL"
      );
    }

    if (
      !Number.isSafeInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "limit must be an integer between 1 and 100"
      );
    }

    if (
      !Number.isSafeInteger(parsedOffset) ||
      parsedOffset < 0
    ) {
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "offset must be a non-negative integer"
      );
    }

    if (!ALLOWED_SORT_FIELDS.has(sortBy)) {
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "sortBy must be reportId, createdAt or severity"
      );
    }

    if (!["asc", "desc"].includes(order)) {
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "order must be asc or desc"
      );
    }

    const reports = await store.list({
      shelterId: parsedShelterId,
      severity,
      limit: parsedLimit,
      offset: parsedOffset,
      sortBy,
      order,
    });

    return sendData(
      req,
      res,
      200,
      reports.map((report) => report.asJson()),
      "reports"
    );
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
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "reportId must be a positive integer"
      );
    }

    const report = await store.find(reportId);

    if (!report) {
      return sendApiProblem(
        req,
        res,
        404,
        "report-not-found",
        "Report not found",
        `No report exists with ID ${reportId}`
      );
    }

    return sendData(req, res, 200, report.asJson(), "report");
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
      return sendApiProblem(
        req,
        res,
        400,
        "invalid-request",
        "Invalid request",
        "reportId must be a positive integer"
      );
    }

    next();
  },

  async (req, res, next) => {
    try {
      const report = await store.find(
        Number(req.params.reportId)
      );

      if (!report) {
        return sendApiProblem(
          req,
          res,
          404,
          "report-not-found",
          "Report not found",
          `No report exists with ID ${req.params.reportId}`
        );
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
        return sendApiProblem(
          req,
          res,
          400,
          "missing-photo",
          "Missing photo",
          'Upload one image using the multipart field "photo"'
        );
      }

      const saved = await photoStore.savePhoto(
        Number(req.params.reportId),
        req.file
      );

      const response = {
        photoId: Number(saved.photo_id),
        reportId: Number(saved.report_id),
        fileName: saved.file_name,
        contentType: saved.content_type,
        fileSizeBytes: saved.file_size_bytes,
        storagePath: saved.storage_path,
        uploadedAt: saved.uploaded_at,
      };

      return sendData(req, res, 201, response, "photo")
        .location(
          `/reports/${saved.report_id}/photos/${saved.photo_id}`
        );
    } catch (error) {
      next(error);
    }
  }
);

// OPTIONS support
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

// Unknown routes
app.use((req, res) => {
  return sendApiProblem(
    req,
    res,
    404,
    "route-not-found",
    "Not Found",
    `Route ${req.method} ${req.originalUrl} not found`
  );
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
    return sendApiProblem(
      req,
      res,
      400,
      "invalid-json",
      "Invalid JSON",
      "Request body contains malformed JSON"
    );
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return sendApiProblem(
      req,
      res,
      413,
      "file-too-large",
      "Payload Too Large",
      "Photo size must not exceed 5 MB"
    );
  }

  if (
    err.code === "LIMIT_FILE_COUNT" ||
    err.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    return sendApiProblem(
      req,
      res,
      400,
      "invalid-upload",
      "Invalid upload",
      "Upload exactly one image using the multipart field 'photo'"
    );
  }

  if (
    err.code === "INVALID_FILE_TYPE" ||
    err.status === 400
  ) {
    return sendApiProblem(
      req,
      res,
      400,
      "invalid-file-type",
      "Invalid file type",
      err.message || "Only JPEG, PNG and WebP images are allowed"
    );
  }

  console.error(err.message);

  return sendApiProblem(
    req,
    res,
    500,
    "internal-error",
    "Internal Server Error",
    "An unexpected error occurred"
  );
});

const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DRC API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
