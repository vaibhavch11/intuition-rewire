"use client";

import Link from "@/components/Link";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStoredString, writeStored } from "@/lib/browserStore";
import { completedFrom, PROGRESS_KEY, setTopicComplete } from "@/lib/progress";

const RATINGS = [
  { value: 1, face: "😞", label: "Not helpful" },
  { value: 2, face: "🙁", label: "Somewhat helpful" },
  { value: 3, face: "🙂", label: "Helpful" },
  { value: 4, face: "🤩", label: "Very helpful" },
];

interface Neighbour {
  slug: string;
  title: string;
}

export default function LessonFooter({
  sectionSlug,
  topicSlug,
  prev,
  next,
}: {
  sectionSlug: string;
  topicSlug: string;
  prev: Neighbour | null;
  next: Neighbour | null;
}) {
  const progressRaw = useStoredString(PROGRESS_KEY);
  const completed = useMemo(
    () => completedFrom(progressRaw, sectionSlug).includes(topicSlug),
    [progressRaw, sectionSlug, topicSlug]
  );

  const ratingKey = `ir:rating:${sectionSlug}/${topicSlug}`;
  const ratingRaw = useStoredString(ratingKey);
  const rating = Number(ratingRaw) || null;

  const navClass =
    "font-label-md text-label-md inline-flex items-center gap-space-xs rounded-lg bg-primary-container px-space-lg py-space-sm text-on-primary hover:bg-primary";

  return (
    <div className="mt-space-2xl">
      <div className="flex items-center justify-between gap-space-base">
        {prev ? (
          <Link href={`/dsa/${sectionSlug}/${prev.slug}`} className={navClass}>
            <ChevronLeft size={16} />
            Prev
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/dsa/${sectionSlug}/${next.slug}`} className={navClass}>
            Next
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="mt-space-lg flex justify-end">
        <label className="font-body-md text-body-md flex cursor-pointer items-center gap-space-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) =>
              setTopicComplete(sectionSlug, topicSlug, e.target.checked)
            }
            className="h-4 w-4 accent-primary"
          />
          Mark completed
        </label>
      </div>

      <div className="mt-space-xl border-t border-outline-variant/50 pt-space-lg text-center">
        <p className="font-label-md text-label-md text-on-surface">
          Was this helpful?
        </p>
        <div className="mt-space-md flex justify-center gap-space-sm">
          {RATINGS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              aria-pressed={rating === option.value}
              title={option.label}
              onClick={() =>
                writeStored(
                  ratingKey,
                  rating === option.value ? "" : String(option.value)
                )
              }
              className={`rounded-full p-space-sm text-xl transition-all ${
                rating === option.value
                  ? "bg-primary-fixed scale-110"
                  : "opacity-60 hover:bg-surface-container hover:opacity-100"
              }`}
            >
              {option.face}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
