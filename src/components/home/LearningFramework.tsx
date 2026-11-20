"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Clock, Copy, HardDrive, ListChecks, Pause, Play, SkipBack, SkipForward, Sun } from "lucide-react";
import { useInView, useMediaQuery, usePrefersReducedMotion } from "@/components/home/clientHooks";

/* ---------------- Card icons: flat, colourful, one outline weight ---------------- */

const INK = "var(--icon-ink)";
const PAPER = "var(--icon-paper)";

function ExplainIcon() {
  // An open notebook with a drawn array and a pencil.
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 10c5-2 10-2 16 1v25c-6-3-11-3-16-1z" fill={PAPER} />
      <path d="M21 11c6-3 11-3 16-1v25c-5-2-10-2-16 1z" fill="#a8d8ff" />
      <rect x="8" y="16" width="3.6" height="3.6" rx=".6" fill="#4d9ef5" />
      <rect x="12.2" y="16" width="3.6" height="3.6" rx=".6" fill="#f2605d" />
      <rect x="16.4" y="16" width="3.6" height="3.6" rx=".6" fill="#8ce0ea" />
      <path d="M8 24h9M8 28h7M25 17h8M25 21h9M25 25h6" />
      <path d="M33 4l5 5-11 11-6 1 1-6z" fill="#ffd25e" />
      <path d="M31 6l5 5" />
    </svg>
  );
}

function WalkthroughIcon() {
  // A code window with the running line lit and a play button.
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="6" width="30" height="26" rx="3" fill={PAPER} />
      <path d="M4 12h30" />
      <circle cx="8" cy="9" r=".8" fill="#f2605d" stroke="none" />
      <circle cx="11" cy="9" r=".8" fill="#ffd25e" stroke="none" />
      <rect x="7" y="18" width="20" height="4" rx="1" fill="#8b6cf6" />
      <path d="M8 16h12M8 26h14" />
      <circle cx="33" cy="32" r="8" fill="#3fc1b5" />
      <path d="M31 28.5v7l5.5-3.5z" fill={PAPER} />
    </svg>
  );
}

function ComplexityIcon() {
  // A stopwatch beside a stack of memory blocks: time and space.
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="17" cy="23" r="12" fill="#ffd25e" />
      <path d="M14 7h6M17 7v4M17 23l5-5" />
      <circle cx="17" cy="23" r="1.4" fill={INK} stroke="none" />
      <rect x="29" y="14" width="11" height="7" rx="1.5" fill="#8b6cf6" />
      <rect x="29" y="22" width="11" height="7" rx="1.5" fill="#3fc1b5" />
      <rect x="29" y="30" width="11" height="7" rx="1.5" fill="#a8d8ff" />
    </svg>
  );
}

const STEPS: { icon: () => ReactNode; title: string; body: string }[] = [
  {
    icon: ExplainIcon,
    title: "Hand-drawn explanations",
    body: "Every lesson starts with the idea, drawn: what the problem asks, what sits in memory and why. Pictures first, so the code has something to hang on.",
  },
  {
    icon: WalkthroughIcon,
    title: "Step-by-step dry runs",
    body: "Run the real solution line by line in JavaScript, Python, Java or C++. Watch the tree, the call stack and every variable change, on your own input.",
  },
  {
    icon: ComplexityIcon,
    title: "Time and space, explained",
    body: "Compare brute force, better and best side by side. Every time and space cost comes with a one-line reason, so you can defend it in an interview.",
  },
];

/* ---------------- View 1: the lesson content ---------------- */

