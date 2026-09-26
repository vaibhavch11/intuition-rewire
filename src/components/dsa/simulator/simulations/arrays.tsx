import { hex, MemoryCells, type CellTone } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const NUMS = [2, 3, 5, 9, 11, 15];
const TARGET = 14;
/** Base address of the buffer; each int takes 4 bytes. */
const BASE = 0x1000;

function trace(): SimulationStep[] {
  const steps: SimulationStep[] = [];
  let left = 0;
  let right = NUMS.length - 1;

  while (left < right) {
    const sum = NUMS[left] + NUMS[right];
    const found = sum === TARGET;
    const at = `L=${left} (val ${NUMS[left]}), R=${right} (val ${NUMS[right]}).`;

    const note = found
      ? `${at} Sum is exactly ${TARGET}! Solution target found at indices [${left}, ${right}].`
      : sum > TARGET
        ? `${at} Sum is ${sum}. Since ${sum} > ${TARGET} (target), decrement Right pointer (R = ${right - 1}).`
        : `${at} Sum is ${sum}. Since ${sum} < ${TARGET} (target), increment Left pointer (L = ${left + 1}).`;

    const l = left;
    const r = right;
    steps.push({
      visual: (
        <MemoryCells
          cells={NUMS.map((value, i) => {
            let tone: CellTone = "idle";
            if (found && (i === l || i === r)) tone = "success";
            else if (i === l) tone = "primary";
            else if (i === r) tone = "tertiary";
            // Everything outside [L, R] has already been ruled out.
            else if (i < l || i > r) tone = "muted";
            return {
              value,
              tone,
              detail: hex(BASE + i * 4),
              pointers:
                i === l
                  ? [{ label: "L", tone: "primary" }]
                  : i === r
                    ? [{ label: "R", tone: "tertiary" }]
                    : undefined,
            };
          })}
        />
      ),
      registers: [
        {
          label: "[REGISTER] Left (L):",
          value: `${left} (val: ${NUMS[left]})`,
          tone: "primary",
        },
        {
          label: "[REGISTER] Right (R):",
          value: `${right} (val: ${NUMS[right]})`,
          tone: "tertiary",
        },
        {
          label: "Current Sum:",
          value: `${sum} (${found ? "MATCH!" : sum > TARGET ? `> ${TARGET}` : `< ${TARGET}`})`,
        },
      ],
      note,
      status: found ? "TARGET CONVERGED" : undefined,
    });

    if (found) break;
    if (sum > TARGET) right--;
    else left++;
  }

  return steps;
}

export const arraysSimulation: Simulation = {
  algorithm: "Two Sum II (Sorted Array)",
  lead: "See memory mutations as they happen in CPU cache lines.",
  input: {
    label: "Target Value:",
    value: `target = ${TARGET}`,
    rule: "If `arr[L] + arr[R] > target`, shift right pointer leftward (`R--`). Otherwise, increment left pointer (`L++`).",
  },
  buffer: `contiguous_ram_buffer[${NUMS.length}]`,
  badge: "O(1) Memory",
  steps: trace(),
};
