"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import TrackProgressInvite from "@/components/dsa/TrackProgressInvite";
import { useLessonsLocked } from "@/lib/auth/useUser";

/**
 * Above a course's contents, for signed-out readers. A free course invites
 * them to track progress; any other course explains that its lessons open
 * with a free account, with the way in right there.
 */
export default function CourseProgressInvite({ free }: { free: boolean }) {
  const locked = useLessonsLocked();
  const next = encodeURIComponent(usePathname());
  if (!locked) return null;

  if (free) {
    return (
      <TrackProgressInvite
        className="mt-space-xs"
        text="to track your progress through each chapter. This course is free to read either way."
      />
    );
  }

  return (
    <div className="mt-space-md flex flex-col gap-space-md rounded-xl border border-primary/25 bg-primary-fixed/25 p-space-md motion-safe:animate-fade-in sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-space-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <Lock size={16} aria-hidden />
        </span>
        <div>
          <p className="font-label-md text-label-md font-semibold text-on-surface">
            Sign in to read these lessons
          </p>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            A free account opens every lesson, simulator and dry run, and saves your progress.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-space-sm">
        <Link
          href={`/signup?next=${next}`}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
        >
          Sign up free
        </Link>
        <Link
          href={`/login?next=${next}`}
          className="inline-flex h-9 items-center justify-center rounded-lg px-space-md font-label-md text-label-md font-semibold text-on-surface ring-1 ring-inset ring-outline-variant transition-colors hover:bg-surface-container-low"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
