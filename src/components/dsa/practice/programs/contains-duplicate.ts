import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function containsDuplicate(nums) {
  const sorted = [...nums].sort((a, b) => a - b);   // equal values end up side by side
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1]) return true;   // a value equal to its neighbour
  }
  return false;
}`;

const program: Program = {
  title: "Contains duplicate (sort, then compare neighbours)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10, min: -99, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3, 1] } },
    { label: "All different", input: { nums: [4, 1, 3, 2] } },
    { label: "Many repeats", input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const sorted = [...nums].sort((a, b) => a - b);
    const n = sorted.length;
    const r = recorder();

    r.step(lineOf(code, "const sorted = "), `Before: [${nums.join(", ")}]. Sorting puts **equal values next to each other**, so a duplicate, if there is one, must sit beside its twin. Then one pass over neighbours is enough.`, {
      arrays: [{ name: "nums", values: [...nums] }, { name: "sorted", values: sorted, tones: toneRange(0, n - 1, "done") }],
    });
    for (let i = 1; i < n; i++) {
      const same = sorted[i] === sorted[i - 1];
      r.step(
        lineOf(code, same ? "return true;" : "if (sorted[i] === sorted[i - 1])"),
        same ? `sorted[${i - 1}] = sorted[${i}] = ${sorted[i]}: a duplicate. Return **true**.` : `${sorted[i - 1]} ≠ ${sorted[i]}: no duplicate here, move on.`,
        { arrays: [{ name: "sorted", values: sorted, tones: { [i - 1]: same ? "success" : "primary", [i]: same ? "success" : "primary" }, pointers: pointersAt(n, { i }) }], ...(same ? { done: true } : {}) }
      );
      if (same) return r.frames;
    }
    r.step(lineOf(code, "return false;"), `No two neighbours are equal, so every value is different: **false**. The sort costs **O(n log n)**; the scan O(n).`, {
      arrays: [{ name: "sorted", values: sorted, tones: toneRange(0, n - 1, "done") }],
      done: true,
    });
    return r.frames;
  },
};

export default program;
