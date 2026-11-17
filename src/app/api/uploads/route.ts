import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { handleApiError, okResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import {
  MAX_RAW_UPLOAD_BYTES,
  optimizeUploadedImage,
} from "@/modules/uploads/image-optimizer";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("File foto wajib dipilih.", 400, "FILE_REQUIRED");
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new AppError(
        "Format gambar harus JPG, PNG, atau WebP.",
        415,
        "UNSUPPORTED_MEDIA_TYPE",
      );
    }

    if (file.size > MAX_RAW_UPLOAD_BYTES) {
      throw new AppError(
        "Ukuran foto maksimal 15 MB.",
        413,
        "PAYLOAD_TOO_LARGE",
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeUploadedImage(rawBuffer, file.type);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomUUID()}.${optimized.ext}`;
    const targetPath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(targetPath, optimized.buffer);

    return okResponse(
      {
        url: `/api/uploads/${filename}`,
        filename,
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize,
        width: optimized.width,
        height: optimized.height,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

