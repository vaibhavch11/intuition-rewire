import { MemoryCells, type CellTone, type Pointer } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const STAIRS = 7;

/** How many calls the naive `ways(n - 1) + ways(n - 2)` recursion would make. */
function naiveCalls(n: number): number {
  return n <= 1 ? 1 : 1 + naiveCalls(n - 1) + naiveCalls(n - 2);
}

function trace(): SimulationStep[] {
  const dp: (number | null)[] = Array(STAIRS + 1).fill(null);
  const steps: SimulationStep[] = [];

  const snapshot = ({
    note,
    i,
    written,
    status,
  }: {
    note: string;
    i: number | null;
    written: number[];
    status?: string;
  }) => {
    const table = [...dp];
    steps.push({
      visual: (
        <MemoryCells
          cells={table.map((value, k) => {
            let tone: CellTone = value === null ? "empty" : "done";
            const pointers: Pointer[] = [];
            if (i !== null && k === i - 2) {
              tone = "tertiary";
              pointers.push({ label: "i-2", tone: "tertiary" });
            }
            if (i !== null && k === i - 1) {
              tone = "primary";
              pointers.push({ label: "i-1", tone: "primary" });
            }
            if (written.includes(k)) tone = "write";
            if (k === i) pointers.push({ label: "i", tone: "secondary" });
            return { value: value ?? "?", tone, pointers };
          })}
        />
      ),
      registers: [
        {
          label: "[REGISTER] i:",
          value: i === null ? "—" : String(i),
          tone: "secondary",
        },
        {
          label: "dp[i-1]:",
          value: i === null ? "—" : String(table[i - 1]),
          tone: "primary",
        },
        {
          label: "dp[i-2]:",
          value: i === null ? "—" : String(table[i - 2]),
          tone: "tertiary",
        },
        {
          label: "dp[i]:",
          value:
            i === null
              ? "—"
              : `${table[i - 1]} + ${table[i - 2]} = ${table[i]}`,
        },
      ],
      note,
      status,
    });
  };

  dp[0] = 1;
  dp[1] = 1;
  snapshot({
    i: null,
    written: [0, 1],
    note: `\`dp[i]\` = the number of ways to reach stair i taking 1 or 2 steps at a time. The table is one contiguous block of ${STAIRS + 1} cells. Seed the base cases: dp[0] = 1 (stand still) and dp[1] = 1 (one single step).`,
  });

  for (let i = 2; i <= STAIRS; i++) {
    dp[i] = dp[i - 1]! + dp[i - 2]!;
    const sum = `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`;
    const last = i === STAIRS;
    snapshot({
      i,
      written: [i],
      note: last
        ? `${sum} There are ${dp[i]} ways to climb ${STAIRS} stairs, found with ${STAIRS - 1} additions — the naive recursion makes ${naiveCalls(STAIRS)} calls, recomputing the same stairs over and over.`
        : i === 2
          ? `${sum} Both inputs are already in the table, so this cell costs two reads and one write — O(1), however large n gets.`
          : `${sum} Two reads of cells just to the left, one write — the window slides right through contiguous memory.`,
      status: last ? `ANSWER = ${dp[i]}` : undefined,
    });
  }

  return steps;
}

export const dynamicProgrammingSimulation: Simulation = {
  algorithm: "Climbing Stairs (Tabulation)",
  lead: "Dynamic programming trades a little memory for a lot of time: every subproblem is solved once and kept in a table.",
  input: {
    label: "Stairs:",
    value: `n = ${STAIRS}`,
    rule: "You can climb 1 or 2 steps at a time, so `dp[i] = dp[i - 1] + dp[i - 2]`. Filling the table left to right means every lookup is already computed.",
  },
  buffer: `dp_table[${STAIRS + 1}]`,
  badge: "O(n) Time · O(n) Memory",
  output: { label: "Returns", value: "21 ways" },
  steps: trace(),
};
