const request = require("supertest");
const crypto = require("node:crypto");
const app = require("../app");
const pool = require("../db");

describe("Field Reports API", () => {
  const makeReport = () => ({
    shelterId: 1,
    reportedBy: 101,
    reportType: "FOOD_SHORTAGE",
    severity: "HIGH",
    description: "Food supplies are insufficient",
    occupancyCount: 150,
  });

  test("GET /health returns alive status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("alive");
  });

  test("POST /reports creates a report", async () => {
    const response = await request(app)
      .post("/reports")
      .set("Idempotency-Key", crypto.randomUUID())
      .send(makeReport());

    expect(response.status).toBe(201);
    expect(response.body.reportId).toBeDefined();
  });

  test("GET /reports returns a list", async () => {
    const response = await request(app).get("/reports");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /reports/:reportId returns a report", async () => {
    const created = await request(app)
      .post("/reports")
      .set("Idempotency-Key", crypto.randomUUID())
      .send(makeReport());

    const response = await request(app).get(
      `/reports/${created.body.reportId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.reportId).toBe(created.body.reportId);
  });

  test("Same idempotency key does not create a duplicate", async () => {
    const key = crypto.randomUUID();
    const body = makeReport();

    const first = await request(app)
      .post("/reports")
      .set("Idempotency-Key", key)
      .send(body);

    const second = await request(app)
      .post("/reports")
      .set("Idempotency-Key", key)
      .send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.reportId).toBe(first.body.reportId);
  });

  test("Same key with different payload returns 409", async () => {
    const key = crypto.randomUUID();

    await request(app)
      .post("/reports")
      .set("Idempotency-Key", key)
      .send(makeReport());

    const response = await request(app)
      .post("/reports")
      .set("Idempotency-Key", key)
      .send({
        ...makeReport(),
        description: "Different description",
      });

    expect(response.status).toBe(409);
  });

  test("Concurrent requests with the same key do not create duplicates", async () => {
    const key = crypto.randomUUID();
    const body = makeReport();

    const [first, second] = await Promise.all([
      request(app)
        .post("/reports")
        .set("Idempotency-Key", key)
        .send(body),
      request(app)
        .post("/reports")
        .set("Idempotency-Key", key)
        .send(body),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 201]);
    expect(first.body.reportId).toBe(second.body.reportId);
  });

  test("Expired idempotency key can be reused", async () => {
    const key = crypto.randomUUID();
    const body = makeReport();

    const first = await request(app)
      .post("/reports")
      .set("Idempotency-Key", key)
      .send(body);

    expect(first.status).toBe(201);

    await pool.query(
      `UPDATE reports.report_idempotency
       SET expires_at = NOW() - INTERVAL '1 minute'
       WHERE idempotency_key = $1`,
      [key]
    );

    const second = await request(app)
      .post("/reports")
      .set("Idempotency-Key", key)
      .send(body);

    expect(second.status).toBe(201);
    expect(second.body.reportId).not.toBe(first.body.reportId);
  });

  test("Invalid severity returns 400", async () => {
    const response = await request(app)
      .post("/reports")
      .set("Idempotency-Key", crypto.randomUUID())
      .send({
        ...makeReport(),
        severity: "URGENT",
      });

    expect(response.status).toBe(400);
  });

  test("Missing report returns 404", async () => {
    const response = await request(app).get("/reports/999999999");

    expect(response.status).toBe(404);
  });
});


  describe("Report photo uploads", () => {
    const makeReport = () => ({
      shelterId: 1,
      reportedBy: 101,
      reportType: "FOOD_SHORTAGE",
      severity: "HIGH",
      description: "Food supplies are insufficient",
      occupancyCount: 150,
    });

    let reportId;

    beforeAll(async () => {
      const response = await request(app)
        .post("/reports")
        .set("Idempotency-Key", crypto.randomUUID())
        .send(makeReport());

      expect(response.status).toBe(201);
      reportId = response.body.reportId;
    });

    test("Uploads a PNG photo and saves metadata", async () => {
      // Minimal valid 1x1 PNG image.
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv2sAAAAASUVORK5CYII=",
        "base64"
      );

      const response = await request(app)
        .post(`/reports/${reportId}/photos`)
        .attach("photo", png, {
          filename: "evidence.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(201);
      expect(response.body.reportId).toBe(reportId);
      expect(response.body.contentType).toBe("image/png");
      expect(response.body.fileSizeBytes).toBe(png.length);

      const saved = await pool.query(
        `SELECT photo_id FROM reports.report_photos
         WHERE photo_id = $1 AND report_id = $2`,
        [response.body.photoId, reportId]
      );

      expect(saved.rowCount).toBe(1);
    });

    test("Missing photo returns 400", async () => {
      const response = await request(app)
        .post(`/reports/${reportId}/photos`);

      expect(response.status).toBe(400);
    });

    test("Unsupported file type returns 400", async () => {
      const response = await request(app)
        .post(`/reports/${reportId}/photos`)
        .attach("photo", Buffer.from("not an image"), {
          filename: "notes.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(400);
    });

    test("Oversized photo returns 413", async () => {
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 1);

      const response = await request(app)
        .post(`/reports/${reportId}/photos`)
        .attach("photo", oversized, {
          filename: "large.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(413);
    });

    test("Nonexistent report returns 404", async () => {
      const response = await request(app)
        .post("/reports/999999999/photos")
        .attach("photo", Buffer.from("image"), {
          filename: "evidence.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(404);
    });
  });

afterAll(async () => {
  await pool.end();
});
