"use client";

import Link from "@/components/Link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useStoredString } from "@/lib/browserStore";
import { completedFrom, PROGRESS_KEY } from "@/lib/progress";

/** A small pulsing dot on the lesson being opened, until it arrives. */
function PendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`ml-space-xs inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-container align-middle transition-opacity duration-200 ${
        pending ? "opacity-100 motion-safe:animate-pulse" : "opacity-0"
      }`}
    />
  );
}

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
  totalTopics,
}: {
  sectionSlug: string;
  sectionTitle: string;
  chapters: IndexChapter[];
  totalTopics: number;
}) {
  const [hidden, setHidden] = useState(false);
  const raw = useStoredString(PROGRESS_KEY);
  const navRef = useRef<HTMLElement>(null);

  // Read from the URL rather than a prop, so switching lessons updates the
  // highlight without re-creating this component (and losing its scroll).
  const currentSlug = usePathname().split("/").pop() ?? "";

  // Only on first mount: bring the active lesson into view when someone lands
  // directly on a deep link. Later navigations keep whatever scroll they had.
  // Scrolls the index only: scrollIntoView would also scroll the page, landing
  // readers (and visitors from search) below the lesson's title.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const navTop = nav.getBoundingClientRect().top;
    const box = active.getBoundingClientRect();
    nav.scrollTop += box.top - navTop - (nav.clientHeight - box.height) / 2;
  }, []);

  const done = useMemo(
    () => new Set(completedFrom(raw, sectionSlug)),
    [raw, sectionSlug]
  );
  // Saved progress can still list lessons since removed in /admin, so only
  // lessons that are in the course now count.
  const finished = chapters.reduce(
    (count, chapter) =>
      count + chapter.items.filter((item) => done.has(item.slug)).length,
    0
  );
  const percent =
    totalTopics === 0 ? 0 : Math.round((finished / totalTopics) * 100);

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

        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto px-space-base py-space-md"
        >
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
                        className={`absolute left-0 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full border-[1.5px] transition-colors duration-200 ${
                          done.has(item.slug)
                            ? "border-primary bg-primary"
                            : active
                              ? "border-primary-container bg-primary-fixed"
                              : "border-outline bg-surface-container-lowest"
                        }`}
                      />
                      <Link
                        href={`/dsa/${sectionSlug}/${item.slug}`}
                        aria-current={active ? "page" : undefined}
                        className={`font-body-md text-body-md block rounded-lg px-space-md py-space-sm transition-colors duration-200 ${
                          active
                            ? "bg-primary-fixed font-semibold text-on-primary-fixed shadow-[inset_3px_0_0_var(--c-primary-container)]"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                        }`}
                      >
                        {item.title}
                        <PendingDot />
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
