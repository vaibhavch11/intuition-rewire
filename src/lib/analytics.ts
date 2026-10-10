// PostHog is loaded by the script in @/lib/posthogScript. Outside production,
// or when a content blocker stops it, window.posthog is missing and these do nothing.
interface PostHog {
  identify(distinctId: string): void;
  reset(): void;
}

function posthog(): PostHog | undefined {
  return (window as Window & { posthog?: PostHog }).posthog;
}

/** Links this browser's activity to a signed-in reader, by account ID only (no email or name). */
export function identifyReader(userId: string) {
  posthog()?.identify(userId);
}

/** After sign-out, so whoever uses this browser next isn't counted as that reader. */
export function forgetReader() {
  posthog()?.reset();
}
