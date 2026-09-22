import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { getContentBucket } from "@/lib/admin/storage";

const MAX_BYTES = 4 * 1024 * 1024;
const DRAWING_DIR = path.join(process.cwd(), "public", "drawings");

/**
 * Excalidraw's exporter emits plain shapes, text, and font faces. Anything that
 * could run when the file is opened directly is rejected rather than sanitised.
 */
const EXECUTABLE = /<script|<foreignObject|javascript:|\son\w+\s*=/i;

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const svg =
    typeof body === "object" && body !== null && "svg" in body
      ? (body as { svg: unknown }).svg
      : null;

  if (typeof svg !== "string" || !svg.trimStart().startsWith("<svg")) {
    return Response.json({ error: "That is not an SVG." }, { status: 400 });
  }
  if (Buffer.byteLength(svg, "utf8") > MAX_BYTES) {
    return Response.json({ error: "Drawing is too large." }, { status: 413 });
  }
  if (EXECUTABLE.test(svg)) {
    return Response.json(
      { error: "The drawing contains scriptable markup." },
      { status: 400 }
    );
  }

  const filename = `${randomUUID()}.svg`;

  const bucket = await getContentBucket();
  if (bucket) {
    await bucket.put(`drawings/${filename}`, svg, {
      httpMetadata: { contentType: "image/svg+xml" },
    });
  }

  try {
    await fs.mkdir(DRAWING_DIR, { recursive: true });
    await fs.writeFile(path.join(DRAWING_DIR, filename), svg, "utf8");
  } catch {
    if (!bucket) {
      return Response.json(
        { error: "No storage backend is available to save this drawing." },
        { status: 500 }
      );
    }
  }

  return Response.json({ src: `/drawings/${filename}` });
}
