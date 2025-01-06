import { ImagePool } from "@squoosh/lib";
import { CompressImageOptions, CompressedImage } from "./types";

let imagePool: ImagePool | null = null;

function getImagePool(): ImagePool {
  if (!imagePool) {
    imagePool = new ImagePool(1);
  }
  return imagePool;
}

export async function compressImage(
  inputBuffer: Buffer,
  options: CompressImageOptions
): Promise<CompressedImage> {
  const pool = getImagePool();
  let image: any;

  try {
    image = pool.ingestImage(inputBuffer);

    const encodeOptions: Record<string, any> = {
      [options.format]: {
        quality: options.quality,
      },
    };

    if (options.resize) {
      await image.preprocess({
        resize: {
          width: options.resize.width,
          height: options.resize.height,
        },
      });
    }

    await image.encode(encodeOptions);

    const encodedImage = image.encodedWith[options.format];
    if (!encodedImage) {
      throw new Error(`Failed to encode image to ${options.format}`);
    }

    const rawEncodedImage = await encodedImage.binary;

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
