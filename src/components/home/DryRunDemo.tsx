"use client";

import { useState } from "react";
import { SlidersHorizontal, SkipForward, RotateCcw } from "lucide-react";

const ARR = [2, 3, 5, 9, 11, 15];
const TARGET = 14;

const STEPS = [
  {
    left: 0,
    right: 5,
    sum: 17,
    desc: "Step 1: L=0 (val 2), R=5 (val 15). Sum is 17. Since 17 > 14 (target), decrement Right pointer (R = 4).",
  },
  {
    left: 0,
    right: 4,
    sum: 13,
    desc: "Step 2: L=0 (val 2), R=4 (val 11). Sum is 13. Since 13 < 14 (target), increment Left pointer (L = 1).",
  },
  {
    left: 1,
    right: 4,
    sum: 14,
    desc: "Step 3: L=1 (val 3), R=4 (val 11). Sum is exactly 14! Solution target found at indices [1, 4].",
  },
];

export default function DryRunDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const found = step.sum === TARGET;

  return (
    <section className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl w-full" id="dry-run-demo">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-space-xl">
        {/* Explanatory context column */}
        <div className="w-full lg:w-5/12 flex flex-col">
          <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-secondary-container/30 w-fit mb-space-sm">
            <SlidersHorizontal size={16} className="text-on-secondary-container" />
            <span className="font-label-tag text-label-tag text-on-secondary-container uppercase">
              Execution Simulator
            </span>
          </div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface">
            Visual Dry-Run Engine
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm mb-space-md">
            See memory mutations as they happen in CPU cache lines. Test the{" "}
            <span className="font-code-md text-code-md text-primary font-semibold">
              Two Sum II (Sorted Array)
            </span>{" "}
            algorithm in real-time below.
          </p>

          <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm mb-space-md">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Target Value:
              </span>
              <span className="font-code-md text-code-md px-space-xs py-0.5 rounded bg-primary text-on-primary font-semibold">
                target = {TARGET}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              If <code className="font-code-sm text-code-sm text-primary">arr[L] + arr[R] &gt; target</code>,
              shift right pointer leftward (<code className="font-code-sm text-code-sm">R--</code>). Otherwise,
              increment left pointer (<code className="font-code-sm text-code-sm">L++</code>).
            </p>
          </div>

          <div className="p-space-md rounded-xl bg-inverse-surface text-inverse-on-surface shadow-sm font-code-sm text-code-sm space-y-space-xs">
            <div className="flex justify-between text-on-primary-container">
              <span>[REGISTER] Left (L):</span>
              <span className="font-semibold text-secondary-fixed">
                {step.left} (val: {ARR[step.left]})
              </span>
            </div>
            <div className="flex justify-between text-on-primary-container">
              <span>[REGISTER] Right (R):</span>
              <span className="font-semibold text-tertiary-fixed">
                {step.right} (val: {ARR[step.right]})
              </span>
            </div>
            <div className="flex justify-between text-on-primary-container">
              <span>Current Sum:</span>
              <span className="font-semibold text-inverse-on-surface">
                {step.sum} ({found ? "MATCH!" : step.sum > TARGET ? "> 14" : "< 14"})
              </span>
            </div>
            <div className="flex justify-between pt-space-xs border-t border-surface-variant/20 text-on-secondary-fixed">
              <span>Status:</span>
              <span className="font-semibold text-secondary-fixed">
                {found ? "TARGET CONVERGED" : "Running Dry-Run"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm mt-space-md">
            <button
              onClick={() => setStepIndex((i) => (i + 1) % STEPS.length)}
              className="flex-1 inline-flex items-center justify-center gap-space-xs h-10 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-colors"
            >
              <SkipForward size={18} />
              <span>Next Step</span>
            </button>
            <button
              onClick={() => setStepIndex(0)}
              className="inline-flex items-center justify-center h-10 px-space-md rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Interactive array workbench */}
        <div className="w-full lg:w-7/12 rounded-2xl bg-surface-container-lowest shadow-md p-space-lg">
          <div className="flex items-center justify-between pb-space-md mb-space-lg border-b border-surface-container-low">
            <div className="flex items-center gap-space-xs">
              <span className="w-3 h-3 rounded-full bg-error" />
              <span className="w-3 h-3 rounded-full bg-tertiary" />
              <span className="w-3 h-3 rounded-full bg-secondary" />
              <span className="font-code-sm text-code-sm text-on-surface-variant ml-space-xs">
                contiguous_ram_buffer[6]
              </span>
            </div>
            <span className="font-label-tag text-label-tag px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container">
              O(1) Memory
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-4 my-space-xl px-2">
            {ARR.map((value, idx) => {
              const isLeft = idx === step.left;
              const isRight = idx === step.right;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <span
                    className={`h-6 font-code-sm text-code-sm font-semibold transition-all ${
                      isLeft
                        ? "text-primary"
                        : isRight
                        ? "text-tertiary"
                        : "text-transparent"
                    }`}
                  >
                    {isLeft ? "L ▼" : isRight ? "R ▼" : "L ▼"}
                  </span>
                  <div
                    className={`w-full aspect-square max-w-[64px] rounded-xl flex items-center justify-center font-headline-md text-headline-md shadow-sm transition-all duration-300 ${
                      found && (isLeft || isRight)
                        ? "bg-secondary-container text-on-secondary-container scale-105 shadow-md"
                        : isLeft
                        ? "bg-primary-fixed text-primary"
                        : isRight
                        ? "bg-tertiary-fixed text-tertiary"
                        : "bg-surface-container-low text-on-surface"
                    }`}
                  >
                    {value}
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant mt-1.5">
                    idx {idx}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low text-on-surface">
            <div className="font-label-md text-label-md font-semibold text-primary mb-1">
              State Explanation:
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{step.desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
