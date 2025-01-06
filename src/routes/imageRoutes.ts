import express from "express";
import multer from "multer";
import { ImageHandler } from "../utils/imageHandler";
import { compressImage, closeImagePool } from "../utils/squoosh";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  CompressImageOptions,
} from "../utils/types";
import path from "path";
import fs from "fs";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
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

    console.log(`Received ${files.length} files for compression`);

    const compressedFiles = await Promise.all(
      files.map(async (file, index) => {
        console.log(`Processing file ${index + 1}: ${file.originalname}`);
        console.log(`File size: ${file.size} bytes`);
        console.log(`File MIME type: ${file.mimetype}`);

        const buffer = await fs.promises.readFile(file.path);
        console.log(`Read file into buffer, size: ${buffer.length} bytes`);

        try {
          const compressedFile = await compressImage(buffer, compressOptions);
          console.log(`Successfully compressed file ${index + 1}`);
          await fs.promises.writeFile(file.path, compressedFile.buffer);
          console.log(`Wrote compressed file back to disk`);
          return { ...compressedFile, path: file.path };
        } catch (compressionError) {
          console.error(
            `Error compressing file ${index + 1}:`,
            compressionError
          );
          // Instead of throwing, we'll return the original file
          console.log(
            `Returning original file for ${index + 1} due to compression error`
          );
          return {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            buffer: buffer,
            size: file.size,
            path: file.path,
          };
        }
      })
    );

    console.log(`All files processed, proceeding to upload`);

    const imageHandler = new ImageHandler();
    const results = await imageHandler.uploadMultipleFiles(
      compressedFiles,
      folder
    );

    console.log(`Upload complete, results:`, results);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error processing files:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    res
      .status(500)
      .json({
        error: "Error processing files",
        details: error instanceof Error ? error.message : String(error),
      });
  } finally {
    await closeImagePool();
    // Clean up temporary files
    await Promise.all(
      files.map((file) => fs.promises.unlink(file.path).catch(console.error))
    );
  }
});

export default router;
