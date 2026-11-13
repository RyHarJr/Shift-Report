import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const SAFE_FILENAME_REGEX = /^[0-9]+-[0-9a-f-]+\.(jpg|png|webp)$/i;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/uploads/[filename]">,
) {
  const { filename } = await context.params;
  if (!SAFE_FILENAME_REGEX.test(filename)) {
    return new Response("Not Found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    const fileBuffer = await fs.readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType = EXT_TO_MIME[ext] ?? "application/octet-stream";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

