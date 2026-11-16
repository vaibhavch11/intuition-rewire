"use client";

import { Lock } from "lucide-react";
import { useLessonsLocked } from "@/lib/auth/useUser";

/** A small lock beside a lesson that a signed-out reader needs an account for. */
export default function LessonLockMark({ className = "" }: { className?: string }) {
  if (!useLessonsLocked()) return null;
  return (
    <span
      title="Sign in to read"
      className={`inline-flex shrink-0 items-center text-on-surface-variant/70 motion-safe:animate-fade-in ${className}`}
    >
      <Lock size={13} aria-hidden />
      <span className="sr-only">(sign in to read)</span>
    </span>
  );
}
