"use client";

import Link from "@/components/Link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { useUser } from "@/lib/auth/useUser";
import { createClient } from "@/lib/supabase/browser";

function displayName(user: User): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof name === "string" && name.trim() ? name.trim() : (user.email ?? "Account");
}

/**
 * "Sign in" / "Sign up" when signed out — shown even before Supabase is
 * connected, when they lead to a preview of the forms — and an avatar with a
 * sign-out menu when signed in.
 */
export default function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  // undefined until Supabase has read the stored session.
  const user = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setOpen(false);
    // "local" ends this browser's session without signing out other devices.
    await createClient().auth.signOut({ scope: "local" });
    router.refresh();
  }

  if (!user) {
    const next = encodeURIComponent(pathname);
    // While the session is still loading, the same buttons hold their space
    // invisibly so nothing jumps when they appear.
    const loading = user === undefined;
    return (
      <div
        aria-hidden={loading || undefined}
        className={`flex shrink-0 items-center gap-space-2xs sm:gap-space-xs ${
          loading ? "invisible" : "motion-safe:animate-fade-in"
        }`}
      >
        {/* Very narrow phones: Sign in moves into the header menu, so the bar never crowds. */}
        <Link
          href={`/login?next=${next}`}
          tabIndex={loading ? -1 : undefined}
          className="hidden h-9 items-center whitespace-nowrap rounded-lg px-space-sm font-label-md text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface min-[400px]:inline-flex sm:px-space-md"
        >
          Sign in
        </Link>
        <Link
          href={`/signup?next=${next}`}
          tabIndex={loading ? -1 : undefined}
          className="inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-primary-container px-space-sm font-label-md text-label-md font-semibold text-on-primary shadow-sm shadow-primary/25 transition-all hover:bg-primary hover:shadow-md active:scale-[0.98] sm:px-space-base"
        >
          Sign up<span className="hidden sm:inline">&nbsp;free</span>
        </Link>
      </div>
    );
  }

  const name = displayName(user);
  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-semibold text-on-primary ring-2 ring-surface-container-lowest transition-shadow hover:ring-primary-fixed-dim"
      >
        {name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-64 origin-top-right rounded-xl bg-surface-container-lowest p-space-sm shadow-lg ring-1 ring-outline-variant/60 motion-safe:animate-pop-in"
        >
          <div className="px-space-sm py-space-xs">
            <p className="font-label-md text-label-md truncate font-semibold text-on-surface">
              {name}
            </p>
            {user.email && user.email !== name && (
              <p className="font-body-sm text-body-sm truncate text-on-surface-variant">
                {user.email}
              </p>
            )}
          </div>
          <div className="my-space-xs h-px bg-outline-variant/60" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="font-label-md text-label-md flex w-full items-center gap-space-sm rounded-lg px-space-sm py-space-xs text-on-surface hover:bg-surface-container"
          >
            <LogOut size={16} className="text-on-surface-variant" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
