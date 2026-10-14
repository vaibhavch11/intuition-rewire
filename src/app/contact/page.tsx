import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "@/components/Link";
import { CONTACT_EMAIL, LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = pageMetadata({
  title: "Contact | IntuitionRewire",
  description:
    "Questions about payments, refunds, your account or the courses? Email the IntuitionRewire team and we usually reply within two working days.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <LegalDocument title="Contact us" updated="15 October 2026">
      <LegalSection heading="Email">
        <p>
          For questions about payments, refunds, your account or the courses, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We usually reply within two working days.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>
          Every course is free to learn. If you&apos;d like to support IntuitionRewire,{" "}
          <Link href="/pricing">click here and pay whatever you want</Link> — any amount, once, no subscription.
        </p>
        <p>
          If your question is about a payment, include the Razorpay payment id from your receipt email so we can find it
          quickly.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
