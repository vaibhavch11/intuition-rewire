"use client";

import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Lock } from "lucide-react";
import Link from "@/components/Link";
import TopicIcon from "@/components/home/TopicIcons";
import { useLessonsLocked } from "@/lib/auth/useUser";
import type { Difficulty } from "@/lib/dsa/types";
import type { PathLevel } from "@/lib/dsa/path";

/** One course, with just what the curriculum shows: small enough to send to the browser. */
export type CurriculumCourse = {
  slug: string;
  title: string;
  description: string;
  free: boolean;
  lessons: number;
  problems: number;
  chapters: { title: string; topics: { slug: string; title: string; problem: boolean; difficulty?: Difficulty }[] }[];
};

export type CurriculumStage = {
  level: PathLevel;
  note: string;
  rows: { n: number; blurb: string; course: CurriculumCourse }[];
};

const LEVEL_DOT: Record<PathLevel, string> = {
  Beginner: "bg-[#22c55e]",
  Intermediate: "bg-[#f59e0b]",
  Advanced: "bg-[#ef4444]",
};

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  Fundamental: "text-on-surface-variant",
  Easy: "text-[#15803d] dark:text-[#4ade80]",
  Medium: "text-[#b45309] dark:text-[#fbbf24]",
  Hard: "text-[#b91c1c] dark:text-[#f87171]",
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The DSA curriculum: every course in a Beginner / Intermediate / Advanced
 * board, in the order to take them, and under it the chosen course's
 * chapters and lessons. Picking a course swaps the panel below; on phones
 * the page also scrolls down to it.
 */
