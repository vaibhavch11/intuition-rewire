import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Google sign-in and email links land. Exchanges the one-time `code`
 * (PKCE: only the browser that started the sign-in holds the verifier) for a
 * session cookie, then continues to the page the visitor wanted.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  let reason = searchParams.has("error") ? "provider" : "missing";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return noStore(NextResponse.redirect(new URL(next, origin)));
    reason = "exchange";
  }

  // Only a fixed reason code travels back — never the provider's own text, so
  // a crafted link can't put arbitrary words on the sign-in page.
  const login = new URL("/login", origin);
  login.searchParams.set("error", reason);
  login.searchParams.set("next", next);
  return noStore(NextResponse.redirect(login));
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
