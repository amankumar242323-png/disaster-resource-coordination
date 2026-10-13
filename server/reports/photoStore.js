const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const pool = require("../db");

const uploadDirectory = path.resolve(__dirname, "../uploads/report-photos");

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function savePhoto(reportId, file) {
  await fs.mkdir(uploadDirectory, { recursive: true });

  const extension = extensions[file.mimetype];
  if (!extension) {
    const error = new Error("Unsupported image type");
    error.status = 400;
    throw error;
  }

  const storedName = `${crypto.randomUUID()}${extension}`;
  const absolutePath = path.join(uploadDirectory, storedName);
  const storagePath = path.posix.join("uploads", "report-photos", storedName);

  await fs.writeFile(absolutePath, file.buffer, { flag: "wx" });

  try {
    const result = await pool.query(
      `INSERT INTO reports.report_photos
       (report_id, file_name, content_type, file_size_bytes, storage_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING photo_id, report_id, file_name, content_type,
                 file_size_bytes, storage_path, uploaded_at`,
      [
        reportId,
        path.basename(file.originalname).slice(0, 255),
        file.mimetype,
        file.size,
        storagePath,
      ]
    );

    return result.rows[0];
  } catch (error) {
    await fs.unlink(absolutePath).catch(() => {});
    throw error;
  }
}

module.exports = { savePhoto };
