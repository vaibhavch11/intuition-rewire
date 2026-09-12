"use client";

import { useMemo } from "react";
import { useStoredString } from "@/lib/browserStore";
import { completedFrom, PROGRESS_KEY } from "@/lib/progress";

export default function ChapterProgress({
  sectionSlug,
  topicSlugs,
}: {
  sectionSlug: string;
  topicSlugs: string[];
}) {
  const raw = useStoredString(PROGRESS_KEY);
  const done = useMemo(
    () => new Set(completedFrom(raw, sectionSlug)),
    [raw, sectionSlug]
  );

  const finished = topicSlugs.filter((slug) => done.has(slug)).length;
  const percent =
    topicSlugs.length === 0
      ? 0
      : Math.round((finished / topicSlugs.length) * 100);

  const radius = 11;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      className="shrink-0"
      role="img"
      aria-label={`${percent}% complete`}
      title={`${finished} of ${topicSlugs.length} complete`}
    >
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle
          cx="15"
          cy="15"
          r={radius}
          fill="none"
          strokeWidth="2"
          className="stroke-outline-variant"
        />
        <circle
          cx="15"
          cy="15"
          r={radius}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          transform="rotate(-90 15 15)"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="stroke-primary"
        />
        <text
          x="15"
          y="16"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-on-surface-variant text-[8px]"
        >
          {percent}%
        </text>
      </svg>
    </span>
  );
}
