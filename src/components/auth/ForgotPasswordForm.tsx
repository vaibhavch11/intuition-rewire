"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { describeAuthError } from "./messages";
import { Alert, SubmitButton, TextField } from "./ui";

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    setPending(true);
    setError(null);
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    );
    setPending(false);

    // Only a rate limit is worth reporting; anything else would reveal whether
    // the address has an account.
    if (resetError?.code === "over_email_send_rate_limit") {
      setError(describeAuthError(resetError));
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <Alert tone="success">
        If an account exists for <strong>{sentTo}</strong>, a password reset
        link is on its way. It expires after an hour.
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
      {error && <Alert tone="error">{error}</Alert>}
      <SubmitButton pending={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </SubmitButton>
    </form>
  );
}
