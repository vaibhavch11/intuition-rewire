"use client";

import { useState } from "react";
import {
  Repeat,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
} from "lucide-react";
import RichText from "@/components/dsa/RichText";
import type { RegisterTone, Simulation } from "./types";

const REGISTER_TONES: Record<RegisterTone, string> = {
  primary: "text-primary-fixed-dim",
  tertiary: "text-tertiary-fixed",
  secondary: "text-secondary-fixed",
  plain: "text-inverse-on-surface",
};

/**
 * Steps through a pre-rendered simulation. Every step's visual arrives
 * already rendered, so this only tracks which step is showing.
 */
export default function DryRunEngine({
  simulation,
}: {
  simulation: Simulation;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const { steps } = simulation;
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  // minmax(0, …) tracks and min-w-0 let wide diagrams scroll inside the
  // memory window instead of stretching the whole page on small screens.
  return (
    <div className="grid grid-cols-1 items-start gap-x-space-xl gap-y-space-lg lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-y-space-md">
      {/* Explanatory context */}
      <div className="flex min-w-0 flex-col">
        <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-secondary-container/30 w-fit mb-space-sm">
          <SlidersHorizontal size={16} className="text-on-secondary-container" />
          <span className="font-label-tag text-label-tag text-on-secondary-container uppercase">
            Execution Simulator
          </span>
        </div>
        <h2 className="font-headline-xl text-headline-xl-mobile text-on-surface lg:text-headline-xl">
          Visual Dry-Run Engine
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm mb-space-md">
          {simulation.lead} Test the{" "}
          <span className="font-code-md text-code-md text-primary font-semibold">
            {simulation.algorithm}
          </span>{" "}
          algorithm in real-time below.
        </p>

        <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-xs">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {simulation.input.label}
            </span>
            <span className="font-code-md text-code-md px-space-xs py-0.5 rounded bg-primary text-on-primary font-semibold">
              {simulation.input.value}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            <RichText text={simulation.input.rule} />
          </p>
        </div>
      </div>

      {/* Memory window */}
      <div className="min-w-0 rounded-2xl bg-surface-container-lowest shadow-md p-space-md sm:p-space-lg lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="flex items-center justify-between gap-space-sm pb-space-md mb-space-lg border-b border-surface-container-low">
          <div className="flex min-w-0 items-center gap-space-xs">
            <span className="w-3 h-3 shrink-0 rounded-full bg-error" />
            <span className="w-3 h-3 shrink-0 rounded-full bg-tertiary" />
            <span className="w-3 h-3 shrink-0 rounded-full bg-secondary" />
            <span className="font-code-sm text-code-sm text-on-surface-variant ml-space-xs truncate">
              {simulation.buffer}
            </span>
          </div>
          <span className="shrink-0 font-label-tag text-label-tag px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container">
            {simulation.badge}
          </span>
        </div>

        {/* The note below narrates this picture, so screen readers get that instead. */}
        <div aria-hidden className="my-space-xl">
          {step.visual}
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low text-on-surface">
          <div className="flex items-center justify-between gap-space-sm mb-1">
            <span className="font-label-md text-label-md font-semibold text-primary">
              State Explanation:
            </span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">
              Step {stepIndex + 1} / {steps.length}
            </span>
          </div>
          <p
            aria-live="polite"
            className="min-h-[54px] font-body-sm text-body-sm text-on-surface-variant"
          >
            <span key={stepIndex} className="block motion-safe:animate-fade-in">
              <RichText text={step.note} />
            </span>
          </p>
        </div>
      </div>

      {/* Registers and controls */}
      <div className="flex min-w-0 flex-col lg:col-start-1 lg:row-start-2">
        <div className="p-space-md rounded-xl bg-inverse-surface text-inverse-on-surface shadow-sm font-code-sm text-code-sm space-y-space-xs">
          {step.registers.map((register) => (
            <div
              key={register.label}
              className="flex justify-between gap-space-md text-on-primary-container"
            >
              <span className="shrink-0">{register.label}</span>
              <span
                className={`text-right font-semibold ${
                  REGISTER_TONES[register.tone ?? "plain"]
                }`}
              >
                {register.value}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-space-md pt-space-xs border-t border-surface-variant/20 text-on-primary-container">
            <span className="shrink-0">Status:</span>
            <span className="text-right font-semibold text-secondary-fixed">
              {step.status ?? "Running Dry-Run"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm mt-space-md">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            aria-label="Previous step"
            className="inline-flex items-center justify-center h-10 px-space-md rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-container-high"
          >
            <SkipBack size={18} />
          </button>
          <button
            type="button"
            onClick={() => setStepIndex((i) => (isLast ? 0 : i + 1))}
            className="flex-1 inline-flex items-center justify-center gap-space-xs h-10 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-all active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {isLast ? <Repeat size={18} /> : <SkipForward size={18} />}
            <span>{isLast ? "Run Again" : "Next Step"}</span>
          </button>
          <button
            type="button"
            onClick={() => setStepIndex(0)}
            aria-label="Reset to the first step"
            className="group inline-flex items-center justify-center h-10 px-space-md rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors"
          >
            <RotateCcw
              size={18}
              className="transition-transform duration-500 group-hover:-rotate-180 motion-reduce:transition-none"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
