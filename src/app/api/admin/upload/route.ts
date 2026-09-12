import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";

const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * The extension comes from the bytes, never from the client's filename or
 * declared mime type. SVG is rejected: it can carry script when opened directly.
 */
function sniffExtension(bytes: Uint8Array): string | null {
  const startsWith = (...signature: number[]) =>
    signature.every((byte, i) => bytes[i] === byte);

  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (startsWith(0xff, 0xd8, 0xff)) return "jpg";
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return "gif";
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    [0x57, 0x45, 0x42, 0x50].every((byte, i) => bytes[8 + i] === byte)
  ) {
    return "webp";
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Images must be 5MB or smaller." },
      { status: 413 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = sniffExtension(bytes);
  if (!extension) {
    return Response.json(
      { error: "Only PNG, JPEG, GIF, and WebP images are accepted." },
      { status: 415 }
    );
  }

  const filename = `${randomUUID()}.${extension}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return Response.json({ src: `/uploads/${filename}` });
}
