import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = { title: "Terms of Service — IntuitionRewire" };

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" updated="26 September 2026">
      <LegalSection heading="Using IntuitionRewire">
        <p>
          IntuitionRewire is a learning site for data structures and
          algorithms. By creating an account or using the site you agree to
          these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <ul>
          <li>Keep your sign-in details to yourself; one person per account.</li>
          <li>You are responsible for activity under your account.</li>
          <li>
            We may suspend accounts that abuse the service or break these terms.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>
          Don&apos;t attempt to break, overload or gain unauthorised access to
          the site, scrape it at scale, or use it to harm others.
        </p>
      </LegalSection>

      <LegalSection heading="Content">
        <p>
          Lessons, diagrams and simulations belong to IntuitionRewire. You are
          welcome to use what you learn — including the code examples — in
          your own work.
        </p>
      </LegalSection>

      <LegalSection heading="No warranty">
        <p>
          The site is provided as it is. We work to keep it accurate and
          available, but we can&apos;t guarantee it will always be error-free
          or online, and we aren&apos;t liable for losses from using it.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and contact">
        <p>
          We may update these terms and will change the date above when we do.
          Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
