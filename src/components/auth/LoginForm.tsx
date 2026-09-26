"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { describeAuthError } from "./messages";
import { Alert, SubmitButton, TextField } from "./ui";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    setError(null);
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(describeAuthError(signInError));
      setPending(false);
      return;
    }
    router.replace(next);
    router.refresh();
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
        autoComplete="current-password"
        required
        aside={
          <Link
            href="/forgot-password"
            className="font-body-sm text-body-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        }
      />
      {error && <Alert tone="error">{error}</Alert>}
      <SubmitButton pending={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </SubmitButton>
    </form>
  );
}
