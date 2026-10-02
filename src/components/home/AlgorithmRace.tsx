"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowRight, Flag, Pause, Play, RotateCcw, Shuffle, Trophy } from "lucide-react";
import RaceBars3D from "@/components/home/RaceBars3D";
import SectionHeader from "@/components/home/SectionHeader";

const SIZE = 24;
/** Milliseconds per comparison or swap — the race's clock. */
const TICK_MS = 22;

type Op =
  | { kind: "compare"; a: number; b: number }
  | { kind: "swap"; a: number; b: number };

// ---------------------------------------------------------------------------
// Each recorder really sorts a copy of the input and logs every comparison
// and swap it makes, so the race replays genuine algorithm behaviour.
// ---------------------------------------------------------------------------

function bubbleSort(input: number[]): Op[] {
  const a = [...input];
  const ops: Op[] = [];
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      ops.push({ kind: "compare", a: i, b: i + 1 });
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        ops.push({ kind: "swap", a: i, b: i + 1 });
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return ops;
}

function insertionSort(input: number[]): Op[] {
  const a = [...input];
  const ops: Op[] = [];
  for (let i = 1; i < a.length; i++) {
    for (let j = i - 1; j >= 0; j--) {
      ops.push({ kind: "compare", a: j, b: j + 1 });
      if (a[j] <= a[j + 1]) break;
      [a[j], a[j + 1]] = [a[j + 1], a[j]];
      ops.push({ kind: "swap", a: j, b: j + 1 });
    }
  }
  return ops;
}

function quickSort(input: number[]): Op[] {
  const a = [...input];
  const ops: Op[] = [];
  const swap = (i: number, j: number) => {
    [a[i], a[j]] = [a[j], a[i]];
    ops.push({ kind: "swap", a: i, b: j });
  };
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return;
    let boundary = lo;
    for (let j = lo; j < hi; j++) {
      ops.push({ kind: "compare", a: j, b: hi });
      if (a[j] < a[hi]) {
        if (boundary !== j) swap(boundary, j);
        boundary++;
      }
    }
    if (boundary !== hi) swap(boundary, hi);
    sort(lo, boundary - 1);
    sort(boundary + 1, hi);
  };
  sort(0, a.length - 1);
  return ops;
}

const RACERS = [
  {
    id: "bubble",
    name: "Bubble Sort",
    complexity: "O(n²)",
    record: bubbleSort,
  },
  {
    id: "insertion",
    name: "Insertion Sort",
    complexity: "O(n²)",
    record: insertionSort,
  },
  {
    id: "quick",
    name: "Quick Sort",
    complexity: "O(n log n)",
    record: quickSort,
  },
] as const;

type RacerId = (typeof RACERS)[number]["id"];

interface Lane {
  values: number[];
  ops: Op[];
  done: number;
  comparisons: number;
  swaps: number;
  last: Op | null;
  place: number | null;
}

