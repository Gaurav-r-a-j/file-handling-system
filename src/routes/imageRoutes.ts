import express from "express";
import multer from "multer";
import { ImageHandler } from "../utils/imageHandler";
import { compressImage, closeImagePool } from "../utils/squoosh";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  CompressImageOptions,
} from "../utils/types";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

router.post("/upload-multiple", upload.array("images"), async (req, res) => {
  const folder = req.body.folder as string;
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const compressOptions: CompressImageOptions = {
      quality: 80,
      format: "webp",
    };

    const compressedFiles = await Promise.all(
      files.map(async (file) => {
        return await compressImage(file.buffer, compressOptions);
      })
    );

    const imageHandler = new ImageHandler();
    const results = await imageHandler.uploadMultipleFiles(
      compressedFiles,
      folder
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).json({ error: "Error processing files" });
  } finally {
    await closeImagePool();
  }
});

export default router;
