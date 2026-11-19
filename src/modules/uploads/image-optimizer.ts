import sharp from "sharp";
import { AppError } from "@/lib/errors";

export const MAX_RAW_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB raw safety cap
export const MAX_OPTIMIZED_UPLOAD_BYTES = 5 * 1024 * 1024; // Safe <5 MB target for Power Automate JSON/base64 payload
export const MAX_UPLOAD_IMAGE_DIMENSION = 1600; // Longest edge in px, preserves aspect ratio
const SECONDARY_COMPRESSION_DIMENSION = 1280;

export type UploadImageExt = "jpg" | "png" | "webp";
export type UploadImageMime = "image/jpeg" | "image/png" | "image/webp";

const MIME_TO_EXT: Record<string, UploadImageExt> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const EXT_TO_MIME: Record<UploadImageExt, UploadImageMime> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const SUPPORTED_SHARP_FORMATS = new Set(["jpeg", "png", "webp"]);

export interface OptimizedImageResult {
  buffer: Buffer;
  ext: UploadImageExt;
  mimeType: UploadImageMime;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

export function extToMimeType(ext: UploadImageExt): UploadImageMime {
  return EXT_TO_MIME[ext];
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

async function runCompressionPass(
  rawBuffer: Buffer,
  sourceMime: string,
  maxDimension: number,
  jpegQuality: number,
  webpQuality: number,
): Promise<{
  data: Buffer;
  width: number;
  height: number;
  ext: UploadImageExt;
}> {
  const pipeline = sharp(rawBuffer)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    });

  let targetExt: UploadImageExt;
  if (sourceMime === "image/jpeg") {
    pipeline.jpeg({ quality: jpegQuality, mozjpeg: true });
    targetExt = "jpg";
  } else {
    // WebP shrinks both opaque/transparent PNG screenshots & WebP images while preserving dimensions
    pipeline.webp({ quality: webpQuality });
    targetExt = "webp";
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return {
    data,
    width: info.width,
    height: info.height,
    ext: targetExt,
  };
}

/**
 * Validates and compresses an uploaded raster image using Sharp.
 * Keeps original pixel dimensions untouched up to MAX_UPLOAD_IMAGE_DIMENSION,
 * scales down larger photos proportionally without cropping, and ensures the
 * resulting payload fits within MAX_OPTIMIZED_UPLOAD_BYTES (5 MB).
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

  let result = await runCompressionPass(
    rawBuffer,
    mimeType,
    MAX_UPLOAD_IMAGE_DIMENSION,
    82,
    85,
  );

  // Avoid enlarging an already well-optimized file that did not require resize/orientation fix
  if (
    !needsDimensionCap &&
    !hasExifRotation &&
    result.data.length >= rawBuffer.length &&
    rawBuffer.length <= MAX_OPTIMIZED_UPLOAD_BYTES
  ) {
    return {
      buffer: rawBuffer,
      ext: originalExt,
      mimeType: extToMimeType(originalExt),
      originalSize: rawBuffer.length,
      optimizedSize: rawBuffer.length,
      width: orientedW,
      height: orientedH,
    };
  }

  if (result.data.length > MAX_OPTIMIZED_UPLOAD_BYTES) {
    result = await runCompressionPass(
      rawBuffer,
      mimeType,
      SECONDARY_COMPRESSION_DIMENSION,
      72,
      75,
    );
  }

  if (result.data.length > MAX_OPTIMIZED_UPLOAD_BYTES) {
    throw new AppError(
      "Ukuran foto setelah kompresi melebihi batas 5 MB.",
      413,
      "PAYLOAD_TOO_LARGE",
    );
  }

  return {
    buffer: result.data,
    ext: result.ext,
    mimeType: extToMimeType(result.ext),
    originalSize: rawBuffer.length,
    optimizedSize: result.data.length,
    width: result.width,
    height: result.height,
  };
}
