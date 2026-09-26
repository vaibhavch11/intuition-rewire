import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin } from "@/lib/admin/auth";
import { parseBlocks, saveLessonContent } from "@/lib/dsa/content";
import { getTopic } from "@/lib/dsa/curriculum";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/content/[section]/[topic]">
) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  // Checked against the live curriculum, so a lesson removed in another tab
  // can't be saved back into existence.
  const { section, topic } = await ctx.params;
  if (!(await getTopic(section, topic))) {
    return Response.json({ error: "This lesson no longer exists." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const blocksInput =
    typeof body === "object" && body !== null && "blocks" in body
      ? (body as { blocks: unknown }).blocks
      : null;

  let saved;
  try {
    saved = await saveLessonContent(section, topic, parseBlocks(blocksInput));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save." },
      { status: 400 }
    );
  }

  revalidatePath(`/dsa/${section}/${topic}`);
  return Response.json({ ok: true, updatedAt: saved.updatedAt });
}
