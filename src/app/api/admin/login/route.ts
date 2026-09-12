import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSessionToken,
  isAdminConfigured,
  sessionCookieOptions,
} from "@/lib/admin/auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return Response.json(
      { error: "ADMIN_PASSWORD is not set on the server." },
      { status: 503 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? (body as { password: unknown }).password
      : null;

  if (typeof password !== "string" || !checkPassword(password)) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return Response.json({ ok: true });
}
