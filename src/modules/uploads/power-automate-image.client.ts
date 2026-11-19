import "server-only";
import sharp from "sharp";
import { z } from "zod";
import { AppError, NotFoundError } from "@/lib/errors";
import { MAX_OPTIMIZED_UPLOAD_BYTES } from "./image-optimizer";
import { isValidUploadImageId } from "./upload-url";

const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;

const CACHE_MAX_ENTRIES = 30;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const SHARP_FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

interface CachedImageEntry {
  buffer: Buffer;
  contentType: string;
  expiresAt: number;
}

export interface PowerAutomateUploadedImage {
  id: string;
  name: string;
}

export interface PowerAutomateFetchedImage {
  buffer: Buffer;
  contentType: string;
}

const imageCache = new Map<string, CachedImageEntry>();
const inFlightGetRequests = new Map<string, Promise<PowerAutomateFetchedImage>>();

const uploadResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
  name: z.string().trim().min(1),
});

const getResponseSchema = z.object({
  contentBase64: z.string().trim().min(1),
  contentType: z.string().trim().optional(),
});

function getUploadImageEndpoint(): string {
  const endpoint =
    process.env.UPLOAD_IMAGE?.trim() ||
    process.env.POWER_AUTOMATE_UPLOAD_URL?.trim();
  if (!endpoint) {
    throw new AppError(
      "Konfigurasi layanan upload gambar belum diatur di server.",
      500,
      "STORAGE_NOT_CONFIGURED",
    );
  }
  return endpoint;
}

function getGetImageEndpoint(): string {
  const endpoint =
    process.env.GET_IMAGE?.trim() ||
    process.env.POWER_AUTOMATE_GET_URL?.trim();
  if (!endpoint) {
    throw new AppError(
      "Konfigurasi layanan pengambilan gambar belum diatur di server.",
      500,
      "STORAGE_NOT_CONFIGURED",
    );
  }
  return endpoint;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCachedImage(id: string): PowerAutomateFetchedImage | null {
  const entry = imageCache.get(id);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    imageCache.delete(id);
    return null;
  }

  return {
    buffer: entry.buffer,
    contentType: entry.contentType,
  };
}

