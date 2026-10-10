import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CONTACT_EMAIL, LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | IntuitionRewire",
  description:
    "How IntuitionRewire handles your data: what we collect to sign you in, see how the site is used and keep it secure. We never sell your data or show ads.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated="10 October 2026">
      <LegalSection heading="The short version">
        <p>
          We collect what we need to sign you in, see how the site is used
          and keep it secure. We don&apos;t sell your data or show ads.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <ul>
          <li>
            <strong>Your account.</strong> Your email address and, if you sign
            in with Google, the name and profile picture Google shares with us.
            If you use a password, it is stored in hashed form by our
            authentication provider — we never see it.
          </li>
          <li>
            <strong>A session cookie</strong> that keeps you signed in. It is
            strictly necessary for the site to work and is not used for
            tracking.
          </li>
          <li>
            <strong>Usage analytics.</strong> Which pages you visit and how you
            use them, such as what you click, how far you scroll and
            recordings of your visit, measured with PostHog. Anything you type
            into a form is hidden from recordings. PostHog sets a cookie so it
            can tell when the same browser comes back. When you are signed in,
            this is linked to your account ID, never to your email or name.
          </li>
          <li>
            <strong>Your learning progress and reactions</strong>, which stay
            in your own browser&apos;s storage and are never sent to us.
          </li>
          <li>
            <strong>Technical logs.</strong> Our hosting provider processes IP
            addresses and request details to deliver pages and block abuse.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          To create and sign in to your account, give you access to lessons,
          see which lessons help and where the site needs work, and protect
          the service against misuse. Nothing else.
        </p>
      </LegalSection>

      <LegalSection heading="Who processes it for us">
        <ul>
          <li>
            <strong>Supabase</strong> — account and sign-in management.
          </li>
          <li>
            <strong>Google</strong> — only if you choose to sign in with Google.
          </li>
          <li>
            <strong>Cloudflare</strong> — hosting, content storage and security.
          </li>
          <li>
            <strong>PostHog</strong> — usage analytics, stored in the United
            States.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Account details are kept for as long as your account exists. Ask us
          and we will delete your account and its data.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can ask to see, correct or delete the information we hold about
          you at any time by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. To opt
          out of analytics, turn on your browser&apos;s tracking protection or
          use a content blocker; the site works the same without it.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If this policy changes, we will update this page and its date. See
          also our <Link href="/terms">Terms of Service</Link>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
