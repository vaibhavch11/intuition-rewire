import type { Metadata } from "next";
import Link from "next/link";
import GoogleButton from "@/components/auth/GoogleButton";
import SignupForm from "@/components/auth/SignupForm";
import {
  AuthCard,
  AuthFields,
  Divider,
  NotConfigured,
} from "@/components/auth/ui";
import { safeNextPath } from "@/lib/auth/paths";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create your account — IntuitionRewire" };

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function SignupPage(props: PageProps<"/signup">) {
  const next = safeNextPath(first((await props.searchParams).next));

  return (
    <AuthCard
      title="Create your account"
      subtitle="Free, and it takes a few seconds. Use Google or any email address."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured() && <NotConfigured />}
      <AuthFields>
        <GoogleButton next={next} />
        <Divider />
        <SignupForm next={next} />
      </AuthFields>
      <p className="font-body-sm text-body-sm mt-space-md text-center text-on-surface-variant">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthCard>
  );
}
