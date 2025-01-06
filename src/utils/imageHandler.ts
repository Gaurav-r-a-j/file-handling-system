import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { ALLOWED_MIME_TYPES, CompressedImage, UploadResult } from "./types";

export class ImageHandler {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    if (!process.env.AWS_REGION || !process.env.UPLOAD_BUCKET) {
      throw new Error(
        "AWS_REGION and UPLOAD_BUCKET environment variables are required"
      );
    }

    AWS.config.update({ region: process.env.AWS_REGION });
    this.s3 = new AWS.S3();
    this.bucket = process.env.UPLOAD_BUCKET;
  }

  async uploadMultipleFiles(
    files: CompressedImage[],
    folder: string
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadSingleFile(file, folder)
    );

    return Promise.all(uploadPromises);
  }

  private async uploadSingleFile(
    file: CompressedImage,
    folder: string
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(`Unsupported MIME type: ${file.mimetype}`);
    }

    const filename = `${folder}/${uuidv4()}-${file.originalname}`;

    await this.uploadToS3(file.buffer, filename, file.mimetype);

    return {
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private async uploadToS3(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<void> {
    await this.s3
      .upload({
        Bucket: this.bucket,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimeType,
      })
      .promise();
  }
}
