import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function linearSearch(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;   // found: stop right away
  }
  return -1;                            // checked everything: not there
}`;

const program: Program = {
  title: "Linear search",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10, min: -99, max: 99 },
    { key: "target", label: "target", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Example", input: { nums: [7, 3, 9, 4, 1], target: 4 } },
    { label: "Not there", input: { nums: [7, 3, 9, 4, 1], target: 6 } },
    { label: "Duplicates", input: { nums: [5, 8, 5, 2], target: 5 } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    const checked = (i: number): Record<number, CellTone> => toneRange(0, i - 1, "muted");

    r.step(lineOf(code, "for (let i = 0; i < nums.length; i++) {"), `Look for ${target} by checking the values **one at a time, from the left**. The array doesn't need to be sorted.`, {
      arrays: [{ name: "nums", values: nums }],
      vars: { target },
    });
    for (let i = 0; i < n; i++) {
      if (nums[i] === target) {
        r.step(lineOf(code, "if (nums[i] === target) return i;"), `nums[${i}] is ${nums[i]} — **${i}** is the answer. Found after ${i + 1} check${i ? "s" : ""}; nothing after it is looked at.`, {
          arrays: [{ name: "nums", values: nums, tones: { ...checked(i), [i]: "success" }, pointers: pointersAt(n, { i }) }],
          vars: { target, i },
          done: true,
        });
        return r.frames;
      }
      r.step(lineOf(code, "if (nums[i] === target) return i;"), `nums[${i}] is ${nums[i]}, not ${target}. Move on.`, {
        arrays: [{ name: "nums", values: nums, tones: { ...checked(i), [i]: "primary" }, pointers: pointersAt(n, { i }) }],
        vars: { target, i },
      });
    }
    r.step(lineOf(code, "return -1;"), `Every value was checked and none is ${target}: return **-1**. That's the worst case — all ${n} values, **O(n)**.`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }],
      vars: { target },
      done: true,
    });
    return r.frames;
  },
};

export default program;
