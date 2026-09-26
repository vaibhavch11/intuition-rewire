import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip Next's build output and every file with an extension (drawings,
  // uploads, icons) — none of them depend on who is signed in.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