function ContentView() {
  return (
    <div className="flex h-full flex-col">
      <p className="flex items-center gap-1 font-label-md text-[10.5px] text-on-surface-variant">
        Courses <ChevronRight size={10} /> Binary Tree <ChevronRight size={10} />
        <span className="text-on-surface">Maximum Depth of Binary Tree</span>
      </p>
      <p className="mt-1.5 text-[19px] font-bold leading-tight tracking-tight text-on-surface">Maximum Depth of Binary Tree</p>
      <p className="mt-2 font-body-sm text-[11.5px] leading-relaxed text-on-surface-variant">
        <span className="font-semibold text-on-surface">The problem.</span> Given the{" "}
        <code className="rounded bg-primary-fixed/60 px-1 font-code-sm text-[10.5px] text-primary">root</code> of a binary tree,
        return its <span className="font-semibold text-on-surface">maximum depth</span>: the number of nodes on the longest path from
        the root down to a leaf.
      </p>
      <div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed lesson drawing from /public */}
        <img
          src="/drawings/c89523ba-a56a-437e-bddd-e230296c27ce.svg"
          alt=""
          loading="lazy"
          className="drawing-art h-full max-h-full w-auto max-w-full object-contain"
        />
      </div>
      <p className="mt-3 text-[13px] font-bold text-on-surface">Example</p>
      <pre className="mt-1.5 m-0 overflow-x-auto rounded-lg bg-surface-container-low px-3 py-2 font-code-sm text-[10.5px] leading-[18px] text-on-surface-variant">
        {"Input:  root = [3, 9, 20, null, null, 15, 7]   Output: 3\nInput:  root = [1, null, 2]                    Output: 2"}
      </pre>
    </div>
  );
}

/* ---------------- View 2: the dry run ---------------- */

const NODES: Record<number, { x: number; y: number }> = {
  3: { x: 110, y: 22 },
  9: { x: 52, y: 76 },
  20: { x: 168, y: 76 },
  15: { x: 132, y: 130 },
  7: { x: 204, y: 130 },
};
const EDGES: [number, number][] = [
  [3, 9],
  [3, 20],
  [20, 15],
  [20, 7],
];
const CODE = [
  "def max_depth(node):",
  "    if node is None:",
  "        return 0",
  "    left = max_depth(node.left)",
  "    right = max_depth(node.right)",
  "    return 1 + max(left, right)",
];

/** One frame per step: the node in focus, the line running, the call stack and the answers so far. */
const TRACE: { node: number; line: number; stack: number[]; done: Record<number, number>; note: ReactNode }[] = [
  { node: 3, line: 0, stack: [3], done: {}, note: <>maxDepth(3) starts at the root.</> },
  { node: 3, line: 3, stack: [3], done: {}, note: <>3 asks its left child first.</> },
  { node: 9, line: 0, stack: [3, 9], done: {}, note: <>maxDepth(9) starts.</> },
  { node: 9, line: 5, stack: [3, 9], done: { 9: 1 }, note: <>9: left says 0, right says 0. Answer <b>1 + max(0, 0) = 1</b>.</> },
  { node: 3, line: 4, stack: [3], done: { 9: 1 }, note: <>Back at 3: now ask the right child.</> },
  { node: 20, line: 3, stack: [3, 20], done: { 9: 1 }, note: <>maxDepth(20) asks its subtrees first.</> },
  { node: 15, line: 5, stack: [3, 20, 15], done: { 9: 1, 15: 1 }, note: <>15 is a leaf: <b>1 + max(0, 0) = 1</b>.</> },
  { node: 7, line: 5, stack: [3, 20, 7], done: { 9: 1, 15: 1, 7: 1 }, note: <>7 is a leaf too: answer <b>1</b>.</> },
  { node: 20, line: 5, stack: [3, 20], done: { 9: 1, 15: 1, 7: 1, 20: 2 }, note: <>20: <b>1 + max(1, 1) = 2</b>.</> },
  { node: 3, line: 5, stack: [3], done: { 9: 1, 15: 1, 7: 1, 20: 2, 3: 3 }, note: <>3: <b>1 + max(1, 2) = 3</b>. The maximum depth is 3.</> },
];

