"use client";

import { useMemo } from "react";
import { Bookmark, ThumbsDown, ThumbsUp } from "lucide-react";
import { useStoredString, writeStored } from "@/lib/browserStore";

type Vote = "up" | "down" | null;

interface Reaction {
  vote: Vote;
  bookmarked: boolean;
}

const EMPTY: Reaction = { vote: null, bookmarked: false };

export default function LessonReactions({
  sectionSlug,
  topicSlug,
}: {
  sectionSlug: string;
  topicSlug: string;
}) {
  const key = `ir:reaction:${sectionSlug}/${topicSlug}`;
  const raw = useStoredString(key);

  const reaction = useMemo<Reaction>(() => {
    if (!raw) return EMPTY;
    try {
      return JSON.parse(raw) as Reaction;
    } catch {
      return EMPTY;
    }
  }, [raw]);

  const update = (next: Reaction) => writeStored(key, JSON.stringify(next));

  const actionClass = (active: boolean) =>
    `font-body-md text-body-md flex items-center gap-space-sm rounded px-space-xs py-space-2xs transition-colors ${
      active ? "text-primary" : "text-on-surface-variant hover:text-primary"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-space-lg">
      <button
        type="button"
        aria-label="Helpful"
        aria-pressed={reaction.vote === "up"}
        onClick={() =>
          update({ ...reaction, vote: reaction.vote === "up" ? null : "up" })
        }
        className={actionClass(reaction.vote === "up")}
      >
        <ThumbsUp size={17} />
        {reaction.vote === "up" ? 1 : 0}
      </button>

      <button
        type="button"
        aria-label="Not helpful"
        aria-pressed={reaction.vote === "down"}
        onClick={() =>
          update({ ...reaction, vote: reaction.vote === "down" ? null : "down" })
        }
        className={actionClass(reaction.vote === "down")}
      >
        <ThumbsDown size={17} />
        {reaction.vote === "down" ? 1 : 0}
      </button>

      <button
        type="button"
        aria-pressed={reaction.bookmarked}
        onClick={() => update({ ...reaction, bookmarked: !reaction.bookmarked })}
        className={actionClass(reaction.bookmarked)}
      >
        <Bookmark
          size={17}
          fill={reaction.bookmarked ? "currentColor" : "none"}
        />
        {reaction.bookmarked ? "Bookmarked" : "Bookmark"}
      </button>
    </div>
  );
}
