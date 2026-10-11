"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { CheckCircle2, Heart, Loader2, Lock } from "lucide-react";
import {
  checkSupportAmount,
  formatDollars,
  parseDollars,
  SUGGESTED_DOLLARS,
} from "@/lib/payments/amounts";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads Razorpay Checkout once, only when someone actually decides to pay. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("checkout")), { once: true });
    if (!existing) {
      script.src = CHECKOUT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

type Status =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "verifying" }
  | { kind: "paid"; paymentId: string; cents: number }
  | { kind: "error"; message: string };

export default function SupportCheckout({
  signedIn,
  enabled,
}: {
  signedIn: boolean;
  enabled: boolean;
}) {
  const [choice, setChoice] = useState<number | "custom">(SUGGESTED_DOLLARS[1]);
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const cents = choice === "custom" ? parseDollars(custom) : choice * 100;
  const problem = cents === null ? (custom.trim() ? "Enter an amount in dollars, like 5 or 12.50." : null) : checkSupportAmount(cents);
  const busy = status.kind === "starting" || status.kind === "verifying";

  async function pay() {
    if (cents === null || problem) return;
    setStatus({ kind: "starting" });
    try {
      const [orderResponse] = await Promise.all([
        fetch("/api/payments/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: cents }),
        }),
        loadCheckout(),
      ]);
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error ?? "The payment couldn't be started.");
      if (!window.Razorpay) throw new Error("Razorpay Checkout didn't load. Check your connection and try again.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "IntuitionRewire",
        description: `Support payment of ${formatDollars(order.amount)}`,
        prefill: order.email ? { email: order.email } : undefined,
        theme: { color: "#4f46e5" },
        modal: { ondismiss: () => setStatus({ kind: "idle" }) },
        handler: async (response: RazorpayResponse) => {
          setStatus({ kind: "verifying" });
          const verify = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await verify.json().catch(() => ({}));
          if (verify.ok) {
            setStatus({ kind: "paid", paymentId: response.razorpay_payment_id, cents: order.amount });
          } else {
            setStatus({
              kind: "error",
              message: `${result.error ?? "We couldn't confirm the payment."} If you were charged, email us with payment id ${response.razorpay_payment_id}.`,
            });
          }
        },
      });
      checkout.on("payment.failed", (response) =>
        setStatus({ kind: "error", message: response.error?.description ?? "The payment failed. No money was taken." })
      );
      checkout.open();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error && error.message !== "checkout" ? error.message : "Razorpay Checkout didn't load. Try again.",
      });
    }
  }

  if (status.kind === "paid") {
    return (
      <div className="rounded-2xl border border-secondary/40 bg-secondary-container/30 p-space-lg text-center">
        <CheckCircle2 className="mx-auto text-secondary" size={40} />
        <h2 className="font-headline-md text-headline-md mt-space-sm text-on-surface">Thank you!</h2>
        <p className="font-body-md text-body-md mt-space-xs text-on-surface-variant">
          Your {formatDollars(status.cents)} payment went through. Razorpay emails you a receipt.
        </p>
        <p className="font-code-sm text-code-sm mt-space-sm text-on-surface-variant">Payment id: {status.paymentId}</p>
        <Link href="/dsa" className="mt-space-md inline-flex h-11 items-center rounded-lg bg-primary-container px-space-lg font-label-md text-label-md font-semibold text-on-primary hover:bg-primary">
          Back to learning
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg shadow-sm">
      <p className="font-label-md text-label-md font-semibold text-on-surface">Choose an amount</p>
      <div className="mt-space-sm grid grid-cols-2 gap-space-sm sm:grid-cols-5" role="radiogroup" aria-label="Amount">
        {SUGGESTED_DOLLARS.map((dollars) => (
          <button
            key={dollars}
            type="button"
            role="radio"
            aria-checked={choice === dollars}
            onClick={() => setChoice(dollars)}
            className={`h-12 rounded-xl border font-headline-md text-body-lg font-semibold transition-colors ${
              choice === dollars
                ? "border-primary bg-primary-fixed text-primary"
                : "border-outline-variant text-on-surface hover:border-primary"
            }`}
          >
            ${dollars}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={choice === "custom"}
          onClick={() => setChoice("custom")}
          className={`col-span-2 h-12 rounded-xl border font-label-md text-label-md font-semibold transition-colors sm:col-span-1 ${
            choice === "custom"
              ? "border-primary bg-primary-fixed text-primary"
              : "border-outline-variant text-on-surface hover:border-primary"
          }`}
        >
          Other
        </button>
      </div>

      {choice === "custom" && (
        <label className="mt-space-md block">
          <span className="font-label-md text-label-md text-on-surface-variant">Your amount</span>
          <div className="mt-1 flex h-12 items-center rounded-xl border border-outline-variant bg-surface-container-lowest px-space-sm focus-within:border-primary">
            <span className="font-headline-md text-body-lg text-on-surface-variant">$</span>
            <input
              autoFocus
              inputMode="decimal"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="1"
              aria-invalid={Boolean(problem)}
              className="ml-1 w-full bg-transparent font-headline-md text-body-lg text-on-surface outline-none"
            />
          </div>
        </label>
      )}

      {problem && (
        <p role="alert" className="font-body-sm text-body-sm mt-space-sm text-error">
          {problem}
        </p>
      )}
      {status.kind === "error" && (
        <p role="alert" className="font-body-sm text-body-sm mt-space-sm text-error">
          {status.message}
        </p>
      )}

      {!enabled ? (
        <p className="font-body-sm text-body-sm mt-space-md rounded-lg bg-surface-container p-space-sm text-on-surface-variant">
          Payments are being set up and aren&apos;t open yet. Please check back soon.
        </p>
      ) : signedIn ? (
        <button
          type="button"
          onClick={pay}
          disabled={busy || cents === null || Boolean(problem)}
          className="mt-space-md inline-flex h-12 w-full items-center justify-center gap-space-xs rounded-xl bg-primary-container font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
          {status.kind === "verifying"
            ? "Confirming payment…"
            : status.kind === "starting"
              ? "Opening checkout…"
              : `Pay ${cents !== null && !problem ? formatDollars(cents) : ""}`}
        </button>
      ) : (
        <Link
          href="/login?next=%2Fpricing"
          className="mt-space-md inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary-container font-label-md text-label-md font-semibold text-on-primary shadow-sm hover:bg-primary"
        >
          Sign in to pay
        </Link>
      )}

      <p className="font-body-sm text-body-sm mt-space-sm flex items-center justify-center gap-1 text-on-surface-variant">
        <Lock size={13} /> Secure checkout by Razorpay. We never see your card details.
      </p>
    </div>
  );
}
