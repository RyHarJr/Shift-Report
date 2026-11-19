import { NextRequest } from "next/server";
import { handleApiError, okResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import {
  MAX_RAW_UPLOAD_BYTES,
  optimizeUploadedImage,
  type UploadImageExt,
} from "@/modules/uploads/image-optimizer";
import { uploadImageToPowerAutomate } from "@/modules/uploads/power-automate-image.client";
import { buildUploadImageUrl } from "@/modules/uploads/upload-url";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function buildUploadFileName(
  originalName: string,
  ext: UploadImageExt,
): string {
  const leafName = originalName.split(/[/\\]/).pop() ?? "shift-photo";
  const withoutExt = leafName.replace(/\.[^.]+$/, "");
  const sanitized = withoutExt
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `${sanitized || "shift-photo"}.${ext}`;
}

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
    const fileName = buildUploadFileName(file.name, optimized.ext);

    const uploaded = await uploadImageToPowerAutomate({
      fileName,
      buffer: optimized.buffer,
      contentType: optimized.mimeType,
    });

    return okResponse(
      {
        id: uploaded.id,
        url: buildUploadImageUrl(uploaded.id),
        filename: uploaded.name,
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
