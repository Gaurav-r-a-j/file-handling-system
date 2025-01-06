import { ImagePool } from "@squoosh/lib";
import { CompressImageOptions, CompressedImage } from "./types";
import * as FileType from "file-type";

let imagePool: ImagePool | null = null;

function getImagePool(): ImagePool {
  if (!imagePool) {
    imagePool = new ImagePool(1);
  }
  return imagePool;
}

const supportedInputFormats = ["jpg", "jpeg", "png", "webp", "avif"];

export async function compressImage(
  inputBuffer: Buffer,
  options: CompressImageOptions
): Promise<CompressedImage> {
  const pool = getImagePool();
  let image: any;

  try {
    if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length === 0) {
      throw new Error("Invalid input: empty or not a buffer");
    }

    console.log(`Compressing image with options:`, JSON.stringify(options));
    console.log(`Input buffer size: ${inputBuffer.length} bytes`);

    // Check if the input format is supported
    const fileType = await FileType.fromBuffer(inputBuffer);
    if (!fileType || !supportedInputFormats.includes(fileType.ext)) {
      throw new Error(
        `Unsupported input format: ${fileType ? fileType.ext : "unknown"}`
      );
    }
    console.log(`Detected input format: ${fileType.ext}`);

    image = pool.ingestImage(inputBuffer);
    console.log("Image ingested successfully");

    const encodeOptions: Record<string, any> = {
      [options.format]: {
        quality: options.quality,
      },
    };

    if (options.resize) {
      console.log(`Resizing image to: ${JSON.stringify(options.resize)}`);
      await image.preprocess({
        resize: {
          width: options.resize.width,
          height: options.resize.height,
        },
      });
      console.log("Image resized successfully");
    }

    console.log(`Encoding image to ${options.format}`);
    try {
      await image.encode(encodeOptions);
    } catch (encodeError) {
      console.error(`Error during encoding:`, encodeError);
      throw encodeError;
    }

    const encodedImage = image.encodedWith[options.format];
    if (!encodedImage) {
      throw new Error(`Failed to encode image to ${options.format}`);
    }

    console.log("Retrieving binary data from encoded image");
    const rawEncodedImage = await encodedImage.binary;
    console.log(`Compressed image size: ${rawEncodedImage.length} bytes`);

    return {
      fieldname: "image",
      originalname: `compressed.${options.format}`,
      encoding: "7bit",
      mimetype: `image/${options.format}`,
      buffer: Buffer.from(rawEncodedImage),
      size: rawEncodedImage.length,
    };
  } catch (error) {
    console.error("Error compressing image:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    throw error;
  } finally {
    if (image && typeof image.close === "function") {
      await image.close();
    }
  }
}

export async function closeImagePool(): Promise<void> {
  if (imagePool) {
    await imagePool.close();
    imagePool = null;
  }
}
