"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  checkNewPassword,
  describeAuthError,
  MIN_PASSWORD_LENGTH,
  PASSWORD_HINT,
} from "./messages";
import { Alert, SubmitButton, TextField } from "./ui";

export default function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const invalid = checkNewPassword(password, String(form.get("confirm") ?? ""));
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);
    setError(null);
    const { data, error: signUpError } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (signUpError) {
      setError(describeAuthError(signUpError));
      setPending(false);
      return;
    }
    if (data.session) {
      // Email confirmation is switched off in Supabase: already signed in.
      router.replace(next);
      router.refresh();
      return;
    }
    // Shown whether or not the address already had an account, so the form
    // can't be used to discover who is registered.
    setSentTo(email);
    setPending(false);
  }

  if (sentTo) {
    return (
      <Alert tone="success">
        <p className="font-semibold">Check your inbox</p>
        <p className="mt-space-2xs">
          We sent a confirmation link to <strong>{sentTo}</strong>. Open it to
          finish creating your account — check your spam folder if it doesn&apos;t
          arrive in a minute or two.
        </p>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-space-md">
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={PASSWORD_HINT}
        required
      />
      <TextField
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      {error && <Alert tone="error">{error}</Alert>}
      <SubmitButton pending={pending}>
        {pending ? "Creating account…" : "Create account"}
      </SubmitButton>
    </form>
  );
}
