"use client";

import Link from "@/components/Link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Droplets,
  ExternalLink,
  MousePointerClick,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Trophy,
} from "lucide-react";
import CodeLines from "@/components/dsa/CodeLines";
import RichText from "@/components/dsa/RichText";
import SectionHeader from "@/components/home/SectionHeader";

const CODE = `function maxArea(height) {
  let left = 0, right = height.length - 1;
  let best = 0;
  while (left < right) {
    const water = Math.min(height[left], height[right]) * (right - left);
    best = Math.max(best, water);
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return best;
}`;

/** `phone` is a shorter version of the same shape: fewer, wider walls that are easy to tap. */
const PRESETS: { label: string; heights: number[]; phone: number[] }[] = [
  { label: "Classic", heights: [1, 8, 6, 2, 5, 4, 8, 3, 7], phone: [1, 8, 6, 2, 7, 3] },
  { label: "Twin peaks", heights: [2, 9, 1, 3, 2, 1, 9, 2], phone: [2, 9, 1, 3, 9, 2] },
  { label: "Valley", heights: [9, 3, 2, 1, 2, 4, 6, 8], phone: [9, 3, 1, 2, 6, 8] },
  { label: "Staircase", heights: [1, 2, 3, 4, 5, 6, 7, 8, 9], phone: [1, 2, 3, 4, 5, 6] },
];

/** Phone-width screens get the shorter arrays and no side panel. */
const PHONE_QUERY = "(max-width: 639px)";

function useIsPhone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(PHONE_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false
  );
}

const SPEEDS = [
  { label: "Slow", ms: 1400 },
  { label: "Normal", ms: 850 },
  { label: "Fast", ms: 420 },
];

const MAX_WALLS = 14;
const MAX_WALLS_PHONE = 8;
const MAX_HEIGHT = 20;

type Phase = "start" | "measure" | "move" | "done";

interface Frame {
  l: number;
  r: number;
  phase: Phase;
  line: number;
  water: number | null;
  best: number;
  bestPair: [number, number] | null;
  checked: number;
  moving: "l" | "r" | null;
  note: string;
}

/** Runs the two-pointer solution and records every move it makes. */
function trace(h: number[]): Frame[] {
  const frames: Frame[] = [];
  const total = (h.length * (h.length - 1)) / 2;
  let l = 0;
  let r = h.length - 1;
  let best = 0;
  let bestPair: [number, number] | null = null;
  let checked = 0;

  frames.push({
    l, r, phase: "start", line: 2, water: null, best, bestPair, checked, moving: null,
    note: "Start with the **widest** container: `L` on the first wall, `R` on the last. Width is as big as it will ever be.",
  });

  while (l < r) {
    const water = Math.min(h[l], h[r]) * (r - l);
    checked++;
    const improved = water > best || bestPair === null;
    if (improved) {
      best = water;
      bestPair = [l, r];
    }
    frames.push({
      l, r, phase: "measure", line: improved ? 6 : 5, water, best, bestPair, checked, moving: null,
      note: `Water = min(${h[l]}, ${h[r]}) × ${r - l} = **${water}**. ${improved ? "That's a **new best**." : `Best stays **${best}**.`}`,
    });

    const moveLeft = h[l] < h[r];
    frames.push({
      l, r, phase: "move", line: moveLeft ? 8 : 10, water, best, bestPair, checked, moving: moveLeft ? "l" : "r",
      note: moveLeft
        ? `The left wall (${h[l]}) is shorter, so it caps the water. Moving \`R\` would only shrink the width under the same cap — move \`L\` inward and look for a taller wall.`
        : h[l] === h[r]
          ? `Both walls are ${h[r]}. Neither side can do better while the other stays, so it's safe to move either one — this code moves \`R\`.`
          : `The right wall (${h[r]}) is shorter, so it caps the water. Move \`R\` inward and look for a taller wall.`,
    });
    if (moveLeft) l++;
    else r--;
  }

  const [a, b] = bestPair ?? [0, 0];
  frames.push({
    l, r, phase: "done", line: 13, water: null, best, bestPair, checked, moving: null,
    note: `\`L\` and \`R\` met. The most water is **${best}**, between walls ${a} and ${b} — found by checking **${checked}** containers instead of all **${total}** pairs.`,
  });
  return frames;
}

function parseHeights(text: string, maxWalls: number): { heights: number[] } | { error: string } {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 2) return { error: "Enter at least two wall heights." };
  if (parts.length > maxWalls) return { error: `Use at most ${maxWalls} walls so they stay readable.` };
  const heights = parts.map(Number);
  if (heights.some((n) => !Number.isInteger(n) || n < 0 || n > MAX_HEIGHT)) {
    return { error: `Heights must be whole numbers from 0 to ${MAX_HEIGHT}.` };
  }
  return { heights };
}

