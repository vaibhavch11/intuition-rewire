"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
} from "lucide-react";
import CodeLines from "@/components/dsa/CodeLines";
import { DOTS, LANGUAGE_KEY, languageLabel } from "@/components/dsa/CodeTabs";
import { useStoredString, writeStored } from "@/lib/browserStore";
import { trustedLineMap } from "@/lib/dsa/lineMap";
import RichText from "@/components/dsa/RichText";
import { CELL_TONES, PointerTags } from "@/components/dsa/simulator/visuals";
import { isPracticeProgram, PRACTICE_PROGRAMS } from "@/lib/dsa/practicePrograms";
import { PROGRAM_LOADERS } from "./loaders";
import { formatField, parseField } from "./parseInput";
import { GraphDiagram, ListDiagram, StackColumn, stageReserve, TreeDiagram, type StageReserve } from "./StructureViews";
import {
  cell,
  formatValue,
  type ArrayView,
  type CellTone,
  type Frame,
  type GridView,
  type Input,
  type MapView,
  type Program,
} from "./types";

const NO_SOLUTIONS: { language: string; code: string }[] = [];

/** Autoplay's time per step. Normal is long enough to read the note and watch the picture settle. */
const SPEEDS = [
  { label: "Slow", ms: 3200 },
  { label: "Normal", ms: 2000 },
  { label: "Fast", ms: 1000 },
];

const BAR_TONES: Record<CellTone, string> = {
  idle: "bg-outline-variant",
  primary: "bg-primary",
  tertiary: "bg-tertiary",
  success: "bg-secondary",
  done: "bg-outline-variant/70",
  write: "bg-primary-container",
  muted: "bg-surface-container-high",
  empty: "bg-transparent",
};

const cellBox =
  "flex h-9 min-w-9 items-center justify-center rounded-lg px-1.5 font-code-md text-code-md font-semibold transition-all duration-300 motion-reduce:transition-none sm:h-11 sm:min-w-11 sm:px-2";

function Cell({ value, tone }: { value: unknown; tone?: CellTone }) {
  const empty = value === null;
  return (
    <div data-tone={tone} className={`${cellBox} motion-safe:animate-fade-in ${CELL_TONES[empty ? "empty" : tone ?? "idle"]}`}>
      {/* Keyed by value, so a changed value fades in rather than snapping. */}
      <span key={String(value)} className="motion-safe:animate-fade-in">
        {empty ? "" : formatValue(value)}
      </span>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-9 items-center rounded-lg border border-dashed border-outline-variant px-space-md font-body-sm text-body-sm text-on-surface-variant/70 sm:h-11">
      empty
    </div>
  );
}

