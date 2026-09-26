"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/config";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

export default function GoogleButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null while unknown; false once Supabase reports the provider is switched off.
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    // Public endpoint listing which sign-in providers the project has enabled.
    fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings: { external?: { google?: boolean } } | null) => {
        if (!cancelled && settings) setEnabled(Boolean(settings.external?.google));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn() {
    setPending(true);
    setError(null);
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });
    // On success the browser is already on its way to Google.
    if (oauthError) {
      setError("Google sign-in couldn't start. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={pending || enabled === false}
        className="font-label-md text-label-md inline-flex h-11 w-full items-center justify-center gap-space-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-space-base text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleLogo />
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {enabled === false && (
        <p className="font-body-sm text-body-sm mt-space-xs text-center text-on-surface-variant">
          Google sign-in isn&apos;t enabled yet — use your email below.
        </p>
      )}
      {error && (
        <p role="alert" className="font-body-sm text-body-sm mt-space-xs text-center text-error">
          {error}
        </p>
      )}
    </div>
  );
}
