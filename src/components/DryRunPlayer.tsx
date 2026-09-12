"use client";

import { useState } from "react";
import type { Trace, TraceValue } from "@/lib/dsa/types";

function formatValue(value: TraceValue): string {
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") {
    const entries = Object.entries(value).map(
      ([k, v]) => `${k}: ${formatValue(v)}`
    );
    return `{ ${entries.join(", ")} }`;
  }
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

export default function DryRunPlayer({ trace }: { trace: Trace }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = trace.steps[stepIndex];
  const codeLines = trace.code.split("\n");
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === trace.steps.length - 1;

  // Find the first array-shaped variable to render as a visual strip.
  const arrayVarEntry = Object.entries(step.variables).find(([, v]) =>
    Array.isArray(v)
  );

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm">
        <span className="font-medium">Dry Run</span>
        <span className="text-gray-500">
          Step {stepIndex + 1} / {trace.steps.length}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <pre className="text-sm font-mono p-4 overflow-x-auto bg-gray-900 text-gray-100 m-0">
          {codeLines.map((line, i) => {
            const lineNumber = i + 1;
            const active = lineNumber === step.line;
            return (
              <div
                key={lineNumber}
                className={`px-2 -mx-2 rounded ${
                  active ? "bg-brand/25 border-l-2 border-brand-light" : ""
                }`}
              >
                <span className="inline-block w-6 text-gray-500 select-none">
                  {lineNumber}
                </span>
                {line || " "}
              </div>
            );
          })}
        </pre>

        <div className="p-4 space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-1 text-gray-500 uppercase tracking-wide text-xs">
              Call Stack
            </h4>
            <ul className="space-y-1 font-mono">
              {[...step.callStack].reverse().map((frame, i) => (
                <li key={i} className="px-2 py-1 rounded bg-gray-100">
                  {frame}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-gray-500 uppercase tracking-wide text-xs">
              Variables
            </h4>
            <table className="w-full font-mono text-xs">
              <tbody>
                {Object.entries(step.variables).map(([name, value]) => (
                  <tr key={name} className="border-b border-gray-200">
                    <td className="py-1 pr-2 text-gray-500 align-top whitespace-nowrap">
                      {name}
                    </td>
                    <td className="py-1 break-all">{formatValue(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {arrayVarEntry && (
            <div>
              <h4 className="font-semibold mb-1 text-gray-500 uppercase tracking-wide text-xs">
                {arrayVarEntry[0]}
              </h4>
              <div className="flex gap-1">
                {(arrayVarEntry[1] as TraceValue[]).map((v, idx) => (
                  <div
                    key={idx}
                    className={`w-9 h-9 flex items-center justify-center rounded font-mono text-xs border ${
                      step.highlightIndices?.includes(idx)
                        ? "bg-brand-tint border-brand-light"
                        : "border-gray-300"
                    }`}
                  >
                    {formatValue(v)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-700 leading-relaxed">{step.note}</p>

          {step.output && (
            <div className="font-mono text-xs px-2 py-1 rounded bg-brand-tint border border-brand-light/50">
              output: {step.output}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <button
          onClick={() => setStepIndex(0)}
          disabled={isFirst}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40"
        >
          Reset
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            onClick={() =>
              setStepIndex((i) => Math.min(trace.steps.length - 1, i + 1))
            }
            disabled={isLast}
            className="text-sm px-3 py-1.5 rounded bg-brand text-white disabled:opacity-40 hover:bg-brand-dark transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
