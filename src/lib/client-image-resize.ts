const MAX_CLIENT_DIMENSION = 1600;
const SKIP_CLIENT_REENCODE_BYTES = 350 * 1024; // Avoid redundant re-compression on already small <=1600px files
const SECONDARY_COMPRESSION_THRESHOLD_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface ClientImageOptimizeResult {
  file: File;
  originalSize: number;
  clientSize: number;
  optimizedInBrowser: boolean;
}

/** Formats byte counts into compact readable labels (e.g. "2.4 MB", "185 KB"). */
export function formatBytesLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function loadHtmlImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function replaceExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.${ext}`;
}

/**
 * Optimizes an image File in the browser before upload:
 * caps dimensions exceeding 1600px proportionally without cropping,
 * and compresses large payloads so mobile camera photos (> 5 MB) upload reliably.
 */
export async function optimizeImageBeforeUpload(
  file: File,
): Promise<ClientImageOptimizeResult> {
  const fallback: ClientImageOptimizeResult = {
    file,
    originalSize: file.size,
    clientSize: file.size,
    optimizedInBrowser: false,
  };

  if (typeof window === "undefined" || !ALLOWED_MIME_TYPES.has(file.type)) {
    return fallback;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(objectUrl);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) {
      return fallback;
    }

    const maxSide = Math.max(width, height);
    const needsDownscale = maxSide > MAX_CLIENT_DIMENSION;

    if (!needsDownscale && file.size <= SKIP_CLIENT_REENCODE_BYTES) {
      return fallback;
    }

    const scale = needsDownscale ? MAX_CLIENT_DIMENSION / maxSide : 1;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return fallback;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const targetMime =
      file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const initialQuality = file.type === "image/jpeg" ? 0.84 : 0.86;

    let blob = await canvasToBlob(canvas, targetMime, initialQuality);
    if (!blob) {
      return fallback;
    }

    const actualMime = ALLOWED_MIME_TYPES.has(blob.type)
      ? blob.type
      : targetMime;
    if (
      blob.size > SECONDARY_COMPRESSION_THRESHOLD_BYTES &&
      (actualMime === "image/jpeg" || actualMime === "image/webp")
    ) {
      const tighter = await canvasToBlob(canvas, actualMime, 0.74);
      if (tighter && tighter.size < blob.size) {
        blob = tighter;
      }
    }

    // Never upload a larger payload if dimensions were already unchanged
    if (!needsDownscale && blob.size >= file.size) {
      return fallback;
    }

    const resolvedMime = ALLOWED_MIME_TYPES.has(blob.type)
      ? blob.type
      : targetMime;
    const ext =
      resolvedMime === "image/jpeg"
        ? "jpg"
        : resolvedMime === "image/webp"
          ? "webp"
          : "png";

    const optimizedFile = new File([blob], replaceExtension(file.name, ext), {
      type: resolvedMime,
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      originalSize: file.size,
      clientSize: optimizedFile.size,
      optimizedInBrowser: true,
    };
  } catch {
    return fallback;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