export default function CurriculumExplorer({ stages }: { stages: CurriculumStage[] }) {
  const rows = stages.flatMap((s) => s.rows.map((r) => ({ ...r, level: s.level })));
  const [selected, setSelected] = useState(rows[0]?.course.slug ?? "");
  const panelRef = useRef<HTMLDivElement>(null);
  const locked = useLessonsLocked();

  const current = rows.find((r) => r.course.slug === selected) ?? rows[0];
  if (!current) return null;
  const { course } = current;
  const courseLocked = locked && !course.free;

  const choose = (slug: string) => {
    setSelected(slug);
    // On phones the panel is below the whole board, so bring it into view.
    if (window.matchMedia("(max-width: 959px)").matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <>
      {/* The board */}
      <section aria-labelledby="curriculum-title" className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
        <div className="border-b border-outline-variant/50 px-space-base py-space-md sm:px-space-lg">
          <h2 id="curriculum-title" className="text-[18px] font-bold tracking-tight text-on-surface sm:text-[20px]">
            Curriculum structure
          </h2>
          <p className="text-[13px] text-on-surface-variant">Take the courses in order. Pick one to see what&rsquo;s inside.</p>
        </div>
        <div className="grid lg:grid-cols-3 lg:divide-x lg:divide-outline-variant/50">
          {stages.map((stage) => (
            <div key={stage.level} className="pb-space-sm">
              <div className="px-space-base pb-space-sm pt-space-md sm:px-space-lg">
                <p className="flex items-center gap-2 font-code-sm text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface">
                  <span aria-hidden className={`h-2 w-2 rounded-full ${LEVEL_DOT[stage.level]}`} />
                  {stage.level}
                  <span className="font-normal text-on-surface-variant">
                    {pad(stage.rows[0].n)}–{pad(stage.rows[stage.rows.length - 1].n)}
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] text-on-surface-variant">{stage.note}</p>
              </div>
              <ol className="px-space-sm sm:px-space-md">
                {stage.rows.map((row) => {
                  const active = row.course.slug === course.slug;
                  return (
                    <li key={row.course.slug}>
                      <button
                        type="button"
                        onClick={() => choose(row.course.slug)}
                        aria-pressed={active}
                        title={row.blurb}
                        className={`group flex w-full items-center gap-space-md rounded-xl px-space-sm py-2 text-left transition-colors sm:px-space-md ${
                          active ? "bg-primary-fixed/60 ring-1 ring-inset ring-primary/40" : "hover:bg-surface-container-low"
                        }`}
                      >
                        <span className={`w-6 shrink-0 font-code-sm text-[13px] font-semibold tabular-nums ${active ? "text-primary" : "text-on-surface-variant"}`}>
                          {pad(row.n)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[15px] font-semibold leading-snug ${active ? "text-primary" : "text-on-surface"}`}>
                            {row.course.title}
                          </span>
                          <span className="block text-[12.5px] text-on-surface-variant">
                            {row.course.lessons + row.course.problems} lessons
                          </span>
                        </span>
                        <ChevronRight
                          size={16}
                          aria-hidden
                          className={`shrink-0 transition-transform ${active ? "translate-x-0.5 text-primary" : "text-on-surface-variant group-hover:translate-x-0.5"}`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* The chosen course */}
      <div ref={panelRef} className="scroll-mt-[calc(var(--spacing-header-height)+16px)]">
        <section
          key={course.slug}
          aria-label={`${course.title}: chapters and lessons`}
          className="mt-space-lg overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest motion-safe:animate-fade-in"
        >
          <div className="flex flex-col gap-space-md border-b border-outline-variant/50 px-space-base py-space-lg sm:flex-row sm:items-start sm:justify-between sm:px-space-lg">
            <div className="flex items-start gap-space-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
                <TopicIcon slug={course.slug} size={32} />
              </span>
              <div>
                <p className="flex items-center gap-2 font-code-sm text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  <span aria-hidden className={`h-2 w-2 rounded-full ${LEVEL_DOT[current.level]}`} />
                  {pad(current.n)} · {current.level}
                </p>
                <h3 className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight text-on-surface sm:text-[26px]">{course.title}</h3>
                <p className="mt-1 max-w-2xl text-[14.5px] leading-relaxed text-on-surface-variant">{course.description}</p>
                <p className="mt-space-sm font-code-sm text-[12px] text-on-surface-variant">
                  {course.chapters.length} chapters · {course.lessons} lessons
                  {course.problems > 0 ? ` · ${course.problems} problems` : ""}
                </p>
              </div>
            </div>
            <Link
              href={`/dsa/${course.slug}`}
              className="group inline-flex h-10 shrink-0 items-center justify-center gap-space-sm self-start rounded-[10px] bg-primary-container px-space-base text-[14px] font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
            >
              {course.free ? "Start" : "Open course"}
              <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Chapters: the first is open; the rest open with a tap. */}
          <div className="divide-y divide-outline-variant/40">
            {course.chapters.map((chapter, ci) => (
              <details key={chapter.title} open={ci === 0} className="group/ch">
                <summary className="flex cursor-pointer list-none items-center gap-space-md px-space-base py-space-md transition-colors hover:bg-surface-container-low sm:px-space-lg [&::-webkit-details-marker]:hidden">
                  <span className="w-6 shrink-0 font-code-sm text-[12px] font-semibold tabular-nums text-on-surface-variant">{ci + 1}.</span>
                  <span className="min-w-0 flex-1 text-[15px] font-semibold text-on-surface">{chapter.title}</span>
                  <span className="shrink-0 text-[12.5px] text-on-surface-variant">
                    {chapter.topics.length} {chapter.topics.length === 1 ? "lesson" : "lessons"}
                  </span>
                  <ChevronDown size={16} aria-hidden className="shrink-0 text-on-surface-variant transition-transform duration-200 group-open/ch:rotate-180" />
                </summary>
                <ol className="pb-space-sm">
                  {chapter.topics.map((topic) => (
                    <li key={topic.slug}>
                      <Link
                        href={`/dsa/${course.slug}/${topic.slug}`}
                        className="group/lesson flex items-center gap-space-md py-2 pl-[3.25rem] pr-space-base text-[14px] text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface sm:pl-[3.75rem] sm:pr-space-lg"
                      >
                        <span aria-hidden className={`h-1.5 w-1.5 shrink-0 ${topic.problem ? "rounded-[2px] bg-primary/60" : "rounded-full bg-outline"}`} />
                        <span className="min-w-0 flex-1">{topic.title}</span>
                        {topic.difficulty && topic.difficulty !== "Fundamental" && (
                          <span className={`shrink-0 text-[12px] font-semibold ${DIFFICULTY_TONE[topic.difficulty]}`}>{topic.difficulty}</span>
                        )}
                        {courseLocked && <Lock size={13} aria-label="Sign in to read" className="shrink-0 text-on-surface-variant/70" />}
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
