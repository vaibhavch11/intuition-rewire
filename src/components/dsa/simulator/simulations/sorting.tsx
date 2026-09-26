import { MemoryCells, type CellTone, type Pointer } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const INPUT = [7, 2, 9, 4, 3, 8, 5];
const HI = INPUT.length - 1;
const PIVOT = INPUT[HI];

interface PartitionState {
  arr: number[];
  i: number;
  j: number | null;
  /** Where the pivot currently sits. */
  pivotAt: number;
  swapped: number[];
  placed: boolean;
}

function PartitionView({ state }: { state: PartitionState }) {
  const { arr, i, j, pivotAt, swapped, placed } = state;
  return (
    <MemoryCells
      cells={arr.map((value, k) => {
        let tone: CellTone = "idle";
        if (k <= i) tone = "done";
        if (k === j) tone = "primary";
        if (swapped.includes(k)) tone = "write";
        if (k === pivotAt) tone = placed ? "success" : "tertiary";

        const pointers: Pointer[] = [];
        if (!placed && k === i) pointers.push({ label: "i", tone: "secondary" });
        if (k === j) pointers.push({ label: "j", tone: "primary" });
        if (k === pivotAt) pointers.push({ label: "pivot", tone: "tertiary" });
        return { value, tone, pointers };
      })}
    />
  );
}

function trace(): SimulationStep[] {
  const arr = [...INPUT];
  const steps: SimulationStep[] = [];
  let i = -1;
  let swaps = 0;

  const snapshot = ({
    note,
    j,
    swapped = [],
    placed = false,
  }: {
    note: string;
    j: number | null;
    swapped?: number[];
    placed?: boolean;
  }) => {
    const pivotAt = placed ? i + 1 : HI;
    steps.push({
      visual: (
        <PartitionView
          state={{ arr: [...arr], i, j, pivotAt, swapped, placed }}
        />
      ),
      registers: [
        { label: "[REGISTER] i:", value: String(i), tone: "secondary" },
        {
          label: "[REGISTER] j:",
          value: j === null ? "—" : `${j} (val: ${arr[j]})`,
          tone: "primary",
        },
        { label: "Pivot:", value: `${PIVOT} @ idx ${pivotAt}`, tone: "tertiary" },
        { label: "Swaps:", value: String(swaps) },
      ],
      note,
      status: placed ? "PIVOT PLACED" : undefined,
    });
  };

  snapshot({
    j: null,
    note: `Lomuto partition takes the last element, ${PIVOT}, as the pivot. \`i\` marks the end of the "≤ pivot" zone — -1 means the zone is empty — and \`j\` will scan every other cell once.`,
  });

  for (let j = 0; j < HI; j++) {
    if (arr[j] <= PIVOT) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      swaps++;
      snapshot({
        j,
        swapped: i === j ? [j] : [i, j],
        note:
          i === j
            ? `j = ${j}: ${arr[j]} ≤ ${PIVOT}, so it joins the zone: \`i\` becomes ${i}. Since i = j, the "swap" writes ${arr[j]} onto itself.`
            : `j = ${j}: ${arr[i]} ≤ ${PIVOT}, so it joins the zone: \`i\` becomes ${i}, then swap arr[${i}] ↔ arr[${j}]. ${arr[i]} moves left into the zone and ${arr[j]} moves right, in place.`,
      });
    } else {
      snapshot({
        j,
        note: `j = ${j}: ${arr[j]} > ${PIVOT}, so it stays where it is, right of the zone. No write.`,
      });
    }
  }

  const target = i + 1;
  [arr[target], arr[HI]] = [arr[HI], arr[target]];
  swaps++;
  snapshot({
    j: null,
    swapped: target === HI ? [] : [HI],
    placed: true,
    note: `Scan done. Swap the pivot into arr[i + 1] = arr[${target}], giving [${arr.join(", ")}]. ${PIVOT} is now in its final sorted position: everything left of it is ≤ ${PIVOT}, everything right is > ${PIVOT}. Quicksort recurses on each side — no extra array was ever allocated.`,
  });

  return steps;
}

export const sortingSimulation: Simulation = {
  algorithm: "Lomuto Partition",
  lead: "Quicksort's real work happens in place: one scan, a handful of swaps, zero extra arrays.",
  input: {
    label: "Pivot:",
    value: `pivot = arr[${HI}] = ${PIVOT}`,
    rule: "Scan `j` from left to right. When `arr[j] <= pivot`, increment `i` and swap `arr[i]` with `arr[j]`. Finally swap the pivot into `arr[i + 1]`.",
  },
  buffer: `contiguous_ram_buffer[${INPUT.length}]`,
  badge: "O(1) Memory",
  steps: trace(),
};
