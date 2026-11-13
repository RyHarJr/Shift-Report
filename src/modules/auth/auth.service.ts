import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { TooManyRequestsError, UnauthorizedError } from "@/lib/errors";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionJwt,
  verifySessionJwt,
} from "./session-cookie";

export interface AuthenticatedAdmin {
  id: string;
  username: string;
  name: string;
  sessionId: string;
}

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(clientKey: string) {
  const now = Date.now();
  const existing = loginAttempts.get(clientKey);
  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(clientKey, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  if (existing.count >= LOGIN_MAX_ATTEMPTS) {
    throw new TooManyRequestsError(
      "Terlalu banyak percobaan login. Tunggu 1 menit sebelum mencoba kembali.",
    );
  }
  existing.count += 1;
}

function clearLoginRateLimit(clientKey: string) {
  loginAttempts.delete(clientKey);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHex] = storedHash.split(":");
  if (!salt || !originalHex) return false;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHex, "hex");
  if (derivedBuffer.length !== originalBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, originalBuffer);
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function loginAdmin(
  username: string,
  password: string,
  clientIp: string,
): Promise<{ admin: { id: string; username: string; name: string } }> {
  const normalizedUsername = username.trim().toLowerCase();
  const rateKey = `${clientIp}:${normalizedUsername}`;
  checkLoginRateLimit(rateKey);

  const user = await prisma.adminUser.findUnique({
    where: { username: normalizedUsername },
    select: {
      id: true,
      username: true,
      name: true,
      passwordHash: true,
    },
  });

  // Always run scrypt even when user is not found to avoid timing leaks
  const dummyHash =
    "00000000000000000000000000000000:000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const passwordValid = user
    ? verifyPassword(password, user.passwordHash)
    : verifyPassword(password, dummyHash) && false;

  if (!user || !passwordValid) {
    throw new UnauthorizedError("Username atau password tidak sesuai.");
  }

  clearLoginRateLimit(rateKey);

  const rawSessionId = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawSessionId);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.adminSession.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const jwt = await signSessionJwt({
    sub: user.id,
    username: user.username,
    name: user.name,
    sid: rawSessionId,
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return {
    admin: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
  };
}

export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionJwt(token);
  if (!payload) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(payload.sid) },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    sessionId: session.id,
  };
}

export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new UnauthorizedError();
  }
  return admin;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    const payload = await verifySessionJwt(token);
    if (payload) {
      await prisma.adminSession
        .deleteMany({
          where: { tokenHash: hashSessionToken(payload.sid) },
        })
        .catch(() => undefined);
    }
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

