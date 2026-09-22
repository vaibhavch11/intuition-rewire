import { getContentBucket } from "@/lib/admin/storage";

/**
 * Only reached for filenames the static asset bundle doesn't have — i.e.
 * images uploaded through /admin after the last deploy. Anything already in
 * `public/uploads` at deploy time is served directly as a static asset and
 * never hits this route.
 */
const FILENAME = /^[0-9a-f-]{36}\.(png|jpg|gif|webp)$/i;

export async function GET(
  _request: Request,
  ctx: RouteContext<"/uploads/[filename]">
) {
  const { filename } = await ctx.params;
  if (!FILENAME.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const bucket = await getContentBucket();
  const object = await bucket?.get(`uploads/${filename}`);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
