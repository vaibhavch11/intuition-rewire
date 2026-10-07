"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { ARRAY_NS, DRAM_NS, L1_NS, LIST_NS, type MemoryTick } from "@/components/home/cacheLocality";
import { useMediaQuery, useSeenOnce } from "@/components/home/clientHooks";

// three.js is large and never runs on the server. With a mouse it is fetched as
// the card comes near the screen; on phones only when the visitor taps "Run",
// so scrolling past never stalls on a big download and a WebGL start-up.
const CacheLocalityScene = dynamic(() => import("@/components/home/CacheLocalityScene"), { ssr: false });

const formatNs = (ns: number) => `≈ ${Number.isInteger(ns) ? ns : ns.toFixed(1)} ns`;
const formatMisses = (n: number) => `${n} cache ${n === 1 ? "miss" : "misses"}`;
const barWidth = (ns: number) => `${(ns / LIST_NS) * 100}%`;

function Readout({
  swatch,
  title,
  barTone,
  timeRef,
  barRef,
  missesRef,
  ns,
  misses,
}: {
  swatch: string;
  title: string;
  barTone: string;
  timeRef: RefObject<HTMLSpanElement | null>;
  barRef: RefObject<HTMLSpanElement | null>;
  missesRef: RefObject<HTMLSpanElement | null>;
  ns: number;
  misses: number;
}) {
  return (
    <div className="px-space-lg py-space-md">
      <div className="flex items-center justify-between gap-space-sm">
        <span className="flex min-w-0 items-center gap-space-sm">
          <span className={`h-3 w-3 shrink-0 rounded-[4px] ${swatch}`} />
          <span className="truncate font-label-md text-label-md font-semibold text-on-surface">{title}</span>
        </span>
        <span ref={timeRef} className="shrink-0 font-code-sm text-code-sm font-semibold tabular-nums text-on-surface">
          {formatNs(ns)}
        </span>
      </div>
      <div className="mt-space-sm h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <span ref={barRef} className={`block h-full rounded-full ${barTone}`} style={{ width: barWidth(ns) }} />
      </div>
      <span ref={missesRef} className="mt-space-xs block font-body-sm text-body-sm text-on-surface-variant">
        {formatMisses(misses)}
      </span>
    </div>
  );
}

// Where the 12 scattered list nodes sit in the still picture (% from the left).
const SCATTERED = [0, 9, 17, 27, 34, 45, 53, 62, 70, 78, 87, 94.5];

/** A still version of the board, shown until the 3D scene is running. */
function Poster() {
  return (
    <div className="flex h-full items-center justify-center px-space-lg">
      <div className="flex w-full max-w-md flex-col gap-space-md">
        <div className="flex gap-[3px] rounded-md border-[1.5px] border-primary-container p-[3px]">
          {SCATTERED.map((_, i) => (
            <span key={i} className={`h-4 flex-1 rounded-[3px] ${i === 0 ? "bg-[#ff7a6e]" : "bg-secondary-fixed-dim"}`} />
          ))}
        </div>
        <div className="relative h-7">
          {SCATTERED.map((left, i) => (
            <span
              key={i}
              className={`absolute h-4 w-[5.5%] rounded-[3px] bg-[#ff7a6e] ${i % 2 ? "top-3" : "top-0"}`}
              style={{ left: `${left}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The 3D memory board plus the live latency readouts under it. */
export default function CacheLocalityCard() {
  const arrayTime = useRef<HTMLSpanElement>(null);
  const arrayBar = useRef<HTMLSpanElement>(null);
  const arrayMisses = useRef<HTMLSpanElement>(null);
  const listTime = useRef<HTMLSpanElement>(null);
  const listBar = useRef<HTMLSpanElement>(null);
  const listMisses = useRef<HTMLSpanElement>(null);

  // Written straight to the DOM: the scene ticks many times a second and
  // re-rendering React for each tick would be wasted work.
  const onTick = useCallback((tick: MemoryTick) => {
    if (arrayTime.current) arrayTime.current.textContent = formatNs(tick.arrayNs);
    if (arrayBar.current) arrayBar.current.style.width = barWidth(tick.arrayNs);
    if (arrayMisses.current) arrayMisses.current.textContent = formatMisses(tick.arrayMisses);
    if (listTime.current) listTime.current.textContent = formatNs(tick.listNs);
    if (listBar.current) listBar.current.style.width = barWidth(tick.listNs);
    if (listMisses.current) listMisses.current.textContent = formatMisses(tick.listMisses);
  }, []);

  const board = useRef<HTMLDivElement>(null);
  const near = useSeenOnce(board);
  const touch = useMediaQuery("(pointer: coarse)");
  const [tapped, setTapped] = useState(false);
  const run = touch ? tapped : near;

  return (
    <figure className="overflow-hidden rounded-3xl border border-outline-variant/70 bg-surface-container-lowest shadow-[0_1px_2px_rgba(19,27,46,0.04),0_28px_56px_-32px_rgba(19,27,46,0.35)]">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-space-xs border-b border-outline-variant/60 bg-surface-container-low/70 px-space-lg py-space-sm">
        <span className="font-label-md text-label-md font-semibold text-on-surface">
          Same 12 values, two memory layouts
        </span>
        <span aria-hidden className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-space-xs">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-secondary-fixed-dim" /> cache hit
          </span>
          <span className="inline-flex items-center gap-space-xs">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-[#ff7a6e]" /> cache miss
          </span>
          <span className="inline-flex items-center gap-space-xs">
            <span className="h-2.5 w-3.5 rounded-[3px] border-[1.5px] border-primary-container" /> 64-byte line
          </span>
        </span>
      </figcaption>

      <div
        ref={board}
        className="flex h-[200px] flex-col bg-gradient-to-b from-surface-container-low to-surface-container-lowest sm:h-[330px]"
      >
        <div
          role="img"
          aria-label={`An array of 12 values is read with one cache miss, about ${ARRAY_NS} ns; a linked list of 12 scattered nodes misses the cache on every node, about ${LIST_NS} ns.`}
          className="min-h-0 flex-1"
        >
          {run ? <CacheLocalityScene onTick={onTick} /> : <Poster />}
        </div>
        {!run && touch && (
          <div className="flex justify-center pb-space-md">
            <button
              type="button"
              onClick={() => setTapped(true)}
              className="inline-flex h-10 items-center gap-space-xs rounded-full bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary shadow-[0_8px_20px_-10px_rgba(79,70,229,0.8)] transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span aria-hidden>▶</span> Run the 3D demo
            </button>
          </div>
        )}
      </div>

      <div className="grid divide-y divide-outline-variant/60 border-t border-outline-variant/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <Readout
          swatch="bg-[#d4d0ff]"
          title="Array · 12 contiguous ints"
          barTone="bg-secondary-fixed-dim"
          timeRef={arrayTime}
          barRef={arrayBar}
          missesRef={arrayMisses}
          ns={ARRAY_NS}
          misses={1}
        />
        <Readout
          swatch="bg-[#ffd6a8]"
          title="Linked list · 12 scattered nodes"
          barTone="bg-[#ff7a6e]"
          timeRef={listTime}
          barRef={listBar}
          missesRef={listMisses}
          ns={LIST_NS}
          misses={12}
        />
      </div>
      <p className="border-t border-outline-variant/60 px-space-lg py-space-sm font-body-sm text-body-sm text-on-surface-variant">
        Typical latencies: L1 hit ~{L1_NS} ns, DRAM miss ~{DRAM_NS} ns. Animation is not to scale.
      </p>
    </figure>
  );
}
