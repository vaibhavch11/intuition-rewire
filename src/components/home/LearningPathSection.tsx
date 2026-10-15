"use client";

import { useState, type CSSProperties } from "react";
import Link from "@/components/Link";

import type { CourseSummary } from "@/lib/dsa/types";
import SectionHeader from "@/components/home/SectionHeader";
import TopicIcon from "@/components/home/TopicIcons";

type Category = "ds" | "algo" | "sys";

const TABS: { id: Category; label: string }[] = [
  { id: "ds", label: "Data Structures" },
  { id: "algo", label: "Algorithms" },
  { id: "sys", label: "System Memory" },
];

const DS_ORDER = [
  "arrays",
  "strings",
  "singly-linked-list",
  "hash-table",
  "stack",
  "queue",
  "binary-tree",
  "binary-search-tree",
  "heap",
  "graph",
  "trie",
];

const SYSTEM_MEMORY_CARDS: { title: string; note: string; icon: string }[] = [
  { title: "Cache Locality", note: "L1/L2 spatial locality", icon: "cache-locality" },
  { title: "Stack vs Heap", note: "allocation lifetimes", icon: "stack-vs-heap" },
  { title: "Pointers & Addresses", note: "indirection cost", icon: "pointers" },
];

/** Same card for every tab: icon tile, title, one line of detail. */
const CARD =
  "group flex flex-col items-center justify-center rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-space-md text-center transition-all duration-200 motion-safe:animate-fade-up";
const LINK_CARD = `${CARD} hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_14px_30px_-18px_rgba(53,37,205,0.45)]`;

function IconTile({ slug }: { slug: string }) {
  return (
    <span className="mb-space-sm flex h-16 items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none">
      <TopicIcon slug={slug} size={54} />
    </span>
  );
}

function CardText({ title, detail }: { title: string; detail: string }) {
  return (
    <>
      <span className="font-label-md text-label-md font-semibold text-on-surface">{title}</span>
      <span className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{detail}</span>
    </>
  );
}

function DsCard({
  slug,
  title,
  lessons,
  style,
}: {
  slug: string;
  title: string;
  lessons: number;
  style?: CSSProperties;
}) {
  return (
    <Link href={`/dsa/${slug}`} style={style} className={LINK_CARD}>
      <IconTile slug={slug} />
      <CardText title={title} detail={`${lessons} lesson${lessons === 1 ? "" : "s"}`} />
    </Link>
  );
}

export default function LearningPathSection({
  courses,
}: {
  courses: CourseSummary[];
}) {
  // `from` is the side the new tab's cards slide in from: the direction you moved.
  const [{ tab, from }, setView] = useState<{ tab: Category; from: "left" | "right" | null }>({
    tab: "ds",
    from: null,
  });
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const choose = (next: Category) => {
    const nextIndex = TABS.findIndex((t) => t.id === next);
    if (nextIndex === tabIndex) return;
    setView({ tab: next, from: nextIndex > tabIndex ? "right" : "left" });
  };
  const slide =
    from === "right" ? "motion-safe:animate-slide-in-right" : from === "left" ? "motion-safe:animate-slide-in-left" : "";
  const stagger = (i: number) => ({ animationDelay: `${60 + i * 35}ms` });
  const dsSections = courses.filter((s) => s.category === "data-structure");
  const algoSections = courses.filter((s) => s.category === "algorithm");

  const orderedDs = DS_ORDER.map((slug) =>
    dsSections.find((s) => s.slug === slug)
  ).filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <section className="w-full bg-surface-container-low/60 py-space-2xl" id="learning-path">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="text-center max-w-3xl mx-auto mb-space-xl">
          <SectionHeader
            eyebrow="The ultimate DSA roadmap"
            title={
              <>
                Structured <span className="text-primary-container">Learning Path</span>
              </>
            }
            lead="Follow an expert-curated Data Structures and Algorithms learning path that takes you from memory fundamentals to advanced concepts through in-depth hardware explanations and structured interview progression."
          />

          {/* Equal-width tabs, so the highlight can slide by exactly one tab. */}
          <div role="tablist" aria-label="Learning path" className="relative mx-auto mt-space-lg grid w-full max-w-md grid-cols-3 rounded-xl bg-surface-container p-1.5 shadow-sm sm:inline-grid sm:w-auto sm:max-w-none">
            <span
              aria-hidden
              className="absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-lg bg-primary-container shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateX(${tabIndex * 100}%)` }}
            />
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => choose(t.id)}
                className={`relative z-10 rounded-lg px-space-sm py-2 font-label-md text-label-md leading-tight transition-colors duration-300 sm:whitespace-nowrap sm:px-space-lg ${
                  tab === t.id ? "text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg lg:p-space-2xl overflow-hidden">
          {/* Keyed by tab, so each switch replays the slide and the card stagger. */}
          <div key={tab} className={slide}>
          {tab === "ds" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-md">
              {orderedDs.map((s, i) => (
                <DsCard
                  key={s.slug}
                  slug={s.slug}
                  title={s.title}
                  lessons={s.lessons}
                  style={stagger(i)}
                />
              ))}
            </div>
          )}

          {tab === "algo" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-space-md">
              {algoSections.map((s, i) => (
                <Link key={s.slug} href={`/dsa/${s.slug}`} style={stagger(i)} className={LINK_CARD}>
                  <IconTile slug={s.slug} />
                  <CardText title={s.title} detail={`${s.lessons} topic${s.lessons === 1 ? "" : "s"}`} />
                </Link>
              ))}
            </div>
          )}

          {tab === "sys" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
              {SYSTEM_MEMORY_CARDS.map((c, i) => (
                <div key={c.title} style={stagger(i)} className={`${CARD} p-space-lg`}>
                  <IconTile slug={c.icon} />
                  <CardText title={c.title} detail={c.note} />
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
