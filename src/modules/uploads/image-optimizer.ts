import sharp from "sharp";
import { AppError } from "@/lib/errors";

export const MAX_RAW_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB raw safety cap
export const MAX_UPLOAD_IMAGE_DIMENSION = 1600; // Longest edge in px, preserves aspect ratio

const MIME_TO_EXT: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const SUPPORTED_SHARP_FORMATS = new Set(["jpeg", "png", "webp"]);

export interface OptimizedImageResult {
  buffer: Buffer;
  ext: "jpg" | "png" | "webp";
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

async function readImageMetadata(rawBuffer: Buffer) {
  try {
    return await sharp(rawBuffer).metadata();
  } catch {
    throw new AppError(
      "File foto tidak valid atau rusak.",
      400,
      "INVALID_IMAGE",
    );
  }
}

/**
 * Validates and compresses an uploaded raster image using Sharp.
 * Keeps original pixel dimensions untouched up to MAX_UPLOAD_IMAGE_DIMENSION,
 * scales down larger photos proportionally without cropping, and strips bloat metadata.
 */
export async function optimizeUploadedImage(
  rawBuffer: Buffer,
  mimeType: string,
): Promise<OptimizedImageResult> {
  const originalExt = MIME_TO_EXT[mimeType];
  if (!originalExt) {
    throw new AppError(
      "Format gambar harus JPG, PNG, atau WebP.",
      415,
      "UNSUPPORTED_MEDIA_TYPE",
    );
  }

  const metadata = await readImageMetadata(rawBuffer);

  if (
    !metadata.width ||
    !metadata.height ||
    !SUPPORTED_SHARP_FORMATS.has(metadata.format ?? "")
  ) {
    throw new AppError(
      "File foto tidak valid atau format tidak didukung.",
      400,
      "INVALID_IMAGE",
    );
  }

  const hasExifRotation = (metadata.orientation ?? 1) > 1;
  const isSwappedAxis =
    (metadata.orientation ?? 1) >= 5 && (metadata.orientation ?? 1) <= 8;
  const orientedW = isSwappedAxis ? metadata.height : metadata.width;
  const orientedH = isSwappedAxis ? metadata.width : metadata.height;
  const needsDimensionCap =
    Math.max(orientedW, orientedH) > MAX_UPLOAD_IMAGE_DIMENSION;

  const pipeline = sharp(rawBuffer)
    .rotate()
    .resize({
      width: MAX_UPLOAD_IMAGE_DIMENSION,
      height: MAX_UPLOAD_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  let targetExt: "jpg" | "png" | "webp" = originalExt;
  if (mimeType === "image/jpeg") {
    pipeline.jpeg({ quality: 82, mozjpeg: true });
    targetExt = "jpg";
  } else {
    // WebP shrinks both opaque/transparent PNG screenshots & WebP images while preserving dimensions
    pipeline.webp({ quality: 85 });
    targetExt = "webp";
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  // Avoid enlarging an already well-optimized file that did not require resize/orientation fix
  if (!needsDimensionCap && !hasExifRotation && data.length >= rawBuffer.length) {
    return {
      buffer: rawBuffer,
      ext: originalExt,
      originalSize: rawBuffer.length,
      optimizedSize: rawBuffer.length,
      width: orientedW,
      height: orientedH,
    };
  }

  return {
    buffer: data,
    ext: targetExt,
    originalSize: rawBuffer.length,
    optimizedSize: data.length,
    width: info.width,
    height: info.height,
  };
}
