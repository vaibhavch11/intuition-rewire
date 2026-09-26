"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Gauge, Layers, Cpu, Sigma, type LucideIcon } from "lucide-react";
import { sectionsByCategory } from "@/lib/dsa/data";

type Category = "ds" | "algo" | "sys";

const TABS: { id: Category; label: string }[] = [
  { id: "ds", label: "Data Structures" },
  { id: "algo", label: "Algorithms" },
  { id: "sys", label: "System Memory" },
];

const ICONS: Record<string, ReactNode> = {
  arrays: (
    <svg className="w-10 h-10 text-primary-container" fill="currentColor" viewBox="0 0 24 24">
      <rect height="5" rx="1" width="5" x="3" y="3" />
      <rect height="5" rx="1" width="5" x="9.5" y="3" />
      <rect height="5" rx="1" width="5" x="16" y="3" />
      <rect height="5" rx="1" width="5" x="3" y="9.5" />
      <rect height="5" rx="1" width="5" x="9.5" y="9.5" />
      <rect height="5" rx="1" width="5" x="16" y="9.5" />
      <rect height="5" rx="1" width="5" x="3" y="16" />
      <rect height="5" rx="1" width="5" x="9.5" y="16" />
      <rect height="5" rx="1" width="5" x="16" y="16" />
    </svg>
  ),
  strings: (
    <svg className="w-10 h-10 text-secondary" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.5 6A4.5 4.5 0 0 0 2 10.5 4.5 4.5 0 0 0 6.5 15c.48 0 .94-.08 1.37-.22-.6 1.84-2.15 3.26-4.08 3.74L4.4 21c3.86-.96 6.6-4.43 6.6-8.5v-2A4.5 4.5 0 0 0 6.5 6z" />
      <path d="M17.5 6A4.5 4.5 0 0 0 13 10.5 4.5 4.5 0 0 0 17.5 15c.48 0 .94-.08 1.37-.22-.6 1.84-2.15 3.26-4.08 3.74L15.4 21c3.86-.96 6.6-4.43 6.6-8.5v-2A4.5 4.5 0 0 0 17.5 6z" />
    </svg>
  ),
  "singly-linked-list": (
    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M9 6h6a3 3 0 0 1 3 3v6" />
    </svg>
  ),
  "doubly-linked-list": (
    <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="3" />
      <circle cx="19" cy="12" r="3" />
      <line x1="8" x2="16" y1="10" y2="10" />
      <line x1="8" x2="16" y1="14" y2="14" />
    </svg>
  ),
  "hash-table": (
    <svg className="w-10 h-10 text-tertiary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect height="16" rx="1" width="7" x="3" y="4" />
      <rect height="16" rx="1" width="7" x="14" y="4" />
      <path d="M10 8h4M10 12h4M10 16h4" />
    </svg>
  ),
  stack: (
    <svg className="w-10 h-10 text-primary-container" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect height="4" rx="1" width="14" x="5" y="4" />
      <rect height="4" rx="1" width="14" x="5" y="10" />
      <rect height="4" rx="1" width="14" x="5" y="16" />
    </svg>
  ),
  queue: (
    <svg className="w-10 h-10 text-on-secondary-container" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect height="10" rx="1" width="8" x="8" y="7" />
      <path d="M4 12h4M16 12h4M6 9l-2 3 2 3M18 9l2 3-2 3" />
    </svg>
  ),
  "binary-tree": (
    <svg className="w-10 h-10 text-primary-container" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M10 7L7 16M14 7l3 9" />
    </svg>
  ),
  "binary-search-tree": (
    <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="4" cy="19" r="1.5" />
      <circle cx="10" cy="19" r="1.5" />
      <path d="M11 6.5L8 10.5M13 6.5l3 4M6 13.5l-1.5 4M8 13.5l1.5 4" />
    </svg>
  ),
  heap: (
    <svg className="w-10 h-10 text-tertiary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polygon points="12 3 4 19 20 19" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  ),
  graph: (
    <svg className="w-10 h-10 text-primary-container" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <line x1="8.5" x2="15.5" y1="6" y2="6" />
      <line x1="18" x2="18" y1="8.5" y2="15.5" />
      <line x1="15.5" x2="8.5" y1="18" y2="18" />
      <line x1="8" x2="16" y1="8" y2="16" />
    </svg>
  ),
  trie: (
    <svg className="w-10 h-10 text-on-secondary-container" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="4" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="6" cy="20" r="2" />
      <line x1="10.5" x2="7.5" y1="5.5" y2="10.5" />
      <line x1="13.5" x2="16.5" y1="5.5" y2="10.5" />
      <line x1="6" x2="6" y1="14" y2="18" />
    </svg>
  ),
};

const DS_ORDER = [
  "arrays",
  "strings",
  "singly-linked-list",
  "doubly-linked-list",
  "hash-table",
  "stack",
  "queue",
  "binary-tree",
  "binary-search-tree",
  "heap",
  "graph",
  "trie",
];

const SYSTEM_MEMORY_CARDS: { title: string; note: string; icon: LucideIcon }[] = [
  { title: "Cache Locality", note: "L1/L2 spatial locality", icon: Gauge },
  { title: "Stack vs Heap", note: "allocation lifetimes", icon: Layers },
  { title: "Pointers & Addresses", note: "indirection cost", icon: Cpu },
];

function DsCard({
  slug,
  title,
  lessons,
}: {
  slug: string;
  title: string;
  lessons: number;
}) {
  return (
    <Link
      href={`/dsa/${slug}`}
      className="group relative flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-surface-container-low flex items-center justify-center mb-space-sm group-hover:bg-primary-fixed/40 transition-colors">
        {ICONS[slug]}
      </div>
      <span className="font-label-md text-label-md text-on-surface font-semibold">
        {title}
      </span>
      <span className="font-code-sm text-code-sm text-on-surface-variant mt-0.5">
        {lessons} Lesson{lessons === 1 ? "" : "s"}
      </span>
    </Link>
  );
}

export default function LearningPathSection() {
  const [tab, setTab] = useState<Category>("ds");
  const dsSections = sectionsByCategory("data-structure");
  const algoSections = sectionsByCategory("algorithm");

  const orderedDs = DS_ORDER.map((slug) =>
    dsSections.find((s) => s.slug === slug)
  ).filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <section className="w-full bg-surface-container-low/60 py-space-2xl" id="learning-path">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="text-center max-w-3xl mx-auto mb-space-xl">
          <div className="inline-flex items-center px-space-sm py-space-2xs rounded-full bg-primary-fixed-dim/30 mb-space-xs">
            <span className="font-label-tag text-label-tag text-primary uppercase">
              The Ultimate DSA Roadmap
            </span>
          </div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
            Structured <span className="text-primary-container">Learning Path</span>
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
            Follow an expert-curated Data Structures and Algorithms learning path
            that takes you from memory fundamentals to advanced concepts through
            in-depth hardware explanations and structured interview progression.
          </p>

          <div className="inline-flex p-1.5 rounded-xl bg-surface-container mt-space-lg shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  tab === t.id
                    ? "px-space-lg py-2 rounded-lg font-label-md text-label-md bg-primary-container text-on-primary shadow-sm transition-all"
                    : "px-space-lg py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-all"
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg lg:p-space-2xl overflow-x-auto">
          {tab === "ds" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-md motion-safe:animate-fade-in">
              {orderedDs.map((s) => (
                <DsCard
                  key={s.slug}
                  slug={s.slug}
                  title={s.title}
                  lessons={s.topics.length}
                />
              ))}
            </div>
          )}

          {tab === "algo" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-space-md motion-safe:animate-fade-in">
              {algoSections.map((s) => (
                <Link
                  key={s.slug}
                  href={`/dsa/${s.slug}`}
                  className="group flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-surface-container-low flex items-center justify-center mb-space-sm group-hover:bg-primary-fixed/40 transition-colors">
                    <Sigma className="text-primary-container" size={38} />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    {s.title}
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant mt-0.5">
                    {s.topics.length} topic{s.topics.length === 1 ? "" : "s"}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {tab === "sys" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md motion-safe:animate-fade-in">
              {SYSTEM_MEMORY_CARDS.map((c) => (
                <div
                  key={c.title}
                  className="flex flex-col items-center justify-center p-space-lg rounded-xl bg-surface-container-lowest shadow-sm text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-surface-container-low flex items-center justify-center mb-space-sm">
                    <c.icon className="text-primary-container" size={38} />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    {c.title}
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant mt-0.5">
                    {c.note}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
