import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * For Client Components. Sign-in calls go straight from the visitor's browser
 * to Supabase, so Supabase's per-IP rate limits apply to each visitor rather
 * than to our server's shared address. The session lands in cookies, where the
 * proxy and Server Components read it.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