function randomHeights(phone: boolean): number[] {
  const n = phone ? 5 + Math.floor(Math.random() * 2) : 8 + Math.floor(Math.random() * 4);
  return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 10));
}

const area = (h: number[], a: number, b: number) => Math.min(h[a], h[b]) * Math.abs(b - a);

const iconButton =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant ring-1 ring-inset ring-outline-variant/70 transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-space-md py-space-sm ring-1 ring-inset ring-outline-variant/40">
      <dt className="font-body-sm text-body-sm text-on-surface-variant">{label}</dt>
      <dd className={`text-[22px] font-semibold leading-7 tabular-nums tracking-tight ${tone ?? "text-on-surface"}`}>
        {value}
      </dd>
      {hint && <p className="font-body-sm text-[12px] leading-4 text-on-surface-variant">{hint}</p>}
    </div>
  );
}

/** Remounts when the screen crosses phone width, so the walls always suit the screen. */
export default function WaterContainerSimulator() {
  const phone = useIsPhone();
  return <Simulator key={phone ? "phone" : "wide"} phone={phone} />;
}

function Simulator({ phone }: { phone: boolean }) {
  const presetHeights = (p: (typeof PRESETS)[number]) => (phone ? p.phone : p.heights);
  const maxWalls = phone ? MAX_WALLS_PHONE : MAX_WALLS;
  const [heights, setHeights] = useState<number[]>(() => presetHeights(PRESETS[0]));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [pick, setPick] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const frames = useMemo(() => trace(heights), [heights]);
  const last = frames.length - 1;
  const frame = frames[Math.min(step, last)];
  const n = heights.length;
  const maxH = Math.max(1, ...heights);
  const totalPairs = (n * (n - 1)) / 2;
  const done = frame.phase === "done";
  const presetIndex = PRESETS.findIndex((p) => presetHeights(p).join() === heights.join());

  // Auto-run once: the first time the challenge reaches the middle of the
  // screen, press Play for the reader (after a short beat, so they see the
  // walls first). Never for reduced motion, and never twice in a visit.
  const sectionRef = useRef<HTMLElement>(null);
  const autoRan = useRef(false);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || autoRan.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || autoRan.current) return;
        autoRan.current = true;
        observer.disconnect();
        timer = window.setTimeout(() => setPlaying(true), 700);
      },
      { rootMargin: "-30% 0px -30% 0px" }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  // Autoplay: one move per tick, stopping on the answer.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(last, step + 1);
      setStep(next);
      if (next >= last) setPlaying(false);
    }, SPEEDS[speed].ms);
    return () => window.clearTimeout(timer);
  }, [playing, step, last, speed]);

  function load(next: number[]) {
    setHeights(next);
    setStep(0);
    setPlaying(false);
    setPick([]);
    setError(null);
  }

  function go(index: number) {
    setPlaying(false);
    setStep(Math.max(0, Math.min(last, index)));
  }

  function togglePlay() {
    if (playing) setPlaying(false);
    else {
      if (done) setStep(0);
      setPlaying(true);
    }
  }

  function choose(i: number) {
    setPick((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length >= 2 ? [i] : [...p, i]));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(step + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(step - 1);
    }
  }

  // Geometry, as percentages of the chart width / height.
  const slot = 100 / n;
  const barW = Math.min(slot * 0.46, phone ? 9 : 6);
  const center = (i: number) => slot * (i + 0.5);
  const heightPct = (v: number) => (v / maxH) * 100;

  const [ga, gb] = pick.length === 2 ? [Math.min(...pick), Math.max(...pick)] : [-1, -1];
  const guess = pick.length === 2 ? area(heights, ga, gb) : null;
  const showWater = frame.phase === "measure" || frame.phase === "move";
  const shownPair: [number, number] | null = showWater ? [frame.l, frame.r] : done ? frame.bestPair : null;

  let verdict: { tone: string; text: string } | null = null;
  if (done && guess !== null) {
    verdict =
      guess >= frame.best
        ? { tone: "text-secondary", text: "Perfect pick — you found the best container." }
        : {
            tone: "text-on-surface",
            text: `Your pick holds ${guess}. The best holds ${frame.best} — you reached ${Math.round((guess / Math.max(1, frame.best)) * 100)}% of it.`,
          };
  }

  return (
    <section ref={sectionRef} id="water-challenge" className="max-w-7xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-2xl">
      <SectionHeader
        eyebrow="Interactive challenge"
        icon={Droplets}
        title={
          <>
            Container With <span className="text-primary-container">Most Water</span>
          </>
        }
        lead="Tap two walls to trap as much water as you can. Then press Play and watch two pointers find the best pair in a single pass — without checking every pair."
      />

      <div
        onKeyDown={onKeyDown}
        className="mt-space-xl overflow-hidden rounded-3xl border border-outline-variant/70 bg-surface-container-lowest shadow-[0_1px_2px_rgba(19,27,46,0.04),0_28px_56px_-32px_rgba(19,27,46,0.35)]"
      >
        {/* Inputs */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant/60 bg-surface-container-low/70 px-space-md py-space-sm sm:px-space-lg">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="mr-space-2xs font-label-md text-label-md text-on-surface-variant">Try:</span>
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => load(presetHeights(p))}
                className={`rounded-full px-space-md py-1 font-label-md text-label-md transition-colors ${
                  i === presetIndex
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:text-on-surface"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => load(randomHeights(phone))}
              className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-1 font-label-md text-label-md text-on-surface-variant ring-1 ring-inset ring-outline-variant transition-colors hover:text-on-surface"
            >
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing((e) => !e);
              setDraft(heights.join(", "));
              setError(null);
            }}
            aria-expanded={editing}
            className="inline-flex items-center gap-space-xs rounded-lg px-space-sm py-1 font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-primary-fixed/60"
          >
            <Pencil size={14} /> Edit heights
          </button>
        </div>

        {editing && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = parseHeights(draft, maxWalls);
              if ("error" in parsed) setError(parsed.error);
              else {
                load(parsed.heights);
                setEditing(false);
              }
            }}
            className="border-b border-outline-variant/60 px-space-md py-space-sm motion-safe:animate-fade-in sm:px-space-lg"
          >
            <label className="flex flex-wrap items-center gap-space-sm">
              <span className="font-label-md text-label-md text-on-surface-variant">height =</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                autoFocus
                className="h-10 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm font-code-md text-code-md text-on-surface outline-none focus:border-primary-container"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-space-xs rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary"
              >
                <Check size={16} /> Apply
              </button>
            </label>
            <p className={`mt-1 font-body-sm text-body-sm ${error ? "text-error" : "text-on-surface-variant"}`} role={error ? "alert" : undefined}>
              {error ?? `2 to ${maxWalls} whole numbers between 0 and ${MAX_HEIGHT}, separated by commas.`}
            </p>
          </form>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* The tank */}
          <div className="min-w-0 px-space-md pb-space-md pt-space-md sm:px-space-lg">
            {/* First-run hint, on its own row so it never covers a wall. */}
            <div className="flex h-8 items-center justify-center">
              {step === 0 && pick.length < 2 && !playing && (
                <p className="flex items-center gap-space-xs rounded-full bg-[#8b6cf6]/12 px-space-md py-1 text-center font-label-md text-label-md text-[#6f52e8] motion-safe:animate-fade-in dark:text-[#b9a8ff]">
                  <MousePointerClick size={15} className="shrink-0" />
                  {pick.length === 0 ? "Tap two walls to make your own container" : "Now tap a second wall"}
                </p>
              )}
            </div>
            <div className="relative h-56 sm:h-72">
              <div className="absolute inset-x-0 bottom-0 top-8">
                {/* Water held by the current pair (or the best pair at the end) */}
                {shownPair && (
                  <div
                    className={`absolute bottom-0 overflow-hidden rounded-t-[3px] transition-[left,width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      done ? "bg-gradient-to-b from-[#3fc1b5]/60 to-[#3fc1b5]/25" : "bg-gradient-to-b from-[#4d9ef5]/55 to-[#4d9ef5]/20"
                    }`}
                    style={{
                      left: `${center(shownPair[0])}%`,
                      width: `${center(shownPair[1]) - center(shownPair[0])}%`,
                      height: `${heightPct(Math.min(heights[shownPair[0]], heights[shownPair[1]]))}%`,
                    }}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 200 10"
                      preserveAspectRatio="none"
                      className="absolute left-0 top-0 h-2.5 w-[200%] motion-safe:animate-wave"
                    >
                      <path
                        d="M0 5 Q12.5 0 25 5 T50 5 T75 5 T100 5 T125 5 T150 5 T175 5 T200 5 V10 H0Z"
                        fill={done ? "#3fc1b5" : "#4d9ef5"}
                        fillOpacity="0.55"
                      />
                    </svg>
                  </div>
                )}

                {/* The visitor's own container */}
                {guess !== null && (
                  <div
                    className="pointer-events-none absolute bottom-0 rounded-t-[3px] border-2 border-dashed border-[#8b6cf6] bg-[#8b6cf6]/10 transition-[left,width,height] duration-300"
                    style={{
                      left: `${center(ga)}%`,
                      width: `${center(gb) - center(ga)}%`,
                      height: `${heightPct(Math.min(heights[ga], heights[gb]))}%`,
                    }}
                  >
                    <span className="absolute bottom-1.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#8b6cf6] px-1.5 py-0.5 font-code-sm text-[11px] font-semibold leading-4 text-white shadow-sm">
                      you: {guess}
                    </span>
                  </div>
                )}

                {/* Walls */}
                {heights.map((h, i) => {
                  const isL = !done && i === frame.l;
                  const isR = !done && i === frame.r;
                  const inBest = done && frame.bestPair !== null && (i === frame.bestPair[0] || i === frame.bestPair[1]);
                  const moving = frame.phase === "move" && ((frame.moving === "l" && isL) || (frame.moving === "r" && isR));
                  const picked = pick.includes(i);
                  const tone = inBest
                    ? "bg-[#3fc1b5]"
                    : isL
                      ? "bg-primary-container"
                      : isR
                        ? "bg-tertiary-fixed-dim"
                        : "bg-outline-variant hover:bg-outline";
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => choose(i)}
                      aria-pressed={picked}
                      aria-label={`Wall ${i}, height ${h}${picked ? ", picked" : ""}`}
                      className={`absolute bottom-0 rounded-t-md transition-[background-color,box-shadow,height] duration-300 ${tone} ${
                        picked ? "ring-2 ring-[#8b6cf6] ring-offset-2 ring-offset-surface-container-lowest" : ""
                      } ${moving ? "motion-safe:animate-pulse" : ""}`}
                      style={{
                        left: `${center(i) - barW / 2}%`,
                        width: `${barW}%`,
                        height: `max(${heightPct(h)}%, 3px)`,
                      }}
                    >
                      <span
                        className={`absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-code-sm text-code-sm font-semibold tabular-nums ${
                          isL || isR || inBest || picked ? "text-on-surface" : "text-on-surface-variant"
                        }`}
                      >
                        {h}
                      </span>
                    </button>
                  );
                })}

                {/* Live formula above the water */}
                {shownPair && (
                  <span
                    className={`pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg px-space-sm py-1 font-code-sm text-code-sm font-semibold text-white shadow-md transition-[left,bottom] duration-500 motion-reduce:transition-none ${
                      done ? "bg-[#1f9e93]" : "bg-[#2f7fd6]"
                    }`}
                    style={{
                      left: `${(center(shownPair[0]) + center(shownPair[1])) / 2}%`,
                      bottom: `calc(${heightPct(Math.min(heights[shownPair[0]], heights[shownPair[1]]))}% + 10px)`,
                    }}
                  >
                    {done ? "best " : ""}min({heights[shownPair[0]]}, {heights[shownPair[1]]}) × {shownPair[1] - shownPair[0]} ={" "}
                    {Math.min(heights[shownPair[0]], heights[shownPair[1]]) * (shownPair[1] - shownPair[0])}
                  </span>
                )}
              </div>

            </div>

            {/* Baseline, pointers and indices */}
            <div className="h-px bg-outline" />
            <div className="relative h-8">
              {!done &&
                (["l", "r"] as const).map((side) => {
                  const i = side === "l" ? frame.l : frame.r;
                  const moving = frame.phase === "move" && frame.moving === side;
                  return (
                    <span
                      key={side}
                      className={`absolute top-1.5 -translate-x-1/2 rounded-md px-1.5 py-0.5 font-code-sm text-[11px] font-bold leading-4 transition-[left] duration-500 motion-reduce:transition-none ${
                        side === "l" ? "bg-primary-container text-on-primary" : "bg-tertiary-fixed-dim text-[#3d2600]"
                      } ${frame.l === frame.r && side === "r" ? "translate-y-5" : ""}`}
                      style={{ left: `${center(i)}%` }}
                    >
                      {side === "l" ? "L" : "R"}
                      {moving ? (side === "l" ? " →" : " ←") : ""}
                    </span>
                  );
                })}
            </div>
            <div className="relative h-4">
              {heights.map((_, i) => (
                <span
                  key={i}
                  className="absolute -translate-x-1/2 font-code-sm text-[11px] leading-4 text-on-surface-variant/80"
                  style={{ left: `${center(i)}%` }}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* What is happening. Left out on phones, where the chart's own labels carry it. */}
          <div className="hidden flex-col gap-space-md border-t border-outline-variant/60 p-space-md sm:flex sm:p-space-lg lg:border-l lg:border-t-0">
            <div>
              <div className="flex items-center justify-between gap-space-sm">
                <span className={`font-label-md text-label-md font-semibold ${done ? "text-secondary" : "text-primary"}`}>
                  {done ? "Result" : frame.phase === "start" ? "Ready" : frame.phase === "measure" ? "Measure" : "Move a pointer"}
                </span>
                <span className="font-code-sm text-code-sm tabular-nums text-on-surface-variant">
                  {step + 1} / {frames.length}
                </span>
              </div>
              <p aria-live="polite" className="mt-space-xs min-h-[72px] font-body-md text-body-md text-on-surface">
                <span key={`${heights.join()}-${step}`} className="block motion-safe:animate-fade-in">
                  <RichText text={frame.note} />
                </span>
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-space-sm">
              <Stat label="Water now" value={frame.water !== null ? String(frame.water) : "—"} />
              <Stat label="Best so far" value={frame.bestPair ? String(frame.best) : "—"} tone={done ? "text-secondary" : undefined} />
              <Stat label="Containers checked" value={`${frame.checked}`} hint={`of ${totalPairs} possible pairs`} />
              <Stat
                label="Your pick"
                value={guess !== null ? String(guess) : "—"}
                hint={guess !== null ? `walls ${ga} and ${gb}` : "tap two walls"}
                tone={guess !== null ? "text-[#7c5cf0] dark:text-[#b9a8ff]" : undefined}
              />
            </dl>

            {verdict ? (
              <p className={`flex items-start gap-space-xs rounded-xl bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md font-semibold motion-safe:animate-pop-in ${verdict.tone}`}>
                <Trophy size={18} className="mt-0.5 shrink-0" />
                {verdict.text}
              </p>
            ) : (
              done && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Tip: tap two walls, then press Replay to see how close your intuition gets.
                </p>
              )
            )}
          </div>
        </div>

        {/* The code, following along. Starts closed on every screen, so the walls stay the focus; one tap opens it. */}
        <details className="group border-t border-outline-variant/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-space-sm px-space-md py-space-sm font-label-md text-label-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface sm:px-space-lg [&::-webkit-details-marker]:hidden">
            <span>
              The code <span className="font-normal">· two pointers, O(n) time, O(1) space</span>
            </span>
            <ChevronDown size={16} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="code-editor">
            <CodeLines code={CODE} language="javascript" activeLine={frame.line} size="sm" />
          </div>
        </details>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-space-sm border-t border-outline-variant/60 bg-surface-container-low/70 px-space-md py-space-sm sm:px-space-lg">
          <button type="button" onClick={() => go(0)} aria-label="Back to the start" className={iconButton}>
            <RotateCcw size={17} />
          </button>
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step" className={iconButton}>
            <SkipBack size={17} />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex h-10 min-w-[112px] items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
            {playing ? "Pause" : done ? "Replay" : step === 0 ? "Play" : "Resume"}
          </button>
          <button type="button" onClick={() => go(step + 1)} disabled={done} aria-label="Next step" className={iconButton}>
            <SkipForward size={17} />
          </button>

          <div role="group" aria-label="Speed" className="flex rounded-lg bg-surface-container p-0.5">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSpeed(i)}
                aria-pressed={speed === i}
                className={`rounded-md px-space-sm py-1 font-label-md text-[13px] transition-colors ${
                  speed === i ? "bg-surface-container-lowest font-semibold text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={0}
            max={last}
            value={step}
            aria-label="Jump to step"
            onChange={(e) => go(Number(e.target.value))}
            className="min-w-[120px] flex-1 accent-[var(--c-primary-container)]"
          />
        </div>

        {/* Where to go next */}
        <div className="flex flex-col items-start justify-between gap-space-sm border-t border-outline-variant/60 px-space-md py-space-md sm:flex-row sm:items-center sm:px-space-lg">
          <p className="font-body-md text-body-md text-on-surface-variant">
            <span className="font-semibold text-on-surface">Why does moving the shorter wall work?</span> The full
            lesson walks through the proof with drawings.
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-space-sm">
            <Link
              href="/dsa/arrays/tp-container-with-most-water"
              className="group inline-flex h-10 items-center gap-space-xs rounded-lg bg-primary-container px-space-base font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
            >
              Read the lesson
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://leetcode.com/problems/container-with-most-water/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-space-xs rounded-lg px-space-md font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-primary-fixed/60"
            >
              Problem on LeetCode
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
