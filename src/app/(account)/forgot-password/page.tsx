import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { AuthCard, AuthFields, NotConfigured } from "@/components/auth/ui";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reset your password — IntuitionRewire" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {!isSupabaseConfigured() && <NotConfigured />}
      <AuthFields>
        <ForgotPasswordForm />
      </AuthFields>
    </AuthCard>
  );
}
