import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { handleApiError, okResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("File foto wajib dipilih.", 400, "FILE_REQUIRED");
    }

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      throw new AppError(
        "Format gambar harus JPG, PNG, atau WebP.",
        415,
        "UNSUPPORTED_MEDIA_TYPE",
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        "Ukuran foto maksimal 5 MB.",
        413,
        "PAYLOAD_TOO_LARGE",
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const targetPath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    return okResponse({ url: `/api/uploads/${filename}`, filename }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

