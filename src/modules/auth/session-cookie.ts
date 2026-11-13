import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "tel_shift_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionJwtPayload {
  sub: string;
  username: string;
  name: string;
  sid: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET wajib diset minimal 32 karakter pada environment production.",
      );
    }
    return new TextEncoder().encode(
      secret || "dev-only-shift-report-secret-change-in-env-32chars",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionJwt(payload: SessionJwtPayload): Promise<string> {
  return new SignJWT({
    username: payload.username,
    name: payload.name,
    sid: payload.sid,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionJwt(
  token: string,
): Promise<SessionJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.sid !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      name: payload.name,
      sid: payload.sid,
    };
  } catch {
    return null;
  }
}

