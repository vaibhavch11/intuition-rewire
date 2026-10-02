"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import {
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  SquareTerminal,
} from "lucide-react";
import RichText from "@/components/dsa/RichText";
import type { RegisterTone, Simulation } from "./types";

/** Milliseconds each step stays on screen while playing. */
const PLAY_MS = 1400;

const VALUE_TONES: Record<RegisterTone, string> = {
  primary: "text-primary",
  tertiary: "text-tertiary",
  secondary: "text-secondary",
  plain: "text-on-surface",
};

/** "[REGISTER] Left (L):" reads as "Left (L)" in the variables row. */
const cleanLabel = (label: string) => label.replace(/^\[REGISTER\]\s*/i, "").replace(/:\s*$/, "");

const iconButton =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant ring-1 ring-inset ring-outline-variant/70 transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

/**
 * Steps through a pre-rendered simulation: input and output up top, the
 * memory picture in the middle, the live variables and a note underneath.
 */
export default function DryRunEngine({ simulation }: { simulation: Simulation }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { steps } = simulation;
  const step = steps[stepIndex];
  const last = steps.length - 1;
  const finished = stepIndex === last;
  // "Input String:" reads as "Input · String", a bare "Input:" as just "Input".
  const inputLabel = simulation.input.label.replace(/:\s*$/, "").replace(/^input\s*/i, "");

  // Autoplay advances one step at a time and stops on the answer.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(last, stepIndex + 1);
      setStepIndex(next);
      if (next >= last) setPlaying(false);
    }, PLAY_MS);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, last]);

  const go = (index: number) => {
    setPlaying(false);
    setStepIndex(Math.max(0, Math.min(last, index)));
  };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("summary")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(stepIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(stepIndex - 1);
    }
  }

  return (
    <div
      onKeyDown={onKeyDown}
      className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-[0_1px_2px_rgba(19,27,46,0.04),0_20px_44px_-28px_rgba(19,27,46,0.3)]"
    >
      {/* What this simulator runs */}
      <div className="flex flex-wrap items-start justify-between gap-x-space-md gap-y-space-sm px-space-md py-space-md sm:px-space-lg">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-space-xs font-label-tag text-label-tag uppercase tracking-wider text-primary">
            <SquareTerminal size={14} aria-hidden />
            Dry-run engine
          </p>
          <h2 className="mt-1 font-headline-md text-headline-md tracking-tight text-on-surface">
            {simulation.algorithm}
          </h2>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{simulation.lead}</p>
        </div>
        <span className="shrink-0 rounded-md bg-secondary-container/50 px-space-sm py-1 font-label-tag text-label-tag text-on-secondary-container ring-1 ring-inset ring-secondary/15">
          {simulation.badge}
        </span>
      </div>

      {/* Input → output */}
      <dl className="grid border-y border-outline-variant/60 sm:grid-cols-2">
        <div className="px-space-md py-space-sm sm:px-space-lg">
          <dt className="font-label-tag text-label-tag uppercase tracking-wider text-on-surface-variant">
            {inputLabel ? `Input · ${inputLabel}` : "Input"}
          </dt>
          <dd className="mt-1 break-words font-code-md text-[15px] leading-6 text-on-surface">
            {simulation.input.value}
          </dd>
        </div>
        <div className="border-t border-outline-variant/60 px-space-md py-space-sm sm:border-l sm:border-t-0 sm:px-space-lg">
          <dt className="font-label-tag text-label-tag uppercase tracking-wider text-on-surface-variant">
            Output · {simulation.output.label}
          </dt>
          <dd aria-live="polite" className="mt-1 break-words font-code-md text-[15px] leading-6">
            {finished ? (
              <span className="font-semibold text-secondary motion-safe:animate-fade-in">
                {simulation.output.value}
              </span>
            ) : (
              <span className="text-on-surface-variant/70">
                {stepIndex === 0 ? "Press play to run it" : "Computing…"}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {/* How the algorithm moves, tucked away until asked for */}
      <details className="group border-b border-outline-variant/60 px-space-md sm:px-space-lg">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-space-sm py-space-sm font-label-md text-label-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface [&::-webkit-details-marker]:hidden">
          How it works
          <ChevronDown size={16} className="transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <p className="pb-space-md font-body-sm text-body-sm text-on-surface-variant">
          <RichText text={simulation.input.rule} />
        </p>
      </details>

      {/* The memory picture */}
      <div className="bg-surface-container-low/60 px-space-md py-space-md sm:px-space-lg">
        <p className="font-code-sm text-code-sm text-on-surface-variant">{simulation.buffer}</p>
        {/* The note below narrates this picture, so screen readers get that instead. */}
        <div aria-hidden className="mt-space-sm min-w-0">
          {step.visual}
        </div>
      </div>

      {/* Variables and what just happened */}
      <div className="border-t border-outline-variant/60 px-space-md py-space-md sm:px-space-lg">
        <ul className="flex flex-wrap gap-space-xs">
          {step.registers.map((register) => (
            <li
              key={register.label}
              className="inline-flex items-baseline gap-space-xs rounded-lg bg-surface-container px-space-sm py-1 font-code-sm text-code-sm"
            >
              <span className="text-on-surface-variant">{cleanLabel(register.label)}</span>
              <span className={`font-semibold ${VALUE_TONES[register.tone ?? "plain"]}`}>{register.value}</span>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="mt-space-sm min-h-[44px] font-body-md text-body-md text-on-surface">
          <span key={stepIndex} className="block motion-safe:animate-fade-in">
            <RichText text={step.note} />
          </span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-space-sm border-t border-outline-variant/60 bg-surface-container-low/60 px-space-md py-space-sm sm:px-space-lg">
        <button type="button" onClick={() => go(0)} aria-label="Back to the first step" className={iconButton}>
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          onClick={() => go(stepIndex - 1)}
          disabled={stepIndex === 0}
          aria-label="Previous step"
          className={iconButton}
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (playing) setPlaying(false);
            else {
              if (finished) setStepIndex(0);
              setPlaying(true);
            }
          }}
          className="inline-flex h-9 min-w-[104px] items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? "Pause" : finished ? "Replay" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => go(stepIndex + 1)}
          disabled={finished}
          aria-label="Next step"
          className={iconButton}
        >
          <SkipForward size={16} />
        </button>

        <div className="flex min-w-[120px] flex-1 items-center gap-[3px]" role="group" aria-label="Steps">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === stepIndex ? "step" : undefined}
              className="group/step flex h-6 flex-1 items-center"
            >
              <span
                className={`h-1.5 w-full rounded-full transition-colors duration-200 ${
                  i <= stepIndex ? "bg-primary-container" : "bg-outline-variant/70 group-hover/step:bg-outline"
                }`}
              />
            </button>
          ))}
        </div>
        <span className="shrink-0 font-code-sm text-code-sm tabular-nums text-on-surface-variant">
          {stepIndex + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}
