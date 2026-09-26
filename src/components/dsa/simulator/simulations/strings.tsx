import { MemoryCells, type CellTone, type Pointer } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const WORD = "stressed";

const byteOf = (ch: string) => `0x${ch.charCodeAt(0).toString(16)}`;
const describe = (ch: string) => `'${ch}' (${byteOf(ch)})`;

function trace(): SimulationStep[] {
  const buf = WORD.split("");
  const steps: SimulationStep[] = [];
  let left = 0;
  let right = buf.length - 1;

  const snapshot = (note: string, finished: boolean) => {
    const l = left;
    const r = right;
    const chars = [...buf];
    steps.push({
      visual: (
        <MemoryCells
          cells={chars.map((ch, i) => {
            let tone: CellTone = "idle";
            // Bytes outside [L, R] have already been swapped into place.
            if (finished || i < l || i > r) tone = "done";
            else if (i === l) tone = "primary";
            else if (i === r) tone = "tertiary";
            const pointers: Pointer[] = [];
            if (i === l) pointers.push({ label: "L", tone: "primary" });
            if (i === r) pointers.push({ label: "R", tone: "tertiary" });
            return { value: ch, tone, detail: byteOf(ch), pointers };
          })}
        />
      ),
      registers: [
        {
          label: "[REGISTER] Left (L):",
          value: finished ? `${l} (crossed R)` : `${l} → ${describe(chars[l])}`,
          tone: "primary",
        },
        {
          label: "[REGISTER] Right (R):",
          value: finished ? `${r} (crossed L)` : `${r} → ${describe(chars[r])}`,
          tone: "tertiary",
        },
        { label: "Buffer:", value: `"${chars.join("")}"` },
      ],
      note,
      status: finished ? "REVERSED IN PLACE" : undefined,
    });
  };

  while (left < right) {
    const pair = `L=${left} holds ${describe(buf[left])}, R=${right} holds ${describe(buf[right])}`;
    snapshot(
      left === 0
        ? `Strings are immutable in JavaScript, Java and Python, so the bytes are first copied into a mutable \`char[]\` — one byte per ASCII character. ${pair}. Since L < R, swap them in place, then move L → ${left + 1} and R → ${right - 1}.`
        : `buf[${left - 1}] and buf[${right + 1}] are final. ${pair}: swap them, then move L → ${left + 1} and R → ${right - 1}.`,
      false
    );
    [buf[left], buf[right]] = [buf[right], buf[left]];
    left++;
    right--;
  }

  const swaps = steps.length;
  snapshot(
    `L=${left} has crossed R=${right}, so the loop stops: ${swaps} swaps for ${WORD.length} bytes — O(n) time and O(1) extra memory. The same buffer now reads "${buf.join("")}".`,
    true
  );

  return steps;
}

export const stringsSimulation: Simulation = {
  algorithm: "Reverse a String In Place",
  lead: "Every character is just a byte sitting in a contiguous buffer.",
  input: {
    label: "Input String:",
    value: `s = "${WORD}"`,
    rule: "While `L < R`, swap `buf[L]` and `buf[R]` in place, then step both pointers inward (`L++`, `R--`). Each cell shows its character and the byte it is stored as.",
  },
  buffer: `char_buffer[${WORD.length}] · ASCII`,
  badge: "O(1) Extra Memory",
  steps: trace(),
};
