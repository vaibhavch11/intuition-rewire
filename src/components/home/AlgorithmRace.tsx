"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowRight, Flag, Pause, Play, RotateCcw, Shuffle, Trophy } from "lucide-react";

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

function Bars({ lane }: { lane: Lane }) {
  const finished = lane.place !== null;
  const touched =
    lane.last && !finished ? new Set([lane.last.a, lane.last.b]) : null;

  return (
    <div aria-hidden className="flex h-36 items-end gap-[2px] sm:h-40">
      {lane.values.map((value, i) => {
        let tone = "bg-primary-fixed-dim";
        if (finished) tone = "bg-secondary-fixed-dim";
        else if (touched?.has(i)) {
          tone = lane.last?.kind === "swap" ? "bg-tertiary-fixed-dim" : "bg-primary";
        }
        return (
          <div
            key={i}
            className={`flex-1 rounded-t-[3px] transition-colors duration-150 ${tone}`}
            style={{ height: `${(value / SIZE) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

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
      { threshold: 0.45 }
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

  return (
    <section
      ref={sectionRef}
      id="algorithm-race"
      className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl w-full"
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-space-xs rounded-full bg-tertiary-fixed/70 px-space-md py-1">
          <Flag size={15} className="text-tertiary" />
          <span className="font-label-tag text-label-tag uppercase text-tertiary">
            Live algorithm race
          </span>
        </div>
        <h2 className="font-headline-xl text-headline-xl-mobile mt-space-sm text-on-surface lg:text-headline-xl">
          Watch <span className="text-primary-container">Big-O</span> win a race
        </h2>
        <p className="font-body-lg text-body-lg mt-space-sm text-on-surface-variant">
          Same {SIZE} numbers, three sorting algorithms, one finish line. Every
          bar that moves is a real comparison or swap — this is what O(n²)
          versus O(n log n) actually looks like.
        </p>
      </div>

      <div className="mt-space-xl rounded-2xl bg-surface-container-lowest p-space-md shadow-md ring-1 ring-outline-variant/40 sm:p-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-sm">
            {raceOver ? (
              <button
                type="button"
                onClick={() => restart(seed)}
                className="inline-flex h-10 items-center gap-space-xs rounded-lg bg-primary px-space-base font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98]"
              >
                <RotateCcw size={17} /> Race again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className="inline-flex h-10 items-center gap-space-xs rounded-lg bg-primary px-space-base font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98]"
              >
                {running ? <Pause size={17} /> : <Play size={17} />}
                {running ? "Pause" : untouched ? "Start the race" : "Resume"}
              </button>
            )}
            <button
              type="button"
              onClick={() => restart(Math.floor(Math.random() * 1_000_000) + 1)}
              className="inline-flex h-10 items-center gap-space-xs rounded-lg bg-surface-container-high px-space-base font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-variant"
            >
              <Shuffle size={17} /> New numbers
            </button>
          </div>

          <div
            aria-hidden
            className="flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-on-surface-variant"
          >
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-3 w-3 rounded-sm bg-primary" /> comparing
            </span>
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-3 w-3 rounded-sm bg-tertiary-fixed-dim" /> swapping
            </span>
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-3 w-3 rounded-sm bg-secondary-fixed-dim" /> sorted
            </span>
          </div>
        </div>

        <div className="mt-space-lg grid gap-space-md lg:grid-cols-3">
          {RACERS.map((racer) => {
            const lane = lanes[racer.id];
            const fast = racer.complexity === "O(n log n)";
            const progress = lane.ops.length ? lane.done / lane.ops.length : 1;
            return (
              <article
                key={racer.id}
                className={`rounded-xl p-space-md ring-1 transition-shadow duration-300 ${
                  lane.place === 1
                    ? "bg-secondary-container/15 shadow-md ring-secondary/40"
                    : "bg-surface-container-low ring-outline-variant/40"
                }`}
              >
                <header className="mb-space-md flex items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      {racer.name}
                    </h3>
                    <span
                      className={`rounded px-space-xs py-0.5 font-label-tag text-label-tag ${
                        fast
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-tertiary-fixed text-tertiary"
                      }`}
                    >
                      {racer.complexity}
                    </span>
                  </div>
                  {lane.place !== null && (
                    <span
                      className={`inline-flex items-center gap-space-2xs rounded-full px-space-sm py-0.5 font-label-md text-label-md font-semibold motion-safe:animate-pop-in ${
                        lane.place === 1
                          ? "bg-secondary text-on-secondary"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {lane.place === 1 && <Trophy size={14} />}
                      {PLACE_LABEL[lane.place - 1]}
                    </span>
                  )}
                </header>

                <Bars lane={lane} />

                <div className="mt-space-md h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className={`h-full rounded-full ${
                      lane.place !== null ? "bg-secondary" : "bg-primary"
                    }`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <dl className="mt-space-sm flex justify-between font-code-sm text-code-sm text-on-surface-variant">
                  <div>
                    <dt className="inline">comparisons </dt>
                    <dd className="inline font-semibold text-on-surface">
                      {lane.comparisons}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">swaps </dt>
                    <dd className="inline font-semibold text-on-surface">
                      {lane.swaps}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className="mt-space-lg min-h-[48px] text-center font-body-md text-body-md text-on-surface-variant"
        >
          {raceOver && winner && slowest ? (
            <span className="motion-safe:animate-fade-in">
              <strong className="text-on-surface">{winner.name}</strong> finished
              in {lanes[winner.id].ops.length} operations —{" "}
              <strong className="text-on-surface">{ratio.toFixed(1)}× fewer</strong>{" "}
              than {slowest.name}. At 1,000 numbers the gap becomes roughly
              14,000 versus 500,000 comparisons.
            </span>
          ) : (
            "Bars are values; taller means bigger. Watch which algorithm sorts them first."
          )}
        </p>

        {/* The offer, inside the race itself. */}
        <div className="mt-space-md flex flex-col items-center justify-between gap-space-md rounded-xl bg-inverse-surface px-space-lg py-space-md text-center sm:flex-row sm:text-left">
          <p className="font-body-md text-body-md text-inverse-on-surface">
            <span className="font-semibold text-secondary-fixed">Free:</span>{" "}
            all 16 courses come with interactive dry-runs like this one.
          </p>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-space-sm">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-lg bg-secondary-fixed px-space-base font-label-md text-label-md font-semibold text-on-secondary-fixed transition-all hover:bg-secondary-fixed-dim active:scale-[0.98]"
            >
              Create free account
            </Link>
            <Link
              href="/dsa/sorting"
              className="group inline-flex h-10 items-center gap-space-xs rounded-lg px-space-md font-label-md text-label-md font-semibold text-inverse-on-surface ring-1 ring-inset ring-inverse-on-surface/30 transition-colors hover:bg-inverse-on-surface/10"
            >
              See how it works
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
