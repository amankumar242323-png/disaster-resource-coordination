
class Report {
  constructor({
    reportId,
    shelterId,
    reportedBy,
    reportType,
    severity,
    description,
    occupancyCount = null,
    createdAt = new Date().toISOString(),
  }) {
    this.reportId = reportId;
    this.shelterId = shelterId;
    this.reportedBy = reportedBy;
    this.reportType = reportType;
    this.severity = severity;
    this.description = description;
    this.occupancyCount = occupancyCount;
    this.createdAt = createdAt;
  }

  asJson() {
    return {
      reportId: this.reportId,
      shelterId: this.shelterId,
      reportedBy: this.reportedBy,
      reportType: this.reportType,
      severity: this.severity,
      description: this.description,
      occupancyCount: this.occupancyCount,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Report;
