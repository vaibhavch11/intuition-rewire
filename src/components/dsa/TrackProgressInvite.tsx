"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";

/**
 * A quiet invitation, never a wall: every lesson is open to read, and an
 * account only adds progress tracking. Sign-in returns the reader here.
 */
export default function TrackProgressInvite({ text = "to track your progress.", className = "" }: { text?: string; className?: string }) {
  const next = encodeURIComponent(usePathname());
  return (
    <p className={`font-body-sm text-body-sm text-on-surface-variant ${className}`}>
      <Link href={`/login?next=${next}`} className="font-semibold text-primary hover:underline">
        Sign in
      </Link>{" "}
      {text}
    </p>
  );
}
