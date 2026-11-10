/** Lessons (`/dsa/<course>/<lesson>`): open to everyone; signing in adds progress tracking. */
export function isLessonPath(pathname: string): boolean {
  return /^\/dsa\/[^/]+\/[^/]+/.test(pathname);
}

/** Pages only a signed-out visitor needs; signed-in users are sent onward. */
export const SIGNED_OUT_ONLY = ["/login", "/signup", "/forgot-password"];

/** Pages and routes that read or finish a sign-in, so need a fresh session. */
export function handlesAuth(pathname: string): boolean {
  return (
    SIGNED_OUT_ONLY.includes(pathname) ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/")
  );
}

const AFTER_SIGN_IN = "/dsa";
const BASE = "http://internal.invalid";

/**
 * Where to send someone after signing in. Only same-site paths survive, so a
 * crafted `?next=//evil.example` can't bounce users to another site, and the
 * auth pages themselves are excluded so sign-in can't loop.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/")) return AFTER_SIGN_IN;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return AFTER_SIGN_IN;
    if (SIGNED_OUT_ONLY.includes(url.pathname) || url.pathname.startsWith("/auth/")) {
      return AFTER_SIGN_IN;
    }
    url.searchParams.delete("_rsc");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return AFTER_SIGN_IN;
  }
}
