import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Alert, AuthCard } from "@/components/auth/ui";
import { getSignedInUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Choose a new password — IntuitionRewire",
  robots: { index: false },
};

/** Reached through a reset email: /auth/callback signs the user in first. */
export default async function ResetPasswordPage() {
  const user = await getSignedInUser();

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={
        user?.email
          ? `For ${user.email}.`
          : "Reset links sign you in for a short while."
      }
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Alert tone="error">
          This reset link has expired or was already used.{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Send a new one
          </Link>
        </Alert>
      )}
    </AuthCard>
  );
}
