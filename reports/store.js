
const Report = require("./models/report");

const reports = new Map();
const idempotencyRecords = new Map();
let nextId = 1;

function create(data, key, requestHash) {
  const report = new Report({
    reportId: nextId++,
    ...data,
  });

  reports.set(report.reportId, report);

  if (key) {
    idempotencyRecords.set(key, {
      requestHash,
      reportId: report.reportId,
    });
  }

  return report;
}

function find(id) {
  return reports.get(id) || null;
}

function findByKey(key) {
  return idempotencyRecords.get(key) || null;
}

function list({ shelterId, severity, limit = 20 } = {}) {
  return [...reports.values()]
    .filter((r) => shelterId == null || r.shelterId === shelterId)
    .filter((r) => !severity || r.severity === severity)
    .sort((a, b) => b.reportId - a.reportId)
    .slice(0, limit);
}

module.exports = { create, find, findByKey, list };
