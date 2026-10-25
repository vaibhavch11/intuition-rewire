import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function smallestDivisor(nums, threshold) {
  const total = (d) => nums.reduce((sum, x) => sum + Math.ceil(x / d), 0);
  let low = 1;
  let high = Math.max(...nums);              // every share is 1: total = n, which always works
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (total(mid) <= threshold) high = mid;   // mid works: the answer is mid or smaller
    else low = mid + 1;                        // mid fails: the answer is bigger
  }
  return low;
}`;

const program: Program = {
  title: "Smallest divisor given a threshold (binary search on the answer)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 8, min: 1, max: 99 },
    { key: "threshold", label: "threshold", kind: "number", min: 1, max: 999 },
  ],
  examples: [
    { label: "Example", input: { nums: [1, 2, 5, 9], threshold: 6 } },
    { label: "Tight", input: { nums: [44, 22, 33, 11, 1], threshold: 5 } },
    { label: "Loose", input: { nums: [19, 7, 30, 12], threshold: 20 } },
  ],
  check(input) {
    const nums = input.nums as number[];
    if (nums.length === 0) return "nums needs at least one value.";
    return (input.threshold as number) >= nums.length ? null : "threshold must be at least the number of values, or no divisor works.";
  },
  run(input) {
    const nums = input.nums as number[];
    const threshold = input.threshold as number;
    const r = recorder();
    const shares = (d: number) => nums.map((x) => Math.ceil(x / d));
    const total = (d: number) => shares(d).reduce((a, b) => a + b, 0);
    let low = 1;
    let high = Math.max(...nums);

    r.step(lineOf(code, "let high = Math.max(...nums);"), `The answer is a divisor between **${low}** and **${high}**: dividing by the largest value makes every share 1, a total of ${nums.length}, which is within ${threshold}. A bigger divisor never raises the total, so "does d work?" flips from no to yes once — find the first yes.`, {
      arrays: [{ name: "nums", values: nums }],
      vars: { threshold, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const t = total(mid);
      const works = t <= threshold;
      const tone: CellTone = works ? "success" : "tertiary";
      r.step(lineOf(code, "const mid = low + "), `Try **d = ${mid}**, the middle of ${low}..${high}. Each value divided by ${mid}, rounded up: ${shares(mid).join(" + ")} = **${t}**.`, {
        arrays: [
          { name: "nums", values: nums },
          { name: `÷ ${mid}, rounded up`, values: shares(mid), tones: Object.fromEntries(nums.map((_, i) => [i, tone])) as Record<number, CellTone> },
        ],
        vars: { threshold, low, mid, high, "total(mid)": t },
      });
      if (works) {
        high = mid;
        r.step(lineOf(code, "if (total(mid) <= threshold) high = mid;"), `${t} <= ${threshold}: d = ${mid} works. The smallest that works is ${mid} or less — \`high = ${high}\`.`, {
          arrays: [{ name: "nums", values: nums }],
          vars: { threshold, low, high },
        });
      } else {
        low = mid + 1;
        r.step(lineOf(code, "else low = mid + 1;"), `${t} > ${threshold}: d = ${mid} is too small, and so is every smaller divisor — \`low = ${low}\`.`, {
          arrays: [{ name: "nums", values: nums }],
          vars: { threshold, low, high },
        });
      }
    }
    r.step(lineOf(code, "return low;"), `One candidate left: the smallest divisor is **${low}** (total ${total(low)}). Each check is one pass over the array, and there are about log₂(max) of them: **O(n log max)**.`, {
      arrays: [
        { name: "nums", values: nums },
        { name: `÷ ${low}, rounded up`, values: shares(low), tones: Object.fromEntries(nums.map((_, i) => [i, "success"])) as Record<number, CellTone> },
      ],
      vars: { threshold, answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
