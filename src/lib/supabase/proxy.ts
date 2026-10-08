import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  handlesAuth,
  isLessonPath,
  safeNextPath,
  SIGNED_OUT_ONLY,
} from "@/lib/auth/paths";
import {
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./config";

/** Responses that may carry a session cookie must never be cached by a CDN. */
const NO_STORE = "private, no-store";

/**
 * Refreshes an expiring session on lessons (signed-in readers get the whole
 * lesson, everyone else its opening) and on the auth pages. Other pages return
 * immediately without touching Supabase.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (
    !isSupabaseConfigured() ||
    !(isLessonPath(pathname) || handlesAuth(pathname))
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Must run before anything else reads the session: it refreshes an expiring
  // token and verifies the JWT rather than trusting the cookie.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", NO_STORE);
    return redirect;
  };

  if (signedIn && SIGNED_OUT_ONLY.includes(pathname)) {
    return redirectTo(safeNextPath(request.nextUrl.searchParams.get("next")));
  }

  response.headers.set("Cache-Control", NO_STORE);
  return response;
}