function DryRunView({ playing }: { playing: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % (TRACE.length + 2)), 1200);
    return () => window.clearInterval(id);
  }, [playing]);

  // The two extra ticks hold the answer before the loop restarts.
  const at = Math.min(tick, TRACE.length - 1);
  const s = TRACE[at];
  const LANGS = ["JavaScript", "Python", "Java", "C++"];
  const DOT = ["#eab308", "#3b82f6", "#f97316", "#60a5fa"];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
      <div className="flex items-center gap-2 border-b border-outline-variant/50 bg-surface-container-low/60 px-3 py-2">
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-secondary-container/60 px-2 py-0.5 font-code-sm text-[9px] font-semibold uppercase tracking-wider text-on-secondary-container">
          <ListChecks size={10} /> Dry-run simulator
        </span>
        <span className="truncate font-label-md text-[11.5px] font-semibold text-on-surface">Maximum depth (ask both children, add one)</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2 px-3 pt-2">
        <div>
          <p className="font-code-sm text-[9.5px] text-on-surface-variant">tree</p>
          <svg viewBox="0 0 240 150" className="h-[132px] w-full">
            {EDGES.map(([a, b]) => (
              <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke="var(--color-outline-variant)" strokeWidth="1.4" />
            ))}
            {Object.entries(NODES).map(([key, p]) => {
              const id = Number(key);
              const answered = id in s.done;
              const current = id === s.node;
              return (
                <g key={key}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="13"
                    className="transition-all duration-300"
                    fill={answered ? "rgb(34 197 94 / 0.22)" : "var(--color-surface-container-lowest)"}
                    stroke={current ? "var(--color-primary)" : answered ? "#22c55e" : "var(--color-outline-variant)"}
                    strokeWidth={current ? 2.4 : 1.4}
                  />
                  <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--color-on-surface)">
                    {id}
                  </text>
                  {answered && (
                    <text x={p.x} y={p.y + 23} textAnchor="middle" fontSize="7.5" fontFamily="var(--font-mono)" fill="#16a34a">
                      d={s.done[id]}
                    </text>
                  )}
                </g>
              );
            })}
            <path
              d={`M${NODES[s.node].x - 4} ${NODES[s.node].y - 22}l4 5 4-5z`}
              fill="var(--color-primary)"
              className="transition-all duration-300"
            />
          </svg>
        </div>
        <div>
          <p className="font-code-sm text-[9.5px] text-on-surface-variant">call stack</p>
          <ul className="mt-1.5 flex flex-col-reverse gap-1">
            {s.stack.map((n, i) => (
              <li
                key={`${i}-${n}`}
                className={`rounded border px-1.5 py-1 font-code-sm text-[9.5px] ${
                  i === s.stack.length - 1 ? "border-primary/50 bg-primary-fixed/50 text-primary" : "border-outline-variant/60 text-on-surface-variant"
                }`}
              >
                maxDepth({n})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-3 mt-1 flex min-h-[34px] items-start justify-between gap-2 rounded-md bg-surface-container-low px-2 py-1.5">
        <p className="font-body-sm text-[10.5px] leading-snug text-on-surface-variant [&_b]:font-semibold [&_b]:text-on-surface">{s.note}</p>
        <span className="shrink-0 font-code-sm text-[9.5px] text-on-surface-variant">
          {at + 1} / {TRACE.length}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 border-y border-outline-variant/50 px-3 py-1 font-label-md text-[10px] text-on-surface-variant sm:gap-3">
        <span className="font-semibold text-on-surface">The code</span>
        {LANGS.map((lang, i) => (
          <span key={lang} className={`flex items-center gap-1 ${lang === "Python" ? "font-semibold text-on-surface" : ""}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[i] }} />
            {lang}
          </span>
        ))}
        <span className="ml-auto hidden items-center gap-1 sm:flex">
          <Copy size={10} /> line {s.line + 1}
        </span>
      </div>
      <pre className="m-0 flex-1 bg-[var(--editor-bg)] py-1.5 font-code-sm text-[10px] leading-[17px] text-[var(--editor-text)]">
        {CODE.map((text, i) => (
          <div
            key={i}
            className={`flex border-l-2 transition-colors duration-300 ${
              i === s.line ? "border-[var(--editor-active-edge)] bg-[var(--editor-active)]" : "border-transparent"
            }`}
          >
            <span className="w-6 shrink-0 select-none pr-2 text-right text-[var(--editor-gutter)]">{i + 1}</span>
            <code className="whitespace-pre">{text}</code>
          </div>
        ))}
      </pre>

      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded border border-outline-variant/60 text-on-surface-variant">
          <SkipBack size={11} />
        </span>
        <span className="flex h-6 items-center gap-1 rounded bg-primary-container px-3 font-label-md text-[10px] font-semibold text-on-primary">
          {playing ? <Pause size={10} /> : <Play size={10} />} {playing ? "Pause" : "Play"}
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded border border-outline-variant/60 text-on-surface-variant">
          <SkipForward size={11} />
        </span>
        <span className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-outline-variant/50">
          <span
            className="block h-full rounded-full bg-primary-container transition-[width] duration-300"
            style={{ width: `${((at + 1) / TRACE.length) * 100}%` }}
          />
        </span>
      </div>
    </div>
  );
}

/* ---------------- View 3: time and space ---------------- */

/** Renders **bold** and `code` in the short reasons. */
function rich(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) =>
    part.startsWith("**") ? (
      <b key={i} className="font-semibold text-on-surface">
        {part.slice(2, -2)}
      </b>
    ) : part.startsWith("`") ? (
      <code key={i} className="rounded bg-primary-fixed/60 px-1 font-code-sm text-[9.5px] text-primary">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

const APPROACHES = [
  {
    name: "Brute force: list every root-to-leaf path",
    time: "O(n · h)",
    timeWhy: "Every node copies a path of **up to h** values.",
    space: "O(n · h)",
    spaceWhy: "All the copied paths are **stored**.",
  },
  {
    name: "Optimal: count the levels with breadth-first search",
    time: "O(n)",
    timeWhy: "Each node is **queued and dequeued once**.",
    space: "O(w)",
    spaceWhy: "The queue holds a whole level: about **n / 2**.",
  },
  {
    name: "Best: ask both children, add one",
    time: "O(n)",
    timeWhy: "Each node is visited **once**: `1 + max(left, right)`.",
    space: "O(h)",
    spaceWhy: "The call stack holds **one path**: log n when balanced.",
  },
];

function ComplexityView() {
  return (
    <div className="flex h-full flex-col">
      <p className="text-[17px] font-bold tracking-tight text-on-surface">Comparing the three approaches</p>
      <ol className="mt-3 overflow-hidden rounded-xl border border-primary/25 bg-primary-fixed/20 shadow-[0_10px_30px_-20px_rgba(53,37,205,0.5)]">
        {APPROACHES.map((a, i) => (
          <li key={a.name} className={`px-3 py-2.5 ${i ? "border-t border-primary/15" : ""}`}>
            <p className="flex items-center gap-2 font-label-md text-[11.5px] font-semibold text-on-surface">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-container text-[9px] font-bold text-on-primary">
                {i + 1}
              </span>
              {a.name}
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              {[
                { icon: Clock, label: "Time", value: a.time, why: a.timeWhy },
                { icon: HardDrive, label: "Space", value: a.space, why: a.spaceWhy },
              ].map(({ icon: Icon, label, value, why }) => (
                <div key={label}>
                  <p className="flex items-center gap-1 font-code-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                    <Icon size={10} /> {label}
                    <span className="ml-1 rounded border border-primary/30 bg-primary-fixed/60 px-1 font-code-sm text-[10px] font-semibold normal-case tracking-normal text-primary">
                      {value}
                    </span>
                  </p>
                  <p className="mt-1 font-body-sm text-[10.5px] leading-snug text-on-surface-variant">{rich(why)}</p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-[13px] font-bold text-on-surface">Edge cases to test</p>
      <ul className="mt-1.5 flex flex-col gap-1 rounded-lg bg-surface-container-low px-3 py-2 font-body-sm text-[10.5px] text-on-surface-variant">
        <li>
          <b className="font-semibold text-on-surface">Empty tree</b>: 0.
        </li>
        <li>
          <b className="font-semibold text-on-surface">A chain</b>: the recursion goes as deep as the tree.
        </li>
        <li>
          <b className="font-semibold text-on-surface">Unbalanced sides</b>: the answer comes from the deeper side.
        </li>
      </ul>
    </div>
  );
}

/* ---------------- The pinned frame ---------------- */

const INDEX = [
  "Level Order Traversal (BFS)",
  "Maximum Depth of Binary Tree",
  "Invert Binary Tree",
  "Same Tree & Symmetric Tree",
  "Merge Two Binary Trees",
  "Average of Levels in Binary Tree",
  "Binary Tree Paths",
  "Sum of Left Leaves",
];

function view(i: number, playing: boolean) {
  return i === 0 ? <ContentView /> : i === 1 ? <DryRunView playing={playing} /> : <ComplexityView />;
}

/** A lesson page in a window frame; the window never changes size, only what's inside it. */
function LessonWindow({ active, playing }: { active: number; playing: boolean }) {
  return (
    <div
      aria-hidden
      className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-[0_30px_70px_-35px_rgba(53,37,205,0.45)]"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/50 px-4 py-2.5">
        <span className="font-label-md text-[13px] font-bold text-on-surface">
          Intuition <span className="text-primary-container">Rewire</span>
        </span>
        <span className="flex items-center gap-3 font-label-md text-[10.5px] text-on-surface-variant">
          <span>Roadmap</span>
          <span>Pricing</span>
          <Sun size={12} />
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-container text-[9px] font-bold text-on-primary">A</span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[150px] shrink-0 border-r border-outline-variant/50 bg-surface-container-low/60 px-2.5 py-3 xl:block">
          <p className="text-center font-label-md text-[13px] font-bold text-primary">Binary Tree</p>
          <p className="mt-2 font-label-md text-[9px] text-on-surface-variant">40% completed</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-outline-variant/50">
            <div className="h-full w-2/5 rounded-full bg-[#22c55e]" />
          </div>
          <p className="mt-3 font-label-md text-[9.5px] font-bold text-on-surface">Most asked interview questions</p>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {INDEX.map((title) => {
              const current = title.startsWith("Maximum");
              return (
                <li
                  key={title}
                  className={`flex items-start gap-1.5 rounded px-1.5 py-1 font-label-md text-[9.5px] leading-tight ${
                    current ? "bg-primary-fixed/70 font-semibold text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full border ${current ? "border-primary bg-primary/30" : "border-outline-variant"}`} />
                  {title}
                </li>
              );
            })}
          </ul>
        </aside>

        {/* All three views share one cell, so switching never moves anything. */}
        <div className="grid min-w-0 flex-1 p-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`col-start-1 row-start-1 min-h-0 transition-all duration-500 ease-out motion-reduce:transition-none ${
                active === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              {view(i, playing && active === i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- The section ---------------- */

/** Matches the `pin` variant in globals.css: wide and tall enough to pin the section at full size. */
const PIN_QUERY = "(min-width: 1024px) and (min-height: 760px)";

/**
 * How a lesson works, told while you scroll, always at the same size as the
 * rest of the page. The line down the left is a progress bar: it fills as you
 * scroll and lights each step's number as you reach it.
 *
 * - Large screens: the section pins under the header for three screens of
 *   scrolling; each third makes one step active and the lesson window beside
 *   the steps shows that part of a real lesson. The window never changes size.
 * - Wide but short screens (nothing would fit pinned): each step is a row,
 *   its card on the left and its own lesson window on the right.
 * - Phones: each step's card with its view underneath.
 */
export default function LearningFramework() {
  const [active, setActive] = useState(0);
  const runwayRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pinned = useMediaQuery(PIN_QUERY);
  const wide = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef);

  useEffect(() => {
    const update = () => {
      const runway = runwayRef.current;
      const rail = railRef.current;
      if (!runway || !rail) return;

      // Where each number's centre sits on the rail, in the rail's own pixels.
      const stops = markerRefs.current.map((m) => {
        const li = m?.parentElement;
        return m && li ? li.offsetTop + m.offsetTop + m.offsetHeight / 2 : 0;
      });
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (trackRef.current) trackRef.current.style.height = `${last}px`;

      // Written straight to the DOM: this runs on every scroll frame.
      const paint = (y: number) => {
        if (fillRef.current) fillRef.current.style.height = `${y}px`;
        if (headRef.current) headRef.current.style.transform = `translateY(${y}px)`;
      };

      if (window.matchMedia(PIN_QUERY).matches) {
        // Pinned: progress through the runway, 0 to 3. The whole part picks the
        // step; the fraction moves the fill from that number towards the next.
        const box = runway.getBoundingClientRect();
        const travel = box.height - window.innerHeight;
        const p = travel > 0 ? Math.min(Math.max(-box.top / travel, 0), 0.9999) * STEPS.length : 0;
        const step = Math.floor(p);
        const next = stops[step + 1] ?? last;
        paint(stops[step] + (next - stops[step]) * (p - step));
        setActive(step);
        return;
      }

      // Not pinned: the fill follows the middle of the screen down the rail,
      // and the active step is the last number it has passed.
      const middle = window.innerHeight * 0.55 - rail.getBoundingClientRect().top;
      const y = Math.min(Math.max(middle, first), last);
      paint(y);
      let step = 0;
      stops.forEach((stop, i) => {
        if (y >= stop - 1) step = i;
      });
      setActive(step);
    };

    update();
    // Web fonts can move the numbers once they arrive.
    document.fonts?.ready.then(update).catch(() => {});
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pinned, wide]);

  /** Pinned: clicking a step scrolls to the start of its part of the runway. */
  const goTo = (i: number) => {
    const runway = runwayRef.current;
    if (!runway || !pinned) return;
    const travel = runway.offsetHeight - window.innerHeight;
    const top = runway.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + travel * ((i + 0.1) / STEPS.length), behavior: reduced ? "auto" : "smooth" });
  };

  const animate = inView && !reduced;

  return (
    <section ref={sectionRef} id="how-it-works" className="w-full">
      <div ref={runwayRef} className="pin:h-[300vh]">
        <div className="max-w-7xl mx-auto w-full px-gutter-mobile py-space-2xl lg:px-gutter-desktop pin:sticky pin:top-[var(--spacing-header-height)] pin:flex pin:h-[calc(100vh-var(--spacing-header-height))] pin:items-center pin:py-0">
          <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-space-2xl pin:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] pin:items-center pin:gap-[64px]">
            <div ref={railRef} className="relative min-w-0 pl-[42px] lg:pl-[52px]">
              {/* The rail: a faint track, the filled part that grows as you scroll, and a glowing head on its tip. */}
              <span ref={trackRef} aria-hidden className="absolute left-[15px] top-0 w-[2px] -translate-x-1/2 rounded-full bg-outline-variant/60" />
              <span
                ref={fillRef}
                aria-hidden
                className="absolute left-[15px] top-0 w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/30 via-primary to-primary-container"
              />
              <span
                ref={headRef}
                aria-hidden
                className="absolute -top-[5px] left-[10px] z-0 h-[10px] w-[10px] rounded-full bg-primary-container shadow-[0_0_0_4px_rgb(99_91_255/0.18),0_0_14px_rgb(99_91_255/0.6)] will-change-transform"
              />

              <h2 className="font-headline-xl text-headline-xl-mobile tracking-tight text-on-surface lg:text-[38px] lg:leading-[46px]">
                A path that <span className="text-primary-container">builds on itself</span>
              </h2>
              <p className="mt-space-md max-w-xl font-body-lg text-body-lg text-on-surface-variant">
                Every lesson moves in the same order: see the idea, watch it run, then understand what it costs.
              </p>

              <ol className="mt-space-xl flex flex-col gap-space-2xl pin:gap-space-lg [@media(max-height:820px)]:pin:mt-space-lg [@media(max-height:820px)]:pin:gap-space-base">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const reached = i <= active;
                  const current = i === active;
                  return (
                    <li
                      key={step.title}
                      className="relative lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-[64px] pin:block"
                    >
                      <span
                        ref={(node) => {
                          markerRefs.current[i] = node;
                        }}
                        aria-hidden
                        className={`absolute -left-[42px] top-[22px] z-10 flex h-[31px] w-[31px] items-center justify-center rounded-full border-2 font-label-md text-[13px] font-bold transition-all duration-300 lg:-left-[52px] ${
                          reached ? "border-primary bg-primary-container text-on-primary" : "border-outline-variant bg-surface text-on-surface-variant"
                        } ${current ? "scale-110 shadow-[0_0_0_5px_rgb(99_91_255/0.15)]" : ""}`}
                      >
                        {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={current ? "step" : undefined}
                        className={`block w-full self-start rounded-2xl border bg-surface-container-lowest p-space-base text-left transition-all duration-300 sm:p-space-lg pin:cursor-pointer [@media(max-height:820px)]:pin:py-space-base ${
                          current
                            ? "border-primary/40 shadow-[0_14px_30px_-18px_rgba(53,37,205,0.45)]"
                            : "border-outline-variant/60 pin:hover:border-primary/30"
                        }`}
                      >
                        <span className="flex items-center gap-space-base">
                          <Icon />
                          <span className="font-headline-md text-[18px] font-bold tracking-tight text-on-surface sm:text-[20px]">{step.title}</span>
                        </span>
                        <span className="mt-space-sm block font-body-md text-[15px] leading-relaxed text-on-surface-variant">{step.body}</span>
                      </button>

                      {/* Not pinned: each step carries its own view. */}
                      {!pinned &&
                        (wide ? (
                          <LessonWindow active={i} playing={animate && current} />
                        ) : (
                          <div aria-hidden className="mt-space-md h-[470px] min-w-0 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3">
                            {view(i, animate && current)}
                          </div>
                        ))}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Pinned: one lesson window beside the steps; its size never changes, only what's inside. */}
            {pinned && <LessonWindow active={active} playing={animate} />}
          </div>
        </div>
      </div>
    </section>
  );
}
