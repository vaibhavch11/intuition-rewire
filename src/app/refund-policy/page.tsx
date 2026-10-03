import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = { title: "Refund Policy — IntuitionRewire" };

export default function RefundPolicyPage() {
  return (
    <LegalDocument title="Refund & Cancellation Policy" updated="3 October 2026">
      <LegalSection heading="What you pay for">
        <p>
          IntuitionRewire is free to use. Payments on the Pricing page are optional, one-time support payments. They
          don&apos;t unlock content, and there is no subscription to cancel: nothing is charged again.
        </p>
      </LegalSection>

      <LegalSection heading="Refunds">
        <ul>
          <li>
            If you paid by mistake, paid the wrong amount, or were charged twice, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> within <strong>7 days</strong> of the payment with
            your Razorpay payment id.
          </li>
          <li>We refund the full amount to the original payment method.</li>
          <li>
            Once approved, refunds are processed through Razorpay and usually reach your account in 5–7 business days,
            depending on your bank.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Failed payments">
        <p>
          If a payment fails but money left your account, it is normally returned automatically by your bank within
          5–7 business days. If it isn&apos;t, contact us with the payment details and we&apos;ll help.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
