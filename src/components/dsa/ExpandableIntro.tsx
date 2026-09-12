"use client";

import { useState, type ReactNode } from "react";

export default function ExpandableIntro({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section>
      <div className="relative">
        <div
          id="course-intro"
          className={expanded ? undefined : "max-h-[26rem] overflow-hidden"}
        >
          {children}
        </div>
        {!expanded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent"
          />
        )}
      </div>

      <div className="mt-space-sm flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="course-intro"
          className="font-label-md text-label-md rounded-lg border border-primary px-space-base py-space-xs text-primary transition-colors hover:bg-primary-fixed"
        >
          {expanded ? "See Less" : "See More"}
        </button>
      </div>
    </section>
  );
}
