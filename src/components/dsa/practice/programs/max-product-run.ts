import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function maxProduct(nums) {
  let hi = nums[0], lo = nums[0], best = nums[0];   // largest and smallest product ending here
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    if (x < 0) [hi, lo] = [lo, hi];              // a negative turns the smallest into the largest
    hi = Math.max(x, hi * x);                    // start fresh at x, or extend
    lo = Math.min(x, lo * x);
    best = Math.max(best, hi);
  }
  return best;
}`;

// -0 shows as 0.
const z = (v: number) => (v === 0 ? 0 : v);

const program: Program = {
  title: "Maximum product subarray: largest and smallest ending here",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10, min: -9, max: 9 }],
  examples: [
    { label: "Two negatives", input: { nums: [2, 3, -2, 4, -1] } },
    { label: "Example", input: { nums: [2, 3, -2, 4] } },
    { label: "With a zero", input: { nums: [-2, 0, -1] } },
    { label: "Odd negatives", input: { nums: [2, -5, -2, -4, 3] } },
  ],
  check: (input) => ((input.nums as number[]).length ? null : "Add at least one number."),
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let hi = nums[0];
    let lo = nums[0];
    let best = nums[0];
    // Where the subarrays behind hi, lo and best start (best also records its end).
    let hiStart = 0;
    let loStart = 0;
    let bestFrom = 0;
    let bestTo = 0;
    const his: Scalar[] = new Array(n).fill("");
    const los: Scalar[] = new Array(n).fill("");
    his[0] = hi;
    los[0] = lo;
    const view = (i: number, nt: Record<number, CellTone>, ht: Record<number, CellTone> = {}, lt: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "nums", values: nums, tones: nt, pointers: { [i]: [{ label: "i" }] } },
        { name: "hi (largest product ending here)", values: [...his], tones: ht },
        { name: "lo (smallest product ending here)", values: [...los], tones: lt },
      ],
      vars: { hi: z(hi), lo: z(lo), best: z(best) },
    });

    r.step(lineOf(code, "let hi = nums[0]"), `Start at nums[0] = ${nums[0]}: the only subarray ending there has product ${nums[0]}, so hi = lo = best = **${nums[0]}**.`, view(0, { 0: "write" }, { 0: "write" }, { 0: "write" }));
    for (let i = 1; i < n; i++) {
      const x = nums[i];
      if (x < 0) {
        [hi, lo] = [lo, hi];
        [hiStart, loStart] = [loStart, hiStart];
        r.step(lineOf(code, "if (x < 0) [hi, lo] = [lo, hi];"), `x = ${x} is negative: multiplying flips the order, so the smallest product (${z(hi)}) is now the candidate for the largest. Swap: hi = ${z(hi)}, lo = ${z(lo)}.`, view(i, { [i]: "tertiary" }, { [i - 1]: "primary" }, { [i - 1]: "primary" }));
      }
      const extendHi = hi * x;
      const extendLo = lo * x;
      const newHiStart = x >= extendHi ? i : hiStart;
      const newLoStart = x <= extendLo ? i : loStart;
      hi = Math.max(x, extendHi);
      lo = Math.min(x, extendLo);
      hiStart = newHiStart;
      loStart = newLoStart;
      his[i] = z(hi);
      los[i] = z(lo);
      let note = `x = ${x}: hi = max(${x}, ${z(extendHi)}) = **${z(hi)}**${hiStart === i ? " (start fresh)" : ""}, lo = min(${x}, ${z(extendLo)}) = ${z(lo)}.`;
      if (hi > best) {
        best = hi;
        bestFrom = hiStart;
        bestTo = i;
        note += ` New best: ${z(best)}.`;
      }
      const nt: Record<number, CellTone> = {};
      for (let k = hiStart; k <= i; k++) nt[k] = "primary";
      nt[i] = "write";
      r.step(lineOf(code, "best = Math.max(best, hi);"), note, view(i, nt, { [i]: "write" }, { [i]: "write" }));
    }
    const span: Record<number, CellTone> = {};
    for (let k = bestFrom; k <= bestTo; k++) span[k] = "success";
    r.step(lineOf(code, "return best;"), `The largest product is **${z(best)}**, from nums[${bestFrom}..${bestTo}] = [${nums.slice(bestFrom, bestTo + 1).join(", ")}]. One pass, two numbers of state: O(n) time, O(1) space.`, { ...view(bestTo, span, { [bestTo]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
