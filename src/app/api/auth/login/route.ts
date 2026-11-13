import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, okResponse } from "@/lib/api-response";
import { loginAdmin } from "@/modules/auth/auth.service";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi.").max(60),
  password: z.string().min(1, "Password wajib diisi.").max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const { username, password } = loginSchema.parse(body);

    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() || "local";

    const result = await loginAdmin(username, password, clientIp);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

