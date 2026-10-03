/**
 * Pay-what-you-want support payments. Shared by the Pricing page and the
 * order route, so the browser and the server agree on the limits — the server
 * still re-checks every amount it is sent.
 */
export const SUPPORT_CURRENCY = "USD";

/** Amounts are whole cents, Razorpay's smallest unit for USD. */
export const MIN_SUPPORT_CENTS = 500;
export const MAX_SUPPORT_CENTS = 50_000;

/** One-tap choices on the Pricing page, in dollars. */
export const SUGGESTED_DOLLARS = [5, 10, 25, 50];

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** Turns "12" or "12.50" into cents; null for anything else. */
export function parseDollars(text: string): number | null {
  const trimmed = text.trim().replace(/^\$/, "");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

export function checkSupportAmount(cents: number): string | null {
  if (!Number.isInteger(cents)) return "Enter an amount in dollars, like 5 or 12.50.";
  if (cents < MIN_SUPPORT_CENTS) return `The minimum is ${formatDollars(MIN_SUPPORT_CENTS)}.`;
  if (cents > MAX_SUPPORT_CENTS) return `The most you can pay at once is ${formatDollars(MAX_SUPPORT_CENTS)}.`;
  return null;
}
