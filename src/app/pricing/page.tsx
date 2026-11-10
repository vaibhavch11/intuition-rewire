import type { Metadata } from "next";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Link from "@/components/Link";
import { BookOpen, Heart, Sparkles } from "lucide-react";
import SupportCheckout from "@/components/pricing/SupportCheckout";
import { getSignedInUser } from "@/lib/auth/session";
import { isRazorpayConfigured } from "@/lib/payments/razorpay";

export const metadata: Metadata = pageMetadata({
  title: "Pricing: Free to Learn, Pay What You Want | IntuitionRewire",
  description:
    "IntuitionRewire is free for everyone: every DSA lesson, drawing and simulator. If it helped you, support it with a one-time payment of any amount you choose.",
  path: "/pricing",
});

// Reads the session, so it can't be prerendered at build time.
export const dynamic = "force-dynamic";

const PERKS = [
  { icon: BookOpen, title: "Every lesson stays free", text: "All courses, drawings and simulators are open to everyone. A free account saves your progress." },
  { icon: Heart, title: "Pay what it's worth to you", text: "Support with any amount you choose — once, no subscription." },
  { icon: Sparkles, title: "Fund the next courses", text: "Your support pays for new courses like stacks, queues and trees." },
];

const FAQ = [
  { q: "Do I need to pay to use the site?", a: "No. Every lesson is free to read, with or without an account. An account only saves your progress, and paying is an optional way to support the project." },
  { q: "How do I pay?", a: "Checkout is handled by Razorpay. Amounts are in US dollars: pay by international card, or from India by UPI, Indian card or netbanking. Your payment details go to Razorpay, never to us." },
  { q: "Is it a subscription?", a: "No. It's a single payment, charged once. Nothing renews." },
  { q: "Can I get a refund?", a: "Yes, if something went wrong. See the refund policy for how and when." },
];

export default async function PricingPage() {
  const user = await getSignedInUser();

  return (
    <main className="mx-auto w-full max-w-5xl px-gutter-mobile py-space-2xl lg:px-gutter-desktop">
      <JsonLd data={faqJsonLd(FAQ)} />
      <div className="text-center">
        <p className="font-label-tag text-label-tag uppercase tracking-wide text-primary">Pricing</p>
        <h1 className="font-headline-xl text-headline-xl-mobile mt-space-xs text-on-surface lg:text-headline-xl">
          Free to learn. Pay what you want.
        </h1>
        <p className="font-body-lg text-body-lg mx-auto mt-space-sm max-w-2xl text-on-surface-variant">
          IntuitionRewire is free for everyone. If it helped you, support it with a one-time payment of any amount you
          like.
        </p>
      </div>

      <div className="mt-space-2xl grid items-start gap-space-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ul className="space-y-space-md">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-space-md rounded-2xl border border-outline-variant/50 bg-surface-container-low p-space-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <Icon size={20} />
              </span>
              <span>
                <span className="font-label-md text-label-md block font-semibold text-on-surface">{title}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <SupportCheckout signedIn={Boolean(user)} enabled={isRazorpayConfigured()} />
      </div>

      <section className="mt-space-2xl">
        <h2 className="font-headline-md text-headline-md text-on-surface">Questions</h2>
        <dl className="mt-space-md grid gap-space-md md:grid-cols-2">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-outline-variant/50 p-space-md">
              <dt className="font-label-md text-label-md font-semibold text-on-surface">{q}</dt>
              <dd className="font-body-md text-body-md mt-space-xs text-on-surface-variant">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="font-body-sm text-body-sm mt-space-md text-on-surface-variant">
          See the <Link href="/refund-policy" className="font-semibold text-primary hover:underline">refund policy</Link>,{" "}
          <Link href="/terms" className="font-semibold text-primary hover:underline">terms</Link> and{" "}
          <Link href="/contact" className="font-semibold text-primary hover:underline">contact details</Link>.
        </p>
      </section>
    </main>
  );
}
