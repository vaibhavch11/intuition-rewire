import type { InputHTMLAttributes, ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import LogoMark from "@/components/LogoMark";

/** Presentational pieces shared by the sign-in, sign-up and reset screens. */

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-md ring-1 ring-outline-variant/40 sm:p-space-xl motion-safe:animate-fade-up">
      <div className="mb-space-lg text-center">
        <LogoMark className="inline-block h-10 w-auto" />
        <h1 className="font-headline-lg text-headline-lg mt-space-md text-on-surface">
          {title}
        </h1>
        <p className="font-body-md text-body-md mt-space-xs text-on-surface-variant">
          {subtitle}
        </p>
      </div>
      {children}
      {footer && (
        <p className="font-body-md text-body-md mt-space-lg text-center text-on-surface-variant">
          {footer}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  aside,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
  aside?: ReactNode;
}) {
  const id = `field-${input.name}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-space-sm">
        <label
          htmlFor={id}
          className="font-label-md text-label-md text-on-surface"
        >
          {label}
        </label>
        {aside}
      </div>
      <input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="font-body-md text-body-md mt-space-xs w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-space-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...input}
      />
      {hint && (
        <p
          id={`${id}-hint`}
          className="font-body-sm text-body-sm mt-space-2xs text-on-surface-variant"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-label-md text-label-md inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary-container px-space-base text-on-primary shadow-sm transition-all hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:active:scale-100"
    >
      {children}
    </button>
  );
}

const ALERT_TONES = {
  error: "bg-error-container text-on-error-container",
  success: "bg-secondary-container/40 text-on-secondary-container",
  info: "bg-primary-fixed/60 text-on-primary-fixed-variant",
} as const;

export function Alert({
  tone,
  children,
}: {
  tone: keyof typeof ALERT_TONES;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`font-body-sm text-body-sm rounded-lg px-space-md py-space-sm ${ALERT_TONES[tone]}`}
    >
      {children}
    </div>
  );
}

/**
 * Wraps the sign-in controls. Until Supabase is connected every control
 * inside is disabled, so the page still shows what visitors will get.
 */
export function AuthFields({ children }: { children: ReactNode }) {
  const connected = isSupabaseConfigured();
  return (
    <fieldset
      disabled={!connected}
      className={`m-0 min-w-0 border-0 p-0 ${connected ? "" : "opacity-60"}`}
    >
      {children}
    </fieldset>
  );
}

export function Divider() {
  return (
    <div className="my-space-lg flex items-center gap-space-md" aria-hidden>
      <span className="h-px flex-1 bg-outline-variant/70" />
      <span className="font-label-tag text-label-tag uppercase text-on-surface-variant">
        or
      </span>
      <span className="h-px flex-1 bg-outline-variant/70" />
    </div>
  );
}

export function NotConfigured() {
  return (
    <div className="mb-space-md">
      <Alert tone="info">
        <strong>Preview:</strong> sign-in isn&apos;t connected to Supabase yet.
        Add <code className="font-code-sm text-code-sm">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="font-code-sm text-code-sm">
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        </code>{" "}
        to <code className="font-code-sm text-code-sm">.env.local</code> and
        restart the server.
      </Alert>
    </div>
  );
}
