import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface SignedInUser {
  id: string;
  email: string | null;
}

/**
 * The signed-in user, or null. `getClaims()` verifies the session JWT rather
 * than trusting the cookie's contents, so a forged or tampered cookie is
 * treated as signed out.
 */
export async function getSignedInUser(): Promise<SignedInUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

/**
 * Server-side gate for pages that need an account. The proxy redirects first;
 * this is the backstop in case a request ever reaches the page without it.
 * While Supabase isn't configured nobody could sign in, so the page stays open.
 */
export async function requireSignedIn(returnTo: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  if (!(await getSignedInUser())) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
}
