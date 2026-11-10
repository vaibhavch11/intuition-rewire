"use client";

import TrackProgressInvite from "@/components/dsa/TrackProgressInvite";
import { useProgress } from "@/lib/progress";

/** Under a course's contents, for signed-out readers: what an account adds. */
export default function CourseProgressInvite() {
  const { status } = useProgress("");
  if (status !== "signed-out") return null;
  return (
    <TrackProgressInvite
      className="mt-space-xs"
      text="to track your progress through each chapter. Every lesson is open to read either way."
    />
  );
}
