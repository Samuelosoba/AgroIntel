import multer from "multer";
import { HttpError } from "../lib/http-error.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, "Please upload a JPG, PNG or WebP photo"));
  },
});
