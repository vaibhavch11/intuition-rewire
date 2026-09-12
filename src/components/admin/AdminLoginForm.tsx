"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.error ?? "Sign in failed.");
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-space-base space-y-space-md">
      <div>
        <label
          htmlFor="admin-password"
          className="font-label-md text-label-md block text-on-surface"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="font-body-md text-body-md mt-space-xs w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-space-sm text-on-surface outline-none focus:border-primary"
        />
      </div>

      {error && (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="font-label-md text-label-md w-full rounded-lg bg-primary-container px-space-base py-space-sm text-on-primary disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
