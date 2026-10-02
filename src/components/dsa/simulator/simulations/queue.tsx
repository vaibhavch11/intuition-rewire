import { MemoryCells, type Cell, type CellTone, type Pointer } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const CAPACITY = 5;

type Operation = { kind: "enqueue"; value: number } | { kind: "dequeue" };

const OPERATIONS: Operation[] = [
  { kind: "enqueue", value: 10 },
  { kind: "enqueue", value: 20 },
  { kind: "enqueue", value: 30 },
  { kind: "dequeue" },
  { kind: "dequeue" },
  { kind: "enqueue", value: 40 },
  { kind: "enqueue", value: 50 },
  { kind: "enqueue", value: 60 },
];

interface QueueState {
  buf: (number | null)[];
  head: number;
  tail: number;
  size: number;
  written: number | null;
  read: number | null;
  /** An index just stepped from the last slot back to 0. */
  wrapped: boolean;
}

function QueueView({ state }: { state: QueueState }) {
  const { buf, head, tail, size, written, read, wrapped } = state;
  const isLive = (i: number) => (i - head + CAPACITY) % CAPACITY < size;

  const cells: Cell[] = buf.map((value, i) => {
    let tone: CellTone = value === null ? "empty" : isLive(i) ? "idle" : "muted";
    if (i === written) tone = "write";
    if (i === read) tone = "tertiary";
    const pointers: Pointer[] = [];
    if (i === head) pointers.push({ label: "head", tone: "primary" });
    if (i === tail) pointers.push({ label: "tail", tone: "tertiary" });
    return { value: value ?? "", tone, pointers };
  });

  // Spans from the centre of the last cell back to the centre of the first,
  // matching MemoryCells' gap-2 / sm:gap-4 spacing.
  const inset =
    "left-[calc((100%-32px)/10)] right-[calc((100%-32px)/10)] sm:left-[calc((100%-64px)/10)] sm:right-[calc((100%-64px)/10)]";

  return (
    <div>
      <MemoryCells cells={cells} />
      <div className="relative mx-2 mt-space-sm h-9">
        <div
          className={`absolute top-0 h-4 rounded-b-xl border-2 border-t-0 transition-colors duration-300 ${inset} ${
            wrapped ? "border-primary" : "border-dashed border-outline-variant"
          }`}
        />
        <span
          className={`absolute top-0 -translate-x-1/2 -translate-y-2 text-[10px] leading-none transition-colors duration-300 left-[calc((100%-32px)/10)] sm:left-[calc((100%-64px)/10)] ${
            wrapped ? "text-primary" : "text-outline-variant"
          }`}
        >
          ▲
        </span>
        <span
          className={`absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap bg-surface-container-lowest px-space-xs font-code-sm text-code-sm ${
            wrapped ? "font-semibold text-primary" : "text-on-surface-variant"
          }`}
        >
          next index = (i + 1) % {CAPACITY}
        </span>
      </div>
    </div>
  );
}

function trace(): SimulationStep[] {
  const buf: (number | null)[] = Array(CAPACITY).fill(null);
  const steps: SimulationStep[] = [];
  let head = 0;
  let tail = 0;
  let size = 0;

  const snapshot = ({
    note,
    lastOp,
    written = null,
    read = null,
    wrapped = false,
    status,
  }: {
    note: string;
    lastOp: string;
    written?: number | null;
    read?: number | null;
    wrapped?: boolean;
    status?: string;
  }) => {
    steps.push({
      visual: (
        <QueueView
          state={{ buf: [...buf], head, tail, size, written, read, wrapped }}
        />
      ),
      registers: [
        {
          label: "[REGISTER] head:",
          value: size > 0 ? `${head} → ${buf[head]}` : `${head} (empty)`,
          tone: "primary",
        },
        {
          label: "[REGISTER] tail:",
          value: `${tail} (next write)`,
          tone: "tertiary",
        },
        { label: "Size:", value: `${size} / ${CAPACITY}` },
        { label: "Last op:", value: lastOp },
      ],
      note,
      status,
    });
  };

  snapshot({
    lastOp: "—",
    note: `The queue is a fixed ring of ${CAPACITY} slots plus two indices: \`head\` (next read) and \`tail\` (next write). Both start at 0.`,
  });

  OPERATIONS.forEach((op, n) => {
    const isLastOp = n === OPERATIONS.length - 1;

    if (op.kind === "enqueue") {
      if (size === CAPACITY) {
        snapshot({
          lastOp: `enqueue(${op.value}) ✗`,
          note: `enqueue(${op.value}) finds all ${CAPACITY} slots live — the ring is full, so the value is rejected.`,
        });
        return;
      }
      const slot = tail;
      const overwritten = buf[slot];
      buf[slot] = op.value;
      tail = (tail + 1) % CAPACITY;
      size++;
      const wrapped = tail === 0;
      const detail = wrapped
        ? `the last slot, and \`tail = (${slot} + 1) % ${CAPACITY}\` wraps to 0 — the freed front of the buffer gets reused instead of shifting anything.`
        : overwritten !== null
          ? `overwriting the stale ${overwritten} a dequeue left behind, then advances \`tail\` to ${tail}.`
          : `the slot under \`tail\`, then advances \`tail\` to ${tail}.`;
      snapshot({
        lastOp: `enqueue(${op.value})`,
        written: slot,
        wrapped,
        note: `enqueue(${op.value}) writes ${op.value} into buf[${slot}], ${detail} Size ${size} / ${CAPACITY}.${isLastOp ? " Every operation stayed O(1)." : ""}`,
        status: isLastOp ? "WRAPPED AROUND" : undefined,
      });
      return;
    }

    if (size === 0) {
      snapshot({
        lastOp: "dequeue() ✗",
        note: "dequeue() finds the queue empty — there is nothing to read.",
      });
      return;
    }
    const slot = head;
    const value = buf[slot];
    head = (head + 1) % CAPACITY;
    size--;
    snapshot({
      lastOp: `dequeue() → ${value}`,
      read: slot,
      wrapped: head === 0,
      note: `dequeue() reads buf[${slot}] = ${value} and advances \`head\` to ${head}. Nothing shifts forward: ${value} is still in buf[${slot}], but it's stale now.`,
      status: isLastOp ? "WRAPPED AROUND" : undefined,
    });
  });

  return steps;
}

export const queueSimulation: Simulation = {
  algorithm: "Circular Buffer Queue",
  lead: "A queue doesn't shift elements forward — two indices chase each other around a fixed ring of memory.",
  input: {
    label: "Operations:",
    value: "enq ×3 · deq ×2 · enq ×3",
    rule: `Enqueue writes at \`tail\`, dequeue reads at \`head\`; both advance with \`(i + 1) % ${CAPACITY}\`, so slots freed at the front are reused instead of shifting elements.`,
  },
  buffer: `ring_buffer[${CAPACITY}]`,
  badge: "O(1) Enqueue / Dequeue",
  output: { label: "Queue (front → back)", value: "30, 40, 50, 60" },
  steps: trace(),
};
