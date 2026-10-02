import { CELL_TONES, VisualLabel, hex, type CellTone } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const N = 4;
/** Top of the stack region; each frame takes 0x20 bytes and the stack grows down. */
const STACK_BASE = 0x7ff0;
const FRAME_SIZE = 0x20;
const frameAddress = (depth: number) => hex(STACK_BASE - depth * FRAME_SIZE);

type FrameStatus = "unused" | "waiting" | "active" | "returning" | "popped";

interface Frame {
  n: number;
  status: FrameStatus;
  /** What the frame is working on, e.g. `4 × fact(3)` or `4 × 6 = 24`. */
  expression: string;
}

const FRAME_TONES: Record<FrameStatus, CellTone> = {
  unused: "empty",
  waiting: "tertiary",
  active: "primary",
  returning: "success",
  popped: "muted",
};

function StackFrames({ frames, sp }: { frames: Frame[]; sp: number }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center justify-between">
        <VisualLabel>stack memory</VisualLabel>
        <VisualLabel>grows ↓</VisualLabel>
      </div>
      <div className="mt-space-xs space-y-1.5">
        {frames.map((frame, depth) => (
          <div key={depth} className="flex items-center gap-space-sm">
            <span className="w-12 shrink-0 text-right font-code-sm text-code-sm text-on-surface-variant">
              {frameAddress(depth)}
            </span>
            <div
              className={`flex h-10 min-w-0 flex-1 items-center justify-between gap-space-sm rounded-lg px-space-md font-code-md text-code-md transition-all duration-300 motion-reduce:transition-none ${
                CELL_TONES[FRAME_TONES[frame.status]]
              }`}
            >
              <span className="font-semibold">
                {frame.status === "unused" ? "" : `fact(${frame.n})`}
              </span>
              <span className="truncate">
                {frame.status === "popped" ? "stale" : frame.expression}
              </span>
            </div>
            <span className="w-10 shrink-0 font-code-sm text-code-sm font-semibold text-primary">
              {depth === sp ? "← sp" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function trace(): SimulationStep[] {
  const frames: Frame[] = Array.from({ length: N }, (_, depth) => ({
    n: N - depth,
    status: "unused",
    expression: "",
  }));
  const steps: SimulationStep[] = [];
  let sp = -1;

  const snapshot = ({
    note,
    pending,
    returned,
    status,
  }: {
    note: string;
    pending: string;
    returned: string;
    status?: string;
  }) => {
    const depth = frames.filter(
      (f) => f.status !== "unused" && f.status !== "popped"
    ).length;
    steps.push({
      visual: (
        <StackFrames frames={frames.map((f) => ({ ...f }))} sp={sp} />
      ),
      registers: [
        {
          label: "[REGISTER] sp:",
          value: sp < 0 ? "— (stack empty)" : frameAddress(sp),
          tone: "primary",
        },
        {
          label: "Depth:",
          value: `${depth} frame${depth === 1 ? "" : "s"}`,
          tone: "tertiary",
        },
        { label: "Pending:", value: pending },
        { label: "Returned:", value: returned },
      ],
      note,
      status,
    });
  };

  // Descend: each call pushes a frame and waits on the next one.
  for (let depth = 0; depth < N; depth++) {
    const n = N - depth;
    const isBase = n <= 1;
    if (depth > 0) frames[depth - 1].status = "waiting";
    frames[depth].status = isBase ? "returning" : "active";
    frames[depth].expression = isBase ? "n ≤ 1 → 1" : `${n} × fact(${n - 1})`;
    sp = depth;
    const waiting = frames.slice(0, depth).map((f) => f.n);

    const where = `pushes its frame at ${frameAddress(depth)}`;
    snapshot({
      pending: [...waiting, ...(isBase ? [1] : [n, `fact(${n - 1})`])].join(
        " × "
      ),
      returned: "—",
      note: isBase
        ? `fact(${n}) ${where}. ${n} ≤ 1 is the base case, so it can answer immediately: return 1. This is the deepest the stack gets — ${N} frames.`
        : depth === 0
          ? `fact(${n}) ${where}. ${n} > 1, so it can't answer yet: it pauses at \`${n} * fact(${n - 1})\` and calls fact(${n - 1}). Its frame keeps n = ${n} alive until then.`
          : `fact(${n}) ${where}, just below its caller — the stack grows toward lower addresses. It pauses at \`${n} * fact(${n - 1})\`.`,
    });
  }

  // Unwind: each return pops a frame and resumes the one above it.
  let value = 1;
  for (let depth = N - 2; depth >= 0; depth--) {
    const n = N - depth;
    frames[depth + 1].status = "popped";
    const incoming = value;
    value = n * incoming;
    frames[depth].status = "returning";
    frames[depth].expression = `${n} × ${incoming} = ${value}`;
    sp = depth;
    const waiting = frames.slice(0, depth).map((f) => f.n);

    snapshot({
      pending: [...waiting, value].join(" × "),
      returned: String(value),
      note: `fact(${n - 1}) returned ${incoming}; its frame is popped and \`sp\` moves back up to ${frameAddress(depth)}. fact(${n}) resumes with n = ${n} still in its frame: ${n} × ${incoming} = ${value}.`,
    });
  }

  frames[0].status = "popped";
  sp = -1;
  snapshot({
    pending: String(value),
    returned: String(value),
    note: `fact(${N}) returns ${value} to its caller and the last frame is popped. The ${N} frames' bytes still sit below \`sp\`, but they're stale — the next call will overwrite them. Recursion depth ${N} cost O(n) stack memory.`,
    status: `RETURNED ${value}`,
  });

  return steps;
}

export const recursionSimulation: Simulation = {
  algorithm: "Factorial (Recursive)",
  lead: "Every call gets its own stack frame; recursion is just frames piling up and then unwinding.",
  input: {
    label: "Call:",
    value: `fact(${N})`,
    rule: "`fact(n)` returns 1 when `n <= 1`; otherwise it calls `fact(n - 1)` and multiplies the result by `n`. Every call still waiting on another call keeps its own frame on the stack.",
  },
  buffer: "call_stack · grows ↓",
  badge: "O(n) Stack Memory",
  output: { label: "Returns", value: "24" },
  steps: trace(),
};
