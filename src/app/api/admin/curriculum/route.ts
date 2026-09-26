import type { NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin } from "@/lib/admin/auth";
import {
  changeCurriculum,
  CurriculumError,
  parseCurriculumChange,
} from "@/lib/dsa/curriculum";

/** A course change is a few short strings; anything bigger isn't one. */
const MAX_BODY_BYTES = 4 * 1024;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  const raw = declared > MAX_BODY_BYTES ? null : await request.text();
  if (raw === null || raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    // Falls through to parseCurriculumChange, which rejects it.
  }

  try {
    const result = await changeCurriculum(parseCurriculumChange(body));
    return Response.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CurriculumError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
