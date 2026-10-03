import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = { title: "Contact — IntuitionRewire" };

export default function ContactPage() {
  return (
    <LegalDocument title="Contact us" updated="3 October 2026">
      <LegalSection heading="Email">
        <p>
          For questions about payments, refunds, your account or the courses, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We usually reply within two working days.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>
          If your question is about a payment, include the Razorpay payment id from your receipt email so we can find it
          quickly.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
