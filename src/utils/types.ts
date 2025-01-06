export type ImageFormat = "mozjpeg" | "webp" | "avif";

export interface CompressImageOptions {
  quality: number;
  resize?: { width: number; height?: number };
  format: ImageFormat;
}

export interface CompressedImage {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadResult {
  filename: string;
  size: number;
  mimeType: string;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
