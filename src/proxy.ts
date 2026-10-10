import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { SITE_URL } from "@/lib/seo";

/** Other addresses this Worker answers on; readers on them are sent to SITE_URL. */
const OTHER_HOSTS = new Set([
  "www.intuitionrewire.com",
  "intuition-rewire.intuition-rewire.workers.dev",
]);

export function proxy(request: NextRequest) {
  // One address for readers and search engines. API calls (payment webhooks)
  // and sign-in callbacks finish on the address they started on.
  const { pathname, search } = request.nextUrl;
  if (
    OTHER_HOSTS.has(request.headers.get("host") ?? "") &&
    (request.method === "GET" || request.method === "HEAD") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/auth/")
  ) {
    return NextResponse.redirect(new URL(pathname + search, SITE_URL), 301);
  }
  return updateSession(request);
}

export const config = {
  // Skip Next's build output and every file with an extension (drawings,
  // uploads, icons) — none of them depend on who is signed in.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
