"use client";

import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
} from "lucide-react";
import CodeLines from "@/components/dsa/CodeLines";
import RichText from "@/components/dsa/RichText";
import { CELL_TONES, PointerTags } from "@/components/dsa/simulator/visuals";
import { isPracticeProgram, PRACTICE_PROGRAMS } from "@/lib/dsa/practicePrograms";
import { PROGRAM_LOADERS } from "./loaders";
import { formatField, parseField } from "./parseInput";
import { ListDiagram, StackColumn, TreeDiagram } from "./StructureViews";
import {
  cell,
  formatValue,
  type ArrayView,
  type CellTone,
  type Frame,
  type GridView,
  type Input,
  type Program,
} from "./types";

const PLAY_MS = 1200;

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
    <div className={`${cellBox} ${CELL_TONES[empty ? "empty" : tone ?? "idle"]}`}>
      {empty ? "" : formatValue(value)}
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
        {view.values.length === 0 && <Empty />}
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
              {c}
            </span>
          ))}
          {view.values.map((row, r) => (
            <Fragment key={r}>
              <span className="pr-1 text-right font-code-sm text-[11px] leading-4 text-on-surface-variant">{r}</span>
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
}: {
  program: string;
  caption?: string;
}) {
  const [program, setProgram] = useState<Program | null>(null);
  const [failed, setFailed] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [frames, setFrames] = useState<Frame[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [example, setExample] = useState(0);

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

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const next = Math.min(step + 1, last);
      setStep(next);
      if (next >= last) setPlaying(false);
    }, PLAY_MS);
    return () => clearTimeout(timer);
  }, [playing, step, last]);

  // Keep the executing line in view inside the code panel (never scrolls the page).
  const codeBox = useRef<HTMLDivElement>(null);
  const activeLine = frames[step]?.line;
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
  }, [activeLine]);

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
      className="my-space-2xl overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm"
    >
      <header className="border-b border-outline-variant/40 bg-surface-container-low px-space-md py-space-md sm:px-space-lg">
        <span className="inline-flex items-center gap-space-xs rounded-full bg-secondary-container/40 px-space-sm py-0.5 font-label-tag text-label-tag uppercase text-on-secondary-container">
          <SlidersHorizontal size={13} />
          Dry-run simulator
        </span>
        <h3 className="font-headline-md text-headline-md mt-space-xs text-on-surface">{title}</h3>
        <p className="font-body-sm text-body-sm mt-space-2xs text-on-surface-variant">
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
            className="border-b border-outline-variant/40 px-space-md py-space-md sm:px-space-lg"
          >
            <div className="flex flex-wrap items-end gap-space-md">
              {program.fields.map((field) => (
                <label key={field.key} className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">{field.label}</span>
                  {field.kind === "grid" ? (
                    <textarea
                      value={texts[field.key] ?? ""}
                      rows={Math.min(5, (texts[field.key] ?? "").split("\n").length + 1)}
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
            </div>
            <div className="mt-space-sm flex flex-wrap items-center gap-space-xs">
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
            {error && (
              <p role="alert" className="font-body-sm text-body-sm mt-space-sm text-error">
                {error}
              </p>
            )}
          </form>

          {/* The explanation below narrates this picture for screen readers. */}
          <div aria-hidden className="overflow-x-auto px-space-md py-space-lg sm:px-space-lg">
            <div className="flex w-max min-w-full flex-col gap-space-lg">
              {(frame.trees.length > 0 || frame.stacks.length > 0) && (
                <div className="flex flex-wrap items-end gap-space-xl">
                  {frame.trees.map((tree) => (
                    <TreeDiagram key={tree.name} view={tree} />
                  ))}
                  {frame.stacks.map((stack) => (
                    <StackColumn key={stack.name} view={stack} />
                  ))}
                </div>
              )}
              {frame.lists.map((list) => (
                <ListDiagram key={list.name} view={list} />
              ))}
              {frame.grids.length > 0 && (
                <div className="flex flex-wrap items-start gap-space-xl">
                  {frame.grids.map((grid) => (
                    <GridBox key={grid.name} view={grid} />
                  ))}
                </div>
              )}
              {frame.arrays.map((array) => (
                <ArrayRow key={array.name} view={array} />
              ))}
            </div>
          </div>

          {frame.vars.length > 0 && (
            <div className="flex flex-wrap gap-space-xs px-space-md pb-space-md sm:px-space-lg">
              {frame.vars.map(([name, value]) => (
                <span
                  key={name}
                  className="rounded-md bg-surface-container px-space-sm py-0.5 font-code-sm text-code-sm"
                >
                  <span className="text-on-surface-variant">{name} = </span>
                  <span className="font-semibold text-on-surface">{value}</span>
                </span>
              ))}
            </div>
          )}

          <div className="grid border-t border-outline-variant/40 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="code-editor flex min-w-0 flex-col">
              <div className="flex items-center justify-between gap-space-sm border-b border-white/10 bg-black/20 px-space-md py-1.5 font-label-md text-[12px] text-[var(--editor-muted)]">
                <span className="inline-flex items-center gap-space-xs">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-[#f7df1e]" />
                  JavaScript
                </span>
                <span className="font-code-sm tabular-nums">line {frame.line}</span>
              </div>
              <div ref={codeBox} className="max-h-80 overflow-y-auto">
                <CodeLines code={program.code} language="javascript" activeLine={frame.line} size="sm" />
              </div>
            </div>
            <div className="flex flex-col gap-space-xs p-space-md">
              <div className="flex items-center justify-between gap-space-sm">
                <span
                  className={`font-label-md text-label-md font-semibold ${
                    frame.done ? "text-secondary" : "text-primary"
                  }`}
                >
                  {frame.done ? "Result" : "What just happened"}
                </span>
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  Step {step + 1} / {frames.length}
                </span>
              </div>
              <p aria-live="polite" className="font-body-md text-body-md text-on-surface-variant">
                <span key={`${step}-${frames.length}`} className="block motion-safe:animate-fade-in">
                  <RichText text={frame.note} />
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm border-t border-outline-variant/40 px-space-md py-space-md sm:px-space-lg">
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
    </section>
  );
}
