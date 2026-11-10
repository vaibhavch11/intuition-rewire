import type { Metadata } from "next";
import Link from "@/components/Link";
import GoogleButton from "@/components/auth/GoogleButton";
import LoginForm from "@/components/auth/LoginForm";
import { LINK_ERRORS } from "@/components/auth/messages";
import {
  Alert,
  AuthCard,
  AuthFields,
  Divider,
  NotConfigured,
} from "@/components/auth/ui";
import { isLessonPath, safeNextPath } from "@/lib/auth/paths";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in — IntuitionRewire" };

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const next = safeNextPath(first(params.next));
  const linkError = LINK_ERRORS[first(params.error) ?? ""];

  return (
    <AuthCard
      title="Welcome back"
      subtitle={
        isLessonPath(next)
          ? "Sign in to track your progress. Every lesson stays open either way."
          : "Sign in to continue learning."
      }
      footer={
        <>
          New to IntuitionRewire?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured() && <NotConfigured />}
      {linkError && (
        <div className="mb-space-md">
          <Alert tone="error">{linkError}</Alert>
        </div>
      )}
      <AuthFields>
        <GoogleButton next={next} />
        <Divider />
        <LoginForm next={next} />
      </AuthFields>
    </AuthCard>
  );
}
