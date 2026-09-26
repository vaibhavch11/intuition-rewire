import type { AuthError } from "@supabase/supabase-js";

/** Mirrors the Supabase project's password policy (Auth → Email provider). */
export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_HINT = `At least ${MIN_PASSWORD_LENGTH} characters, including a letter and a number.`;

/**
 * Plain-language text for Supabase Auth errors. Unknown errors get a generic
 * line rather than the raw message, which can leak internal detail.
 */
export function describeAuthError(error: Pick<AuthError, "code">): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Check them and try again.";
    case "email_not_confirmed":
      return "Confirm your email first — open the link we sent when you signed up.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "weak_password":
      return `That password is too easy to guess. ${PASSWORD_HINT}`;
    case "signup_disabled":
      return "New sign-ups are paused right now.";
    case "email_address_invalid":
      return "That email address doesn't look right.";
    case "same_password":
      return "Choose a password different from your current one.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Sign in instead.";
    case "email_address_not_authorized":
      // Supabase's built-in mailer only reaches the project's own team until
      // a custom SMTP service is connected.
      return "We can't send email to that address yet. Please use Continue with Google for now.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** `?error=` codes set by /auth/callback and /auth/confirm — never free text. */
export const LINK_ERRORS: Record<string, string> = {
  provider: "Google sign-in was cancelled or didn't finish. Please try again.",
  exchange:
    "That sign-in couldn't be completed in this browser. If you just confirmed your email, sign in below.",
  missing: "That sign-in link is incomplete. Please try again.",
  link: "That email link is invalid or has expired. Request a new one.",
};

/** Validates a new password; returns an error message or null. */
export function checkNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Include at least one letter and one number.";
  }
  if (password !== confirm) return "The two passwords don't match.";
  return null;
}
