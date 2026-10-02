"use client";

import { useCallback, useRef, type RefObject } from "react";
import CacheLocalityScene, {
  ARRAY_NS,
  DRAM_NS,
  L1_NS,
  LIST_NS,
  type MemoryTick,
} from "@/components/home/CacheLocalityScene";

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
        role="img"
        aria-label={`An array of 12 values is read with one cache miss, about ${ARRAY_NS} ns; a linked list of 12 scattered nodes misses the cache on every node, about ${LIST_NS} ns.`}
        className="h-[200px] bg-gradient-to-b from-surface-container-low to-surface-container-lowest sm:h-[330px]"
      >
        <CacheLocalityScene onTick={onTick} />
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