function setCachedImage(id: string, image: PowerAutomateFetchedImage): void {
  if (image.buffer.length > CACHE_MAX_BYTES) {
    return;
  }

  imageCache.delete(id);
  if (imageCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey !== undefined) {
      imageCache.delete(oldestKey);
    }
  }

  imageCache.set(id, {
    buffer: image.buffer,
    contentType: image.contentType,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function mapUpstreamHttpError(status: number): AppError {
  if (status === 400) {
    return new AppError(
      "Permintaan ke layanan penyimpanan gambar tidak valid.",
      400,
      "UPSTREAM_BAD_REQUEST",
    );
  }
  if (status === 401 || status === 403) {
    return new AppError(
      "Autentikasi layanan penyimpanan gambar gagal. Hubungi administrator.",
      502,
      "UPSTREAM_AUTH_ERROR",
    );
  }
  if (status === 404) {
    return new NotFoundError("Gambar tidak ditemukan.");
  }
  if (status === 413) {
    return new AppError(
      "Ukuran gambar melebihi batas yang diizinkan layanan penyimpanan.",
      413,
      "PAYLOAD_TOO_LARGE",
    );
  }
  if (status === 429) {
    return new AppError(
      "Layanan penyimpanan gambar sedang sibuk. Silakan coba lagi sebentar.",
      429,
      "UPSTREAM_RATE_LIMITED",
    );
  }
  return new AppError(
    "Layanan penyimpanan gambar mengalami gangguan sementara. Silakan coba lagi.",
    502,
    "UPSTREAM_ERROR",
  );
}

async function postPowerAutomateJson(
  endpoint: string,
  action: "uploadImage" | "getImage",
  body: Record<string, unknown>,
): Promise<unknown> {
  let attempt = 0;

  while (true) {
    attempt += 1;
    const startedAt = Date.now();
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      console.error("[POWER_AUTOMATE_NETWORK_ERROR]", {
        action,
        attempt,
        durationMs,
        isTimeout,
      });
      throw new AppError(
        isTimeout
          ? "Waktu koneksi ke layanan penyimpanan gambar habis. Silakan coba lagi."
          : "Gagal terhubung ke layanan penyimpanan gambar.",
        isTimeout ? 504 : 502,
        isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNREACHABLE",
      );
    }

    const durationMs = Date.now() - startedAt;
    const shouldRetry =
      (response.status === 429 || response.status >= 500) &&
      attempt <= MAX_RETRIES;

    if (shouldRetry) {
      await response.text().catch(() => undefined);
      console.warn("[POWER_AUTOMATE_RETRY]", {
        action,
        status: response.status,
        attempt,
        durationMs,
      });
      await sleep(1000 * attempt);
      continue;
    }

    const rawText = await response.text().catch(() => "");

    if (!response.ok) {
      console.error("[POWER_AUTOMATE_HTTP_ERROR]", {
        action,
        status: response.status,
        attempt,
        durationMs,
      });
      throw mapUpstreamHttpError(response.status);
    }

    if (!rawText.trim()) {
      console.error("[POWER_AUTOMATE_EMPTY_RESPONSE]", {
        action,
        status: response.status,
        durationMs,
      });
      throw new AppError(
        "Respons layanan penyimpanan gambar kosong.",
        502,
        "INVALID_UPSTREAM_RESPONSE",
      );
    }

    try {
      return JSON.parse(rawText) as unknown;
    } catch {
      console.error("[POWER_AUTOMATE_INVALID_JSON]", {
        action,
        status: response.status,
        durationMs,
      });
      throw new AppError(
        "Respons layanan penyimpanan gambar tidak valid.",
        502,
        "INVALID_UPSTREAM_RESPONSE",
      );
    }
  }
}

async function resolveValidImageMime(
  buffer: Buffer,
  rawContentType?: string,
): Promise<string> {
  const normalized = rawContentType?.split(";")[0]?.trim().toLowerCase();
  const mappedMime = normalized === "image/jpg" ? "image/jpeg" : normalized;

  if (mappedMime && ALLOWED_IMAGE_MIMES.has(mappedMime)) {
    return mappedMime;
  }

  try {
    const metadata = await sharp(buffer).metadata();
    const detected = metadata.format
      ? SHARP_FORMAT_TO_MIME[metadata.format]
      : undefined;
    if (detected) {
      return detected;
    }
  } catch {
    // Fall through to invalid upstream image error
  }

  throw new AppError(
    "Konten gambar tidak valid.",
    502,
    "INVALID_UPSTREAM_IMAGE",
  );
}

/** Uploads an optimized image buffer to SharePoint via Power Automate and returns its SharePoint ID & filename. */
export async function uploadImageToPowerAutomate(params: {
  fileName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<PowerAutomateUploadedImage> {
  if (params.buffer.length > MAX_OPTIMIZED_UPLOAD_BYTES) {
    throw new AppError(
      "Ukuran foto setelah kompresi melebihi batas 5 MB.",
      413,
      "PAYLOAD_TOO_LARGE",
    );
  }

  const endpoint = getUploadImageEndpoint();
  const contentBase64 = params.buffer.toString("base64");

  const rawJson = await postPowerAutomateJson(endpoint, "uploadImage", {
    fileName: params.fileName,
    contentBase64,
  });

  const parsed = uploadResponseSchema.safeParse(rawJson);
  if (!parsed.success || !isValidUploadImageId(parsed.data.id)) {
    console.error("[POWER_AUTOMATE_INVALID_UPLOAD_SCHEMA]", {
      action: "uploadImage",
    });
    throw new AppError(
      "Respons upload gambar dari layanan penyimpanan tidak valid.",
      502,
      "INVALID_UPSTREAM_RESPONSE",
    );
  }

  setCachedImage(parsed.data.id, {
    buffer: params.buffer,
    contentType: params.contentType,
  });

  return {
    id: parsed.data.id,
    name: parsed.data.name,
  };
}

/** Fetches an image by SharePoint ID via Power Automate, using a bounded in-memory cache and request deduplication. */
export async function getImageFromPowerAutomate(
  id: string,
): Promise<PowerAutomateFetchedImage> {
  if (!isValidUploadImageId(id)) {
    throw new NotFoundError("Gambar tidak ditemukan.");
  }

  const cached = getCachedImage(id);
  if (cached) {
    return cached;
  }

  const existingInFlight = inFlightGetRequests.get(id);
  if (existingInFlight) {
    return existingInFlight;
  }

  const fetchPromise = (async (): Promise<PowerAutomateFetchedImage> => {
    const endpoint = getGetImageEndpoint();
    const rawJson = await postPowerAutomateJson(endpoint, "getImage", { id });

    const parsed = getResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      console.error("[POWER_AUTOMATE_INVALID_GET_SCHEMA]", {
        action: "getImage",
      });
      throw new AppError(
        "Respons pengambilan gambar dari layanan penyimpanan tidak valid.",
        502,
        "INVALID_UPSTREAM_RESPONSE",
      );
    }

    const rawBase64 = parsed.data.contentBase64;
    const dataUriPrefix = /^data:[^;]+;base64,/i.exec(rawBase64);
    const pureBase64 = dataUriPrefix
      ? rawBase64.slice(dataUriPrefix[0].length)
      : rawBase64;

    const buffer = Buffer.from(pureBase64, "base64");
    if (buffer.length === 0) {
      throw new AppError(
        "Konten gambar tidak valid.",
        502,
        "INVALID_UPSTREAM_IMAGE",
      );
    }

    const contentType = await resolveValidImageMime(
      buffer,
      parsed.data.contentType,
    );

    const image: PowerAutomateFetchedImage = { buffer, contentType };
    setCachedImage(id, image);
    return image;
  })();

  inFlightGetRequests.set(id, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightGetRequests.delete(id);
  }
}

