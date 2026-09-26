import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ir_admin";

const SESSION_SECONDS = 60 * 60 * 12;

function adminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length > 0 ? password : null;
}

/** False when ADMIN_PASSWORD is unset — the admin area stays closed rather than open. */
export function isAdminConfigured(): boolean {
  return adminPassword() !== null;
}

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function checkPassword(input: string): boolean {
  const password = adminPassword();
  if (!password) return false;
  return equals(input, password);
}

export function createSessionToken(): string {
  const password = adminPassword();
  if (!password) throw new Error("ADMIN_PASSWORD is not set");

  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${randomBytes(9).toString(
    "base64url"
  )}`;
  return `${payload}.${sign(payload, password)}`;
}

function verifySessionToken(token: string | undefined): boolean {
  const password = adminPassword();
  if (!password || !token) return false;

  const split = token.lastIndexOf(".");
  if (split <= 0) return false;

  const payload = token.slice(0, split);
  if (!equals(token.slice(split + 1), sign(payload, password))) return false;

  const expiresAt = Number(payload.slice(0, payload.indexOf(".")));
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/**
 * Browsers always send Origin with a fetch that changes something. Requiring
 * it to name this host backs up the SameSite cookie against cross-site posts.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_SECONDS,
} as const;
