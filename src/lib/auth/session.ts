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
