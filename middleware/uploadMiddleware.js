import multer from "multer";
import path from "path";
import fs from "fs";

/* =========================================
   Ensure Upload Directory Exists
========================================= */

// ✅ Make upload folder inside server
const uploadDir = path.resolve("server/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =========================================
   Allowed File Types
========================================= */
const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

/* =========================================
   Storage Configuration
========================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const extension = path.extname(file.originalname);

    cb(null, `card-${uniqueSuffix}${extension}`);
  }
});

/* =========================================
   File Filter
========================================= */
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error(
      "Only JPEG, JPG, PNG, and WEBP images are allowed"
    );
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

/* =========================================
   Multer Configuration
========================================= */
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per image
  }
});

export default uploadMiddleware;