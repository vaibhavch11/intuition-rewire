import { SUPPORT_CURRENCY } from "./amounts";

/**
 * Server-only Razorpay calls. Uses fetch and Web Crypto rather than the
 * `razorpay` npm package, which relies on Node APIs the Cloudflare Worker
 * doesn't provide. The key secret never leaves the server; only the key id
 * is sent to the browser to open Checkout.
 */
const API = "https://api.razorpay.com/v1";

const keyId = () => process.env.RAZORPAY_KEY_ID ?? "";
const keySecret = () => process.env.RAZORPAY_KEY_SECRET ?? "";

/** False until both keys are set; the Pricing page then explains payments are off. */
export function isRazorpayConfigured(): boolean {
  return keyId().length > 0 && keySecret().length > 0;
}

export function publicKeyId(): string {
  return keyId();
}

export class RazorpayError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createSupportOrder(
  amountCents: number,
  user: { id: string; email: string | null }
): Promise<CreatedOrder> {
  const response = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId()}:${keySecret()}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountCents,
      currency: SUPPORT_CURRENCY,
      // Razorpay caps receipts at 40 characters.
      receipt: `support_${Date.now()}`,
      notes: { purpose: "support", user_id: user.id, email: user.email ?? "" },
    }),
  });

  const body = (await response.json().catch(() => null)) as
    | { id?: string; amount?: number; currency?: string; error?: { description?: string } }
    | null;
  if (!response.ok || !body?.id) {
    const reason = body?.error?.description ?? `HTTP ${response.status}`;
    console.error("Razorpay order creation failed:", reason);
    // Currency errors usually mean International Payments isn't enabled yet.
    const friendly = /currency/i.test(reason)
      ? "USD payments aren't enabled on this Razorpay account yet."
      : "The payment couldn't be started. Please try again.";
    throw new RazorpayError(friendly, 502);
  }
  return { id: body.id, amount: body.amount ?? amountCents, currency: body.currency ?? SUPPORT_CURRENCY };
}

/**
 * Checkout signs `order_id|payment_id` with the key secret. Recomputing it
 * proves the payment really happened on that order — the browser's word
 * alone is never trusted.
 */
export async function isValidPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keySecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${orderId}|${paymentId}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return false;
  // Compare every character so the time taken doesn't hint at how close a guess was.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
