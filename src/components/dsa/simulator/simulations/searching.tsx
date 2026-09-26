import { MemoryCells, type CellTone, type Pointer } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const SORTED = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const TARGET = 23;

function trace(): SimulationStep[] {
  const steps: SimulationStep[] = [];
  let lo = 0;
  let hi = SORTED.length - 1;
  let reads = 0;

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const value = SORTED[mid];
    const found = value === TARGET;
    reads++;

    const at = `lo=${lo}, hi=${hi}, so mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}, which holds ${value}.`;
    const note = found
      ? `${at} That's the target — found at index ${mid} after ${reads} reads. A linear scan would have needed ${mid + 1}; on a million elements it's about 20 reads versus up to 1,000,000.`
      : value < TARGET
        ? `${at} ${value} < ${TARGET}, so the target can only be to the right: discard [${lo}..${mid}] and set lo = ${mid + 1}.`
        : `${at} ${value} > ${TARGET}, so the target can only be to the left: discard [${mid}..${hi}] and set hi = ${mid - 1}.`;

    const l = lo;
    const h = hi;
    steps.push({
      visual: (
        <MemoryCells
          cells={SORTED.map((cell, i) => {
            let tone: CellTone = i < l || i > h ? "muted" : "idle";
            if (i === mid) tone = found ? "success" : "primary";
            const pointers: Pointer[] = [];
            if (i === l) pointers.push({ label: "lo", tone: "tertiary" });
            if (i === mid) pointers.push({ label: "mid", tone: "primary" });
            if (i === h) pointers.push({ label: "hi", tone: "tertiary" });
            return { value: cell, tone, pointers };
          })}
        />
      ),
      registers: [
        { label: "[REGISTER] lo:", value: String(lo), tone: "tertiary" },
        { label: "[REGISTER] hi:", value: String(hi), tone: "tertiary" },
        {
          label: "[REGISTER] mid:",
          value: `${mid} (val: ${value})`,
          tone: "primary",
        },
        {
          label: "Compare:",
          value: found
            ? `${value} = ${TARGET} (MATCH!)`
            : `${value} ${value < TARGET ? "<" : ">"} ${TARGET}`,
        },
      ],
      note,
      status: found ? "TARGET FOUND" : undefined,
    });

    if (found) break;
    if (value < TARGET) lo = mid + 1;
    else hi = mid - 1;
  }

  return steps;
}

export const searchingSimulation: Simulation = {
  algorithm: "Binary Search",
  lead: "A sorted array lets one read at the midpoint discard half of the remaining memory.",
  input: {
    label: "Target Value:",
    value: `target = ${TARGET}`,
    rule: "Read `mid = lo + (hi - lo) / 2`. If `arr[mid] < target`, move `lo = mid + 1`; if it's greater, move `hi = mid - 1`. Every read halves the window.",
  },
  buffer: `sorted_ram_buffer[${SORTED.length}]`,
  badge: "O(log n) Time",
  steps: trace(),
};
