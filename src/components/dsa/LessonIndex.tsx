"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useStoredString } from "@/lib/browserStore";
import { completedFrom, PROGRESS_KEY } from "@/lib/progress";

export interface IndexItem {
  slug: string;
  title: string;
}

export interface IndexChapter {
  title: string;
  items: IndexItem[];
}

export default function LessonIndex({
  sectionSlug,
  sectionTitle,
  chapters,
  currentSlug,
  totalTopics,
}: {
  sectionSlug: string;
  sectionTitle: string;
  chapters: IndexChapter[];
  currentSlug: string;
  totalTopics: number;
}) {
  const [hidden, setHidden] = useState(false);
  const raw = useStoredString(PROGRESS_KEY);

  const done = useMemo(
    () => new Set(completedFrom(raw, sectionSlug)),
    [raw, sectionSlug]
  );
  const percent =
    totalTopics === 0 ? 0 : Math.round((done.size / totalTopics) * 100);

  if (hidden) {
    return (
      <aside className="hidden shrink-0 border-r border-outline-variant/60 bg-surface-container-lowest lg:block">
        <div className="sticky top-header-height p-space-sm">
          <button
            type="button"
            onClick={() => setHidden(false)}
            aria-label="Show index"
            className="rounded-lg p-space-sm text-on-surface-variant hover:bg-surface-container hover:text-primary"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-[296px] shrink-0 border-r border-outline-variant/60 bg-surface-container-lowest lg:block">
      <div className="sticky top-header-height flex h-[calc(100vh-var(--spacing-header-height))] flex-col">
        <div className="flex justify-start border-b border-outline-variant/40 px-space-md py-space-sm">
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="font-label-md text-label-md flex items-center gap-space-xs rounded-lg px-space-sm py-space-2xs text-on-surface-variant hover:bg-surface-container hover:text-primary"
          >
            Hide Index
            <ChevronsLeft size={16} />
          </button>
        </div>

        <div className="border-b border-outline-variant/40 px-space-base py-space-md">
          <Link
            href={`/dsa/${sectionSlug}`}
            className="font-headline-md text-headline-md block text-center font-bold text-primary hover:underline"
          >
            {sectionTitle}
          </Link>
          <p className="font-body-sm text-body-sm mt-space-sm text-on-surface-variant">
            {percent}% completed
          </p>
          <div
            className="mt-space-xs h-1 overflow-hidden rounded-full bg-surface-container-highest"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${sectionTitle} course progress`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-space-base py-space-md">
          {chapters.map((chapter) => (
            <div key={chapter.title} className="mb-space-xl last:mb-0">
              <h2 className="font-body-lg text-body-lg mb-space-md font-bold text-on-surface">
                {chapter.title}
              </h2>
              <ul>
                {chapter.items.map((item, i) => {
                  const active = item.slug === currentSlug;
                  return (
                    <li key={item.slug} className="relative pl-space-xl">
                      {i > 0 && (
                        <span
                          aria-hidden
                          className="absolute left-[7px] top-0 h-1/2 w-px bg-outline-variant"
                        />
                      )}
                      {i < chapter.items.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-[7px] top-1/2 h-1/2 w-px bg-outline-variant"
                        />
                      )}
                      <span
                        aria-hidden
                        className={`absolute left-0 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full border-[1.5px] ${
                          done.has(item.slug)
                            ? "border-primary bg-primary"
                            : "border-outline bg-surface-container-lowest"
                        }`}
                      />
                      <Link
                        href={`/dsa/${sectionSlug}/${item.slug}`}
                        aria-current={active ? "page" : undefined}
                        className={`font-body-md text-body-md block rounded px-space-md py-space-sm ${
                          active
                            ? "bg-primary-fixed font-semibold text-on-primary-fixed"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