function ArrayRow({ view }: { view: ArrayView }) {
  const numbers = view.values.filter((v): v is number => typeof v === "number");
  const low = Math.min(0, ...numbers);
  const high = Math.max(...numbers, 1);

  return (
    <div>
      <p className="mb-1 font-code-sm text-code-sm font-semibold text-on-surface-variant">{view.name}</p>
      <div className="flex w-max items-end gap-1.5">
        {view.values.length === 0 && (
          // The same height as a filled row (pointer tags above, index below).
          <div className="flex flex-col">
            <span className="h-6" />
            <Empty />
            <span className="mt-1 h-4" />
          </div>
        )}
        {view.values.map((value, i) => {
          const tone = view.tones?.[i];
          return (
            <div key={i} className="flex flex-col items-center">
              {view.chart && (
                <div className="flex h-16 w-full items-end justify-center">
                  <div
                    className={`w-3/5 rounded-t transition-all duration-300 motion-reduce:transition-none ${BAR_TONES[tone ?? "idle"]}`}
                    style={{
                      height: `${6 + ((((value as number) ?? 0) - low) / (high - low || 1)) * 58}px`,
                    }}
                  />
                </div>
              )}
              <PointerTags pointers={view.pointers?.[i]} />
              <Cell value={value} tone={tone} />
              <span className="mt-1 font-code-sm text-[11px] leading-4 text-on-surface-variant">{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GridBox({ view }: { view: GridView }) {
  const cols = Math.max(0, ...view.values.map((row) => row.length));
  return (
    <div>
      <p className="mb-1 font-code-sm text-code-sm font-semibold text-on-surface-variant">{view.name}</p>
      {view.values.length === 0 ? (
        <Empty />
      ) : (
        <div
          className="inline-grid items-center gap-1.5"
          style={{ gridTemplateColumns: `auto repeat(${cols}, auto)` }}
        >
          <span />
          {Array.from({ length: cols }, (_, c) => (
            <span key={c} className="text-center font-code-sm text-[11px] leading-4 text-on-surface-variant">
              {view.columnLabels ? (view.columnLabels[c] ?? "") : c}
            </span>
          ))}
          {view.values.map((row, r) => (
            <Fragment key={r}>
              <span className="pr-1 text-right font-code-sm text-[11px] leading-4 text-on-surface-variant">
                {view.rowLabels?.[r] ?? r}
              </span>
              {Array.from({ length: cols }, (_, c) =>
                c < row.length ? (
                  <Cell key={c} value={row[c]} tone={view.tones?.[cell(r, c)]} />
                ) : (
                  <span key={c} />
                )
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

/** A hash map: one column per entry, key above value, in insertion order. */
function MapTable({ view }: { view: MapView }) {
  const heading = "pr-1 text-right font-code-sm text-[11px] leading-4 text-on-surface-variant";
  return (
    <div>
      <p className="mb-1 font-code-sm text-code-sm font-semibold text-on-surface-variant">{view.name}</p>
      {view.entries.length === 0 ? (
        <Empty />
      ) : (
        <div
          className="inline-grid items-center gap-x-1.5 gap-y-1"
          style={{ gridTemplateColumns: `auto repeat(${view.entries.length}, auto)` }}
        >
          <span />
          {view.entries.map((_, i) => (
            <div key={`tag${i}`} className="flex justify-center">
              <PointerTags pointers={view.pointers?.[i]} />
            </div>
          ))}
          <span className={heading}>{view.keyLabel ?? "key"}</span>
          {view.entries.map(([key], i) => (
            <Cell key={`key${i}`} value={key} tone={view.tones?.[i]} />
          ))}
          <span className={heading}>{view.valueLabel ?? "value"}</span>
          {view.entries.map(([, value], i) => (
            <Cell key={`value${i}`} value={value} tone={view.tones?.[i]} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One step's drawing as separate blocks, keyed by kind and position so a block keeps its slot from step to step. */
function stageBlocks(frame: Frame, reserve: StageReserve): Map<string, ReactNode> {
  const blocks = new Map<string, ReactNode>();
  frame.trees.forEach((v, i) => blocks.set(`tree:${i}`, <TreeDiagram view={v} reserve={reserve.trees.get(v.name)} />));
  frame.graphs.forEach((v, i) => blocks.set(`graph:${i}`, <GraphDiagram view={v} reserve={reserve.graphs.get(v.name)} />));
  frame.stacks.forEach((v, i) => blocks.set(`stack:${i}`, <StackColumn view={v} reserve={reserve.stacks.get(v.name)} />));
  frame.lists.forEach((v, i) => blocks.set(`list:${i}`, <ListDiagram view={v} />));
  frame.grids.forEach((v, i) => blocks.set(`grid:${i}`, <GridBox view={v} />));
  frame.arrays.forEach((v, i) => blocks.set(`array:${i}`, <ArrayRow view={v} />));
  frame.maps.forEach((v, i) => blocks.set(`map:${i}`, <MapTable view={v} />));
  return blocks;
}

/** A stack sits beside a tree or graph (a traversal's work list); otherwise it comes last. */
function slotRank(key: string, hasDiagram: boolean): number {
  const kind = key.split(":")[0];
  if (kind === "stack") return hasDiagram ? 2 : 7;
  return { tree: 0, graph: 1, list: 3, grid: 4, array: 5, map: 6 }[kind] ?? 8;
}

/** A run longer than this is measured on evenly spaced steps. */
const MEASURE_LIMIT = 300;

function framesToMeasure(frames: Frame[]): Frame[] {
  if (frames.length <= MEASURE_LIMIT) return frames;
  return Array.from({ length: MEASURE_LIMIT }, (_, i) => frames[Math.round((i * (frames.length - 1)) / (MEASURE_LIMIT - 1))]);
}

interface Slot {
  key: string;
  width: number;
  height: number;
}

const STAGE_PAD = 16;
const GAP_X = 32;
const GAP_Y = 20;
/** Smaller than this and labels stop being readable, so the box scrolls instead. */
const MIN_ZOOM = 0.65;
/** Enough height for the note beside a short picture. */
const MIN_STAGE = 176;

interface Packed {
  width: number;
  height: number;
  at: Map<string, { x: number; y: number }>;
}

/** Fills columns left to right, each up to `limit` tall. Null if that runs past `width`. */
function fillColumns(slots: Slot[], width: number, limit: number): Packed | null {
  const at = new Map<string, { x: number; y: number }>();
  let x = 0;
  let y = 0;
  let columnWidth = 0;
  let height = 0;
  for (const slot of slots) {
    if (y > 0 && y + slot.height > limit) {
      x += columnWidth + GAP_X;
      y = 0;
      columnWidth = 0;
    }
    if (x + slot.width > width) return null;
    at.set(slot.key, { x, y });
    columnWidth = Math.max(columnWidth, slot.width);
    height = Math.max(height, y + slot.height);
    y += slot.height + GAP_Y;
  }
  return { width: x + columnWidth, height, at };
}

/** Fills rows top to bottom, wrapping at `width`. */
function fillRows(slots: Slot[], width: number): Packed {
  const at = new Map<string, { x: number; y: number }>();
  let x = 0;
  let y = 0;
  let row = 0;
  let widest = 0;
  for (const slot of slots) {
    if (x > 0 && x + slot.width > width) {
      y += row + GAP_Y;
      x = 0;
      row = 0;
    }
    at.set(slot.key, { x, y });
    widest = Math.max(widest, x + slot.width);
    row = Math.max(row, slot.height);
    x += slot.width + GAP_X;
  }
  return { width: widest, height: y + row, at };
}

/**
 * Places the slots in as little height as `width` allows, using whichever is
 * shorter: rows of blocks, or columns where small blocks stack beside a taller
 * one. A block wider than `width` scrolls inside the box.
 */
function packSlots(slots: Slot[], width: number): Packed {
  const rows = fillRows(slots, width);
  const columns = fillBestColumns(slots, width);
  return !columns || (rows.width <= width && rows.height <= columns.height) ? rows : columns;
}

/** Columns as short as `width` allows, or null if no column height fits. */
function fillBestColumns(slots: Slot[], width: number): Packed | null {
  // The column heights worth trying: every run of consecutive blocks stacked.
  const limits = new Set<number>();
  slots.forEach((_, from) => {
    let total = -GAP_Y;
    for (let to = from; to < slots.length; to++) {
      total += slots[to].height + GAP_Y;
      limits.add(total);
    }
  });
  const tallest = Math.max(...slots.map((slot) => slot.height));
  for (const limit of [...limits].filter((l) => l >= tallest).sort((a, b) => a - b)) {
    const packed = fillColumns(slots, width, limit);
    if (packed) return packed;
  }
  return null;
}

/** The largest zoom at which the slots fit `width` by `height`. */
function bestZoom(slots: Slot[], width: number, height: number): number {
  for (let zoom = 1; zoom > MIN_ZOOM; zoom -= 0.05) {
    const size = packSlots(slots, width / zoom);
    if (size.width * zoom <= width && size.height * zoom <= height) return zoom;
  }
  return MIN_ZOOM;
}

/**
 * The dry-run picture. Every step of the run is measured once, off screen, and
 * each block gets a slot the size of its largest step. The slots are placed
 * to use the free width, and because they never change size neither does the
 * picture: stepping through can't resize it or move anything around it.
 * The whole picture scales down to fit its box when it has to, and scrolls
 * inside the box only below the smallest readable size.
 */
function DryRunPicture({ frames, frame, onHeight }: { frames: Frame[]; frame: Frame; onHeight: (height: number) => void }) {
  const reserve = useMemo(() => stageReserve(frames), [frames]);
  const box = useRef<HTMLDivElement>(null);
  const probes = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState<{ frames: Frame[]; slots: Slot[] } | null>(null);
  const [fit, setFit] = useState<{ zoom: number; packed: Packed } | null>(null);
  const measured = run?.frames === frames;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || measured) return;
    const measure = () => {
      const sizes = new Map<string, { width: number; height: number }>();
      probes.current?.querySelectorAll<HTMLElement>("[data-slot]").forEach((node) => {
        const key = node.dataset.slot as string;
        const seen = sizes.get(key);
        // Rounded up: a slot a fraction too narrow would wrap its label onto a second line.
        const { width, height } = node.getBoundingClientRect();
        sizes.set(key, { width: Math.max(Math.ceil(width), seen?.width ?? 0), height: Math.max(Math.ceil(height), seen?.height ?? 0) });
      });
      // Zero means the simulator is off screen and not laid out yet: try again when it is.
      if (![...sizes.values()].some((size) => size.width > 0)) return;
      const hasDiagram = [...sizes.keys()].some((key) => key.startsWith("tree:") || key.startsWith("graph:"));
      const slots = [...sizes].map(([key, size]) => ({ key, ...size }));
      slots.sort((a, b) => slotRank(a.key, hasDiagram) - slotRank(b.key, hasDiagram) || Number(a.key.split(":")[1]) - Number(b.key.split(":")[1]));
      setRun({ frames, slots });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [frames, measured]);

  // Fit the slots to the box, now and whenever the box changes size.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !run) return;
    const fit = () => {
      const width = el.clientWidth - STAGE_PAD * 2;
      const height = el.clientHeight - STAGE_PAD * 2;
      if (width <= 0) return;
      // The height the picture would like: as large as its width allows.
      const widthZoom = bestZoom(run.slots, width, Infinity);
      onHeight(Math.max(MIN_STAGE, Math.ceil(packSlots(run.slots, width / widthZoom).height * widthZoom) + STAGE_PAD * 2));
      const zoom = bestZoom(run.slots, width, height);
      setFit({ zoom, packed: packSlots(run.slots, width / zoom) });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [run, onHeight]);

  // When the picture has to scroll, keep the current step in view (never scrolls the page).
  useEffect(() => {
    const el = box.current;
    if (!el || (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)) return;
    const target = el.querySelector('[data-tone="write"]') ?? el.querySelector('[data-tone="primary"]');
    if (!target) return;
    const outer = el.getBoundingClientRect();
    const inner = target.getBoundingClientRect();
    const across = inner.left < outer.left + STAGE_PAD || inner.right > outer.right - STAGE_PAD;
    const down = inner.top < outer.top + STAGE_PAD || inner.bottom > outer.bottom - STAGE_PAD;
    if (!across && !down) return;
    el.scrollBy({
      left: across ? inner.left - outer.left - outer.width / 2 + inner.width / 2 : 0,
      top: down ? inner.top - outer.top - outer.height / 2 + inner.height / 2 : 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [frame, fit]);

  // Cells are a little larger from the sm breakpoint up, so crossing it re-measures.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const remeasure = () => setRun(null);
    query.addEventListener("change", remeasure);
    return () => query.removeEventListener("change", remeasure);
  }, []);

  const blocks = stageBlocks(frame, reserve);

  return (
    // The note beside it narrates this picture for screen readers.
    <div ref={box} aria-hidden className="dry-run-smooth relative min-h-0 min-w-0 flex-1 overflow-auto" style={{ padding: STAGE_PAD }}>
      {measured && fit && (
        <div className="relative" style={{ zoom: fit.zoom, width: fit.packed.width, height: fit.packed.height }}>
          {run.slots.map((slot) => {
            const at = fit.packed.at.get(slot.key);
            return (
              <div key={slot.key} className="absolute" style={{ left: at?.x, top: at?.y, width: slot.width, height: slot.height }}>
                {blocks.get(slot.key)}
              </div>
            );
          })}
        </div>
      )}
      {!measured && (
        <div ref={probes} className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
          {framesToMeasure(frames).flatMap((f, i) =>
            [...stageBlocks(f, reserve)].map(([key, node]) => (
              <div key={`${i}-${key}`} data-slot={key} className="w-max">
                {node}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** One step's variables. */
function VarChips({ vars }: { vars: Frame["vars"] }) {
  return (
    <div className="flex flex-wrap content-start gap-space-xs [grid-area:1/1]">
      {vars.map(([name, value]) => (
        <span key={name} className="rounded-md bg-surface-container px-space-sm py-0.5 font-code-sm text-code-sm">
          <span className="text-on-surface-variant">{name} = </span>
          <span className="font-semibold text-on-surface">{value}</span>
        </span>
      ))}
    </div>
  );
}

const controlButton =
  "inline-flex h-10 items-center justify-center rounded-lg bg-surface-container-high px-space-md text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40";

/**
 * A step-through dry run of one algorithm on input the reader can change.
 * The program behind it records a frame per meaningful step; this only
 * shows those frames and moves between them.
 */
export default function PracticeSimulator({
  program: id,
  caption,
  solutions = NO_SOLUTIONS,
}: {
  program: string;
  caption?: string;
  /** The lesson's solution in other languages, shown as tabs beside the JavaScript the simulator runs. */
  solutions?: { language: string; code: string }[];
}) {
  const [program, setProgram] = useState<Program | null>(null);
  const [failed, setFailed] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [frames, setFrames] = useState<Frame[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [example, setExample] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  const [codeOpen, setCodeOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const storedLanguage = useStoredString(LANGUAGE_KEY);

  useEffect(() => {
    if (!isPracticeProgram(id)) return;
    let live = true;
    PROGRAM_LOADERS[id]()
      .then(({ default: loaded }) => {
        if (!live) return;
        const first = loaded.examples[0].input;
        setProgram(loaded);
        setTexts(Object.fromEntries(loaded.fields.map((f) => [f.key, formatField(f, first[f.key])])));
        setFrames(loaded.run(first));
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [id]);

  const last = frames.length - 1;
  const allNotes = useMemo(() => [...new Set(frames.map((f) => f.note))], [frames]);
  const allVars = useMemo(
    () => [...new Map(frames.map((f) => [JSON.stringify(f.vars), f.vars])).values()],
    [frames]
  );

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const next = Math.min(step + 1, last);
      setStep(next);
      if (next >= last) setPlaying(false);
    }, SPEEDS[speed].ms);
    return () => clearTimeout(timer);
  }, [playing, step, last, speed]);

  // The JavaScript the simulator runs, then the same solution in each other
  // language, each with its lines matched to the JavaScript's.
  const versions = useMemo(() => {
    if (!program) return [];
    const others = solutions.filter((s) => s.language.toLowerCase() !== "javascript" && s.language !== "text");
    return [
      { language: "javascript", code: program.code, lines: null as number[] | null, exact: true },
      ...others.map((s) => {
        const lines = trustedLineMap(program.code, s.code);
        return { language: s.language, code: s.code, lines, exact: lines !== null };
      }),
    ];
  }, [program, solutions]);
  const version = versions.find((v) => v.language === storedLanguage) ?? versions[0];

  // Keep the executing line in view inside the code panel (never scrolls the page).
  const codeBox = useRef<HTMLDivElement>(null);
  const jsLine = frames[step]?.line;
  const activeLine =
    !version || !jsLine ? undefined : version.language === "javascript" ? jsLine : version.lines?.[jsLine] || undefined;
  const versionLanguage = version?.language;
  useEffect(() => {
    const box = codeBox.current;
    const row = box?.querySelector<HTMLElement>('[data-active="true"]');
    if (!box || !row) return;
    const outer = box.getBoundingClientRect();
    const inner = row.getBoundingClientRect();
    if (inner.top >= outer.top + 8 && inner.bottom <= outer.bottom - 8) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollTo({
      top: box.scrollTop + (inner.top - outer.top) - outer.height / 2 + inner.height / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [activeLine, versionLanguage, codeOpen]);

  if (!isPracticeProgram(id)) return null;
  const title = program?.title ?? PRACTICE_PROGRAMS.find((p) => p.id === id)?.title ?? "";

  function run(nextTexts: Record<string, string>, exampleIndex: number) {
    if (!program) return;
    const input: Input = {};
    for (const field of program.fields) {
      const parsed = parseField(field, nextTexts[field.key] ?? "");
      if ("error" in parsed) {
        setError(parsed.error);
        return;
      }
      input[field.key] = parsed.value;
    }
    const problem = program.check?.(input);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFrames(program.run(input));
    setStep(0);
    setPlaying(false);
    setExample(exampleIndex);
  }

  async function copyCode() {
    if (!version) return;
    try {
      await navigator.clipboard.writeText(version.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked; the code is still selectable by hand.
    }
  }

  function loadExample(index: number) {
    if (!program) return;
    const input = program.examples[index].input;
    const next = Object.fromEntries(program.fields.map((f) => [f.key, formatField(f, input[f.key])]));
    setTexts(next);
    run(next, index);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPlaying(false);
      setStep((s) => Math.min(s + 1, last));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPlaying(false);
      setStep((s) => Math.max(s - 1, 0));
    }
  }

  const frame = frames[step];

  return (
    <section
      aria-label={`Dry-run simulator: ${title}`}
      onKeyDown={onKeyDown}
      className="@container my-space-2xl overflow-clip rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm"
    >
      {/* On a wide card everything fits one screen: the picture gives way first. */}
      <div className="flex flex-col @3xl:max-h-[calc(100dvh-var(--spacing-header-height)-1.5rem)]">
      <header className="shrink-0 border-b border-outline-variant/40 bg-surface-container-low px-space-md py-space-sm sm:px-space-lg">
        <div className="flex flex-wrap items-center gap-x-space-sm gap-y-space-2xs">
          <span className="inline-flex items-center gap-space-xs rounded-full bg-secondary-container/40 px-space-sm py-0.5 font-label-tag text-label-tag uppercase text-on-secondary-container">
            <SlidersHorizontal size={13} />
            Dry-run simulator
          </span>
          <h3 className="font-headline-md text-[18px] leading-6 text-on-surface">{title}</h3>
        </div>
        <p className="font-body-sm text-body-sm mt-space-2xs truncate text-on-surface-variant">
          {caption ?? "Change the input, press Run, then step through the code one move at a time."}
        </p>
      </header>

      {failed && (
        <p className="font-body-md text-body-md p-space-lg text-on-surface-variant">
          The simulator couldn&apos;t load. Refresh the page to try again.
        </p>
      )}

      {!program && !failed && (
        <div className="animate-pulse space-y-space-md p-space-lg" aria-label="Loading simulator">
          <div className="h-10 rounded-lg bg-surface-container" />
          <div className="h-28 rounded-lg bg-surface-container" />
        </div>
      )}

      {program && frame && (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(texts, -1);
            }}
            className="shrink-0 border-b border-outline-variant/40 px-space-md py-space-sm sm:px-space-lg"
          >
            <div className="flex flex-wrap items-end gap-space-md">
              {program.fields.map((field) => (
                <label key={field.key} className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">{field.label}</span>
                  {field.kind === "grid" ? (
                    <textarea
                      value={texts[field.key] ?? ""}
                      rows={Math.min(3, (texts[field.key] ?? "").split("\n").length)}
                      spellCheck={false}
                      onChange={(e) => setTexts((t) => ({ ...t, [field.key]: e.target.value }))}
                      className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-space-xs font-code-md text-code-md text-on-surface outline-none focus:border-primary"
                    />
                  ) : (
                    <input
                      value={texts[field.key] ?? ""}
                      inputMode={field.kind === "number" ? "numeric" : "text"}
                      placeholder={field.hint}
                      spellCheck={false}
                      onChange={(e) => setTexts((t) => ({ ...t, [field.key]: e.target.value }))}
                      className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm font-code-md text-code-md text-on-surface outline-none focus:border-primary"
                    />
                  )}
                </label>
              ))}
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-space-xs rounded-lg bg-primary-container px-space-lg font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary active:scale-[0.98]"
              >
                <Play size={15} />
                Run
              </button>
              <div className="flex flex-wrap items-center gap-space-xs pb-1.5">
                <span className="font-label-md text-label-md text-on-surface-variant">Try:</span>
                {program.examples.map((ex, i) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => loadExample(i)}
                    className={`rounded-full border px-space-sm py-0.5 font-label-md text-label-md transition-colors ${
                      i === example
                        ? "border-primary bg-primary-fixed text-primary"
                        : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p role="alert" className="font-body-sm text-body-sm mt-space-sm text-error">
                {error}
              </p>
            )}
          </form>

          {/* The picture, with what's happening beside it. */}
          <div
            className="flex min-h-0 flex-col @3xl:flex-row @3xl:[flex:0_1_var(--stage-h)]"
            style={{ "--stage-h": `${stageHeight ?? MIN_STAGE}px` } as CSSProperties}
          >
            <div className="flex h-[var(--stage-h)] min-h-0 min-w-0 flex-1 @3xl:h-auto">
              <DryRunPicture frames={frames} frame={frame} onHeight={setStageHeight} />
            </div>

            <div className="flex shrink-0 flex-col gap-space-sm overflow-y-auto border-t border-outline-variant/40 p-space-md @3xl:w-60 @3xl:border-l @3xl:border-t-0">
              <div className="flex items-center justify-between gap-space-sm">
                <span
                  className={`font-label-md text-label-md font-semibold ${
                    frame.done ? "text-secondary" : "text-primary"
                  }`}
                >
                  {frame.done ? "Result" : "What just happened"}
                </span>
                <span className="font-code-sm text-code-sm whitespace-nowrap text-on-surface-variant">
                  {step + 1} / {frames.length}
                </span>
              </div>

              {/* Every step's note shares one grid cell, hidden but for this
                  step's, so this is always as tall as the longest note. */}
              <div className="grid">
                {allNotes.map((note) => (
                  <p key={note} aria-hidden className="font-body-md text-body-md invisible [grid-area:1/1]">
                    <RichText text={note} />
                  </p>
                ))}
                <p aria-live="polite" className="font-body-md text-body-md text-on-surface-variant [grid-area:1/1]">
                  <span key={`${step}-${frames.length}`} className="block motion-safe:animate-fade-in">
                    <RichText text={frame.note} />
                  </span>
                </p>
              </div>

              {/* Likewise for the variables. */}
              {frames.some((f) => f.vars.length > 0) && (
                <div className="grid">
                  {allVars.map((vars, i) => (
                    <div key={i} aria-hidden className="invisible [grid-area:1/1]">
                      <VarChips vars={vars} />
                    </div>
                  ))}
                  <VarChips vars={frame.vars} />
                </div>
              )}
            </div>
          </div>

          {/* The code in every language the lesson has, which can be folded away. */}
          <div className="shrink-0 border-t border-outline-variant/40">
            <div className="flex items-center gap-space-sm pl-space-md pr-space-sm sm:pl-space-lg">
              <span className="hidden shrink-0 font-label-md text-label-md font-semibold text-on-surface-variant sm:inline">
                The code
              </span>
              {versions.length > 1 ? (
                <div role="tablist" aria-label="Code language" className="flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
                  {versions.map((v) => {
                    const selected = v === version;
                    return (
                      <button
                        key={v.language}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => {
                          writeStored(LANGUAGE_KEY, v.language);
                          setCodeOpen(true);
                        }}
                        className={`relative flex h-10 shrink-0 items-center gap-[6px] whitespace-nowrap px-space-sm font-label-md text-[13px] transition-colors ${
                          selected ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: DOTS[v.language.toLowerCase()] ?? "#a5a0ff" }} />
                        {/* Every tab is as wide as its bold label, so selecting one never nudges the others. */}
                        <span className="grid">
                          <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
                            {languageLabel(v.language)}
                          </span>
                          <span className={`col-start-1 row-start-1 ${selected ? "font-semibold" : ""}`}>{languageLabel(v.language)}</span>
                        </span>
                        {selected && <span aria-hidden className="absolute inset-x-space-xs bottom-0 h-0.5 rounded-full bg-primary-container" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="min-w-0 flex-1 py-space-sm font-label-md text-label-md font-semibold text-on-surface-variant">
                  <span className="sm:hidden">The code · </span>
                  <span className="font-normal">JavaScript</span>
                </span>
              )}
              {/* A fixed-width status, so "line 8", "line 12" or the note never move the buttons beside it. */}
              <span
                title={
                  version && !version.exact
                    ? `The ${languageLabel(version.language)} version is written a little differently, so the JavaScript tab shows the run line by line.`
                    : undefined
                }
                className="hidden w-[132px] shrink-0 truncate text-right font-label-md text-[12px] tabular-nums text-on-surface-variant md:inline"
              >
                {version && !version.exact ? "follow JavaScript for lines" : activeLine ? `line ${activeLine}` : ""}
              </span>
              <button
                type="button"
                onClick={copyCode}
                aria-label={copied ? "Code copied" : "Copy code"}
                className={`inline-flex h-8 shrink-0 items-center gap-[6px] rounded-md px-space-sm font-label-md text-[12px] transition-colors ${
                  copied ? "text-emerald-600" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => setCodeOpen((open) => !open)}
                aria-expanded={codeOpen}
                aria-label={codeOpen ? "Hide the code" : "Show the code"}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <ChevronDown size={16} className={`transition-transform duration-200 ${codeOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {codeOpen && version && (
              <div className="relative">
              <div
                ref={codeBox}
                role="tabpanel"
                aria-label={`${languageLabel(version.language)} code`}
                className="code-editor max-h-56 overflow-auto"
              >
                {/* Every language sits in the same spot and only the chosen one shows, so the
                    panel keeps one size (the largest version's) whichever tab is open. */}
                <div className="grid min-w-max">
                  {versions.map((v) => {
                    const shown = v === version;
                    return (
                      <div
                        key={v.language}
                        aria-hidden={!shown || undefined}
                        className={`col-start-1 row-start-1 ${shown ? "" : "invisible"}`}
                      >
                        <CodeLines
                          code={v.code}
                          language={v.language}
                          activeLine={shown ? activeLine : undefined}
                          size="sm"
                          className="!overflow-visible"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* On phones the toolbar has no room for the note, so it floats over the code instead of adding a row. */}
              {!version.exact && (
                <p className="pointer-events-none absolute right-space-sm top-space-sm rounded-full bg-black/60 px-space-sm py-0.5 font-label-md text-[11px] text-white backdrop-blur-sm md:hidden">
                  Follow JavaScript for lines
                </p>
              )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center gap-space-sm border-t border-outline-variant/40 bg-surface-container-lowest px-space-md py-space-sm sm:px-space-lg">
            <button
              type="button"
              aria-label="Back to the first step"
              onClick={() => {
                setPlaying(false);
                setStep(0);
              }}
              disabled={step === 0}
              className={controlButton}
            >
              <RotateCcw size={17} />
            </button>
            <button
              type="button"
              aria-label="Previous step"
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.max(s - 1, 0));
              }}
              disabled={step === 0}
              className={controlButton}
            >
              <SkipBack size={17} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (playing) {
                  setPlaying(false);
                } else {
                  if (step >= last) setStep(0);
                  setPlaying(true);
                }
              }}
              className="inline-flex h-10 min-w-28 items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary active:scale-[0.98]"
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              {playing ? "Pause" : step >= last ? "Replay" : "Play"}
            </button>
            <button
              type="button"
              aria-label="Next step"
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.min(s + 1, last));
              }}
              disabled={step >= last}
              className={controlButton}
            >
              <SkipForward size={17} />
            </button>
            <div role="group" aria-label="Playback speed" className="flex items-center gap-0.5 rounded-lg bg-surface-container-high p-0.5">
              {SPEEDS.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={speed === i}
                  onClick={() => setSpeed(i)}
                  className={`rounded-md px-space-sm py-1 font-label-md text-label-md transition-colors ${
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
              onChange={(e) => {
                setPlaying(false);
                setStep(Number(e.target.value));
              }}
              className="min-w-24 flex-1 accent-[var(--c-primary-container)]"
            />
          </div>
        </>
      )}
      </div>
    </section>
  );
}
