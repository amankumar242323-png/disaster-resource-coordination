const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function matchesImageSignature(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) return false;

  if (mimeType === "image/png") {
    return buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      );
  }

  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;
  }

  if (mimeType === "image/webp") {
    return buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }

  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error(
        "Only JPEG, PNG and WebP images are allowed"
      );
      error.status = 400;
      error.code = "INVALID_FILE_TYPE";
      return callback(error);
    }

    callback(null, true);
  },
});

upload.validateContent = (req, res, next) => {
  if (!req.file) return next();

  if (!matchesImageSignature(req.file.buffer, req.file.mimetype)) {
    const error = new Error(
      "File content does not match a supported image type"
    );
    error.status = 400;
    error.code = "INVALID_FILE_TYPE";
    return next(error);
  }

  next();
};

module.exports = upload;
