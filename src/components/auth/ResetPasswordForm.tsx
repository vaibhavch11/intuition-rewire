"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  checkNewPassword,
  describeAuthError,
  MIN_PASSWORD_LENGTH,
  PASSWORD_HINT,
} from "./messages";
import { Alert, SubmitButton, TextField } from "./ui";

/** Shown after a recovery link signs the user in; sets their new password. */
export default function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    const invalid = checkNewPassword(password, String(form.get("confirm") ?? ""));
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(describeAuthError(updateError));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Alert tone="success">
        Your password has been changed.{" "}
        <Link href="/dsa" className="font-semibold underline">
          Continue learning →
        </Link>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-space-md">
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={PASSWORD_HINT}
        required
      />
      <TextField
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      {error && <Alert tone="error">{error}</Alert>}
      <SubmitButton pending={pending}>
        {pending ? "Saving…" : "Set new password"}
      </SubmitButton>
    </form>
  );
}