/** Deterministic shuffle so the server and browser render the same first race. */
function seededNumbers(seed: number): number[] {
  let state = seed;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const values = Array.from({ length: SIZE }, (_, i) => i + 1);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function freshLanes(values: number[]): Record<RacerId, Lane> {
  return Object.fromEntries(
    RACERS.map((racer) => [
      racer.id,
      {
        values: [...values],
        ops: racer.record(values),
        done: 0,
        comparisons: 0,
        swaps: 0,
        last: null,
        place: null,
      },
    ])
  ) as Record<RacerId, Lane>;
}

interface RaceState {
  seed: number;
  lanes: Record<RacerId, Lane>;
}

type RaceAction = { type: "tick"; count: number } | { type: "reset"; seed: number };

function initialRace(seed: number): RaceState {
  return { seed, lanes: freshLanes(seededNumbers(seed)) };
}

/** Advances every unfinished lane by `count` operations. */
function raceReducer(state: RaceState, action: RaceAction): RaceState {
  if (action.type === "reset") return initialRace(action.seed);

  const lanes = Object.fromEntries(
    RACERS.map((racer) => {
      const lane = state.lanes[racer.id];
      return [racer.id, { ...lane, values: [...lane.values] }];
    })
  ) as Record<RacerId, Lane>;
  let finished = RACERS.filter((racer) => lanes[racer.id].place !== null).length;

  for (let t = 0; t < action.count && finished < RACERS.length; t++) {
    for (const racer of RACERS) {
      const lane = lanes[racer.id];
      if (lane.place !== null) continue;
      const op = lane.ops[lane.done];
      if (!op) {
        lane.place = ++finished;
        lane.last = null;
        continue;
      }
      if (op.kind === "compare") lane.comparisons++;
      else {
        lane.swaps++;
        [lane.values[op.a], lane.values[op.b]] = [lane.values[op.b], lane.values[op.a]];
      }
      lane.last = op;
      lane.done++;
    }
  }
  return { ...state, lanes };
}

const PLACE_LABEL = ["1st", "2nd", "3rd"];

export default function AlgorithmRace() {
  const [race, dispatch] = useReducer(raceReducer, 7, initialRace);
  const [running, setRunning] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const autoStarted = useRef(false);

  const { seed, lanes } = race;
  const all = RACERS.map((racer) => lanes[racer.id]);
  const raceOver = all.every((lane) => lane.place !== null);
  const untouched = all.every((lane) => lane.done === 0);
  const active = running && !raceOver;

  // The race loop: every TICK_MS each unfinished lane performs one operation.
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = performance.now();
    let carry = 0;

    const step = (now: number) => {
      // Capped so a tab switch mid-race resumes smoothly instead of jumping.
      carry += Math.min(now - last, 100);
      last = now;
      const ticks = Math.floor(carry / TICK_MS);
      carry -= ticks * TICK_MS;
      if (ticks > 0) dispatch({ type: "tick", count: ticks });
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  // Start once, automatically, the first time the race scrolls into view —
  // unless the visitor prefers reduced motion; then it waits for a click.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !autoStarted.current) {
          autoStarted.current = true;
          setRunning(true);
        }
      },
      // Fires once the section reaches mid-screen, however tall it is (on
      // phones the stacked lanes are taller than the viewport).
      { rootMargin: "0px 0px -45% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function restart(nextSeed: number) {
    autoStarted.current = true;
    dispatch({ type: "reset", seed: nextSeed });
    setRunning(true);
  }

  const winner = RACERS.find((racer) => lanes[racer.id].place === 1);
  const slowest = RACERS.find((racer) => lanes[racer.id].place === RACERS.length);
  const ratio =
    winner && slowest
      ? lanes[slowest.id].ops.length / lanes[winner.id].ops.length
      : 0;

  const totalOps = all.reduce((sum, lane) => sum + lane.done, 0);

  return (
    <section
      ref={sectionRef}
      id="algorithm-race"
      className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl w-full"
    >
      <SectionHeader
        eyebrow="Live algorithm race"
        icon={Flag}
        title={
          <>
            Watch <span className="text-primary-container">Big-O</span> win a race
          </>
        }
        lead={`Same ${SIZE} numbers, three sorting algorithms, one finish line. Every bar that moves is a real comparison or swap — this is what O(n²) versus O(n log n) actually looks like.`}
      />

      <div className="mt-space-xl overflow-hidden rounded-3xl border border-outline-variant/70 bg-surface-container-lowest shadow-[0_1px_2px_rgba(19,27,46,0.04),0_28px_56px_-32px_rgba(19,27,46,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-space-md border-b border-outline-variant/60 bg-surface-container-low/70 px-space-md py-space-sm sm:px-space-lg">
          <div className="flex items-center gap-space-sm">
            {raceOver ? (
              <button
                type="button"
                onClick={() => restart(seed)}
                className="inline-flex h-9 items-center gap-space-xs rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary active:scale-[0.98]"
              >
                <RotateCcw size={16} /> Race again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className="inline-flex h-9 items-center gap-space-xs rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary active:scale-[0.98]"
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? "Pause" : untouched ? "Start the race" : "Resume"}
              </button>
            )}
            <button
              type="button"
              onClick={() => restart(Math.floor(Math.random() * 1_000_000) + 1)}
              className="inline-flex h-9 items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-md font-label-md text-label-md font-semibold text-on-surface ring-1 ring-inset ring-outline-variant transition-colors hover:bg-surface-container"
            >
              <Shuffle size={16} /> New numbers
            </button>
          </div>

          <div
            aria-hidden
            className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs font-body-sm text-body-sm text-on-surface-variant"
          >
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-primary-container" /> comparing
            </span>
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-tertiary-fixed-dim" /> swapping
            </span>
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-secondary-fixed-dim" /> sorted
            </span>
            <span className="hidden h-4 w-px bg-outline-variant sm:block" />
            <span className="hidden font-code-sm text-code-sm tabular-nums sm:inline">
              {SIZE} numbers · {totalOps} ops
            </span>
          </div>
        </div>

        <div className="grid divide-y divide-outline-variant/60 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {RACERS.map((racer) => {
            const lane = lanes[racer.id];
            const fast = racer.complexity === "O(n log n)";
            const progress = lane.ops.length ? lane.done / lane.ops.length : 1;
            const first = lane.place === 1;
            return (
              <article
                key={racer.id}
                className={`relative p-space-md transition-colors duration-500 sm:p-space-lg ${
                  first ? "bg-secondary-container/[0.12]" : ""
                }`}
              >
                {first && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-secondary-fixed-dim" />}
                <header className="flex items-center justify-between gap-space-sm">
                  <div className="flex min-w-0 items-center gap-space-sm">
                    <h3 className="truncate text-[17px] font-semibold leading-6 tracking-tight text-on-surface">
                      {racer.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 font-label-tag text-label-tag ring-1 ring-inset ${
                        fast
                          ? "bg-secondary-container/50 text-on-secondary-container ring-secondary/20"
                          : "bg-tertiary-fixed/60 text-tertiary ring-tertiary/15"
                      }`}
                    >
                      {racer.complexity}
                    </span>
                  </div>
                  {lane.place !== null ? (
                    <span
                      className={`inline-flex shrink-0 items-center gap-space-2xs rounded-full px-space-sm py-0.5 font-label-md text-label-md font-semibold motion-safe:animate-pop-in ${
                        first ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {first && <Trophy size={14} />}
                      {PLACE_LABEL[lane.place - 1]}
                    </span>
                  ) : (
                    <span className="font-code-sm text-code-sm tabular-nums text-on-surface-variant">
                      {Math.round(progress * 100)}%
                    </span>
                  )}
                </header>

                <div
                  aria-hidden
                  className="mt-space-md h-40 overflow-hidden rounded-2xl bg-gradient-to-b from-surface-container-low to-surface-container-lowest ring-1 ring-inset ring-outline-variant/40 sm:h-44"
                >
                  <RaceBars3D
                    values={lane.values}
                    focus={lane.place === null ? lane.last : null}
                    finished={lane.place !== null}
                  />
                </div>

                <div className="mt-space-md h-1 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className={`h-full rounded-full ${lane.place !== null ? "bg-secondary" : "bg-primary-container"}`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <dl className="mt-space-md grid grid-cols-2 gap-space-sm">
                  {(
                    [
                      ["Comparisons", lane.comparisons],
                      ["Swaps", lane.swaps],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-surface-container-low px-space-md py-space-sm ring-1 ring-inset ring-outline-variant/40"
                    >
                      <dt className="font-body-sm text-body-sm text-on-surface-variant">{label}</dt>
                      <dd className="text-[20px] font-semibold leading-7 tabular-nums tracking-tight text-on-surface">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className="flex min-h-[64px] items-center justify-center border-t border-outline-variant/60 px-space-lg py-space-md text-center font-body-md text-body-md text-on-surface-variant"
        >
          {raceOver && winner && slowest ? (
            <span className="motion-safe:animate-fade-in">
              <Trophy size={16} className="mr-space-xs inline -translate-y-px text-secondary" />
              <strong className="text-on-surface">{winner.name}</strong> finished in{" "}
              {lanes[winner.id].ops.length} operations —{" "}
              <strong className="text-on-surface">{ratio.toFixed(1)}× fewer</strong> than{" "}
              {slowest.name}. At 1,000 numbers the gap becomes roughly 14,000 versus 500,000
              comparisons.
            </span>
          ) : (
            "Bars are values; taller means bigger. Watch which algorithm sorts them first."
          )}
        </p>

        {/* The offer, inside the race itself. */}
        <div className="flex flex-col items-center justify-between gap-space-md border-t border-outline-variant/60 bg-surface-container-low/70 px-space-lg py-space-md text-center sm:flex-row sm:text-left">
          <p className="font-body-md text-body-md text-on-surface-variant">
            <span className="font-semibold text-on-surface">Free:</span> all 16 courses come with
            interactive dry-runs like this one.
          </p>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-space-sm">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-lg bg-primary-container px-space-base font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary active:scale-[0.98]"
            >
              Create free account
            </Link>
            <Link
              href="/dsa/sorting"
              className="group inline-flex h-10 items-center gap-space-xs rounded-lg px-space-md font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-primary-fixed/60"
            >
              See how it works
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
