"use client";

import { useProgress } from "@/lib/progress";

export default function ChapterProgress({
  sectionSlug,
  topicSlugs,
}: {
  sectionSlug: string;
  topicSlugs: string[];
}) {
  const { status, done } = useProgress(sectionSlug);
  // Only signed-in readers track progress.
  if (status !== "ready") return null;

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
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
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
