import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * For Server Components and Route Handlers. Create one per request — the
 * client carries that request's cookies.
 */
export async function createClient() {
  const store = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Components can't write cookies. The proxy refreshes the
          // session before the page renders, so nothing is lost here.
        }
      },
    },
  });
}
