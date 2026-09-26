import { CELL_TONES, MemoryCells, VisualLabel, type CellTone } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const INPUT = "([]{})";
const CAPACITY = 4;
const OPENER: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

interface StackState {
  /** Index of the character being read; -1 before the scan, INPUT.length after. */
  cursor: number;
  buf: (string | null)[];
  top: number;
  pushed: number | null;
  popped: number | null;
}

function StackView({ state }: { state: StackState }) {
  const { cursor, buf, top, pushed, popped } = state;

  return (
    <div className="flex flex-col items-center gap-space-lg sm:flex-row sm:justify-center sm:gap-space-2xl">
      <div className="w-full max-w-[260px]">
        <div className="mb-space-xs text-center">
          <VisualLabel>input</VisualLabel>
        </div>
        <MemoryCells
          size="sm"
          indexed={false}
          cells={INPUT.split("").map((ch, i) => ({
            value: ch,
            tone: i < cursor ? "done" : i === cursor ? "primary" : "idle",
            pointers: i === cursor ? [{ label: "i", tone: "primary" }] : undefined,
          }))}
        />
      </div>

      <div className="flex flex-col items-center">
        <VisualLabel>stack_buffer · grows ↑</VisualLabel>
        <div className="mt-space-sm flex flex-col-reverse gap-1.5">
          {buf.map((value, i) => {
            const live = i <= top;
            let tone: CellTone =
              value === null ? "empty" : live ? "idle" : "muted";
            if (i === pushed) tone = "write";
            if (i === popped) tone = "tertiary";
            const note =
              value === null || live ? "" : i === popped ? " · popped" : " · stale";
            return (
              <div key={i} className="flex items-center gap-space-sm">
                <span className="w-12 text-right font-code-sm text-code-sm font-semibold text-tertiary">
                  {i === top ? "top →" : ""}
                </span>
                <div
                  className={`flex h-10 w-14 items-center justify-center rounded-lg font-code-md text-code-lg font-semibold transition-all duration-300 motion-reduce:transition-none ${CELL_TONES[tone]}`}
                >
                  {value ?? ""}
                </div>
                <span className="w-24 whitespace-nowrap font-code-sm text-code-sm text-on-surface-variant">
                  idx {i}
                  {note}
                </span>
              </div>
            );
          })}
        </div>
        <span className="mt-space-sm font-code-sm text-code-sm text-on-surface-variant">
          top = {top}
          {top === -1 ? " (empty)" : ""}
        </span>
      </div>
    </div>
  );
}

function trace(): SimulationStep[] {
  const buf: (string | null)[] = Array(CAPACITY).fill(null);
  const steps: SimulationStep[] = [];
  let top = -1;
  let deepest = 0;
  let pops = 0;

  const snapshot = ({
    note,
    cursor,
    action,
    pushed = null,
    popped = null,
    status,
  }: {
    note: string;
    cursor: number;
    action: string;
    pushed?: number | null;
    popped?: number | null;
    status?: string;
  }) => {
    steps.push({
      visual: (
        <StackView state={{ cursor, buf: [...buf], top, pushed, popped }} />
      ),
      registers: [
        {
          label: "[REGISTER] i:",
          value:
            cursor < 0
              ? "—"
              : cursor >= INPUT.length
                ? "end of input"
                : `${cursor} → '${INPUT[cursor]}'`,
          tone: "primary",
        },
        { label: "[REGISTER] top:", value: String(top), tone: "tertiary" },
        { label: "Action:", value: action },
      ],
      note,
      status,
    });
  };

  snapshot({
    cursor: -1,
    action: "—",
    note: "The stack is a fixed buffer plus one integer, `top` = -1 (empty). Push writes `buf[++top]`; pop reads `buf[top--]` — neither ever shifts memory.",
  });

  for (let i = 0; i < INPUT.length; i++) {
    const ch = INPUT[i];

    if (!(ch in OPENER)) {
      top++;
      const overwritten = buf[top];
      buf[top] = ch;
      deepest = Math.max(deepest, top + 1);
      snapshot({
        cursor: i,
        pushed: top,
        action: `push '${ch}'`,
        note:
          overwritten === null
            ? `i=${i} reads '${ch}' — an opening bracket, so push: \`top\` becomes ${top} and '${ch}' is written to buf[${top}].`
            : `i=${i} reads '${ch}' — push: \`top\` becomes ${top} and '${ch}' overwrites the stale '${overwritten}' in buf[${top}]. Popped memory is simply reused.`,
      });
      continue;
    }

    const open = top >= 0 ? buf[top] : null;
    if (open !== OPENER[ch]) {
      snapshot({
        cursor: i,
        action: "mismatch ✗",
        note: `i=${i} reads '${ch}', but ${open === null ? "the stack is empty" : `the top of the stack is '${open}'`} — nothing to pair it with, so the string is unbalanced.`,
        status: "UNBALANCED",
      });
      return steps;
    }

    const slot = top;
    top--;
    pops++;
    snapshot({
      cursor: i,
      popped: slot,
      action: `pop '${open}' ✓`,
      note:
        pops === 1
          ? `i=${i} reads '${ch}' — pop buf[${slot}] = '${open}', which matches. \`top\` drops to ${top}; the '${open}' is still sitting in buf[${slot}], but it's stale now — pop only moves the index, it never erases memory.`
          : `i=${i} reads '${ch}' — pop buf[${slot}] = '${open}', which matches. \`top\` drops to ${top}, leaving '${open}' behind as stale bytes.`,
    });
  }

  const balanced = top === -1;
  snapshot({
    cursor: INPUT.length,
    action: balanced ? "stack empty ✓" : `${top + 1} left open ✗`,
    note: balanced
      ? `Input exhausted and \`top\` is back to -1, so every bracket met its partner in the right order: balanced. O(n) time, and the stack never held more than ${deepest} brackets at once.`
      : `Input exhausted but \`top\` is ${top}: ${top + 1} bracket(s) were never closed, so the string is unbalanced.`,
    status: balanced ? "BALANCED" : "UNBALANCED",
  });

  return steps;
}

export const stackSimulation: Simulation = {
  algorithm: "Valid Parentheses",
  lead: "A stack is a fixed buffer plus a single top index — push and pop never move anything else.",
  input: {
    label: "Input:",
    value: `s = "${INPUT}"`,
    rule: "Push every opening bracket. On a closing bracket, pop and check it matches. The string is balanced only if every pop matches and `top` ends at -1.",
  },
  buffer: `stack_buffer[${CAPACITY}]`,
  badge: "O(n) Memory",
  steps: trace(),
};
