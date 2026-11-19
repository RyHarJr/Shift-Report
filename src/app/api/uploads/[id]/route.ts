import { NextRequest, connection } from "next/server";
import { AppError, NotFoundError } from "@/lib/errors";
import { getImageFromPowerAutomate } from "@/modules/uploads/power-automate-image.client";
import { isValidUploadImageId } from "@/modules/uploads/upload-url";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/uploads/[id]">,
) {
  await connection();
  const { id } = await context.params;
  if (!isValidUploadImageId(id)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const { buffer, contentType } = await getImageFromPowerAutomate(id);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response("Not Found", { status: 404 });
    }
    if (error instanceof AppError) {
      return new Response(error.message, {
        status: error.statusCode,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return new Response("Gagal memuat gambar.", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

