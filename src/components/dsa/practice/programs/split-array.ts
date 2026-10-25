import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function splitArray(nums, k) {
  const pieces = (limit) => {                      // pieces needed if none may sum past limit
    let count = 1, sum = 0;
    for (const x of nums) {
      if (sum + x > limit) { count++; sum = 0; }   // start a new piece
      sum += x;
    }
    return count;
  };
  let low = Math.max(...nums);                     // a piece holds at least the biggest value
  let high = nums.reduce((a, b) => a + b, 0);      // one piece holds everything
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (pieces(mid) <= k) high = mid;              // possible: try a smaller limit
    else low = mid + 1;                            // needs more than k pieces: raise the limit
  }
  return low;
}`;

/** The piece (1, 2, ...) each value lands in when cutting greedily at this limit. */
function cut(nums: number[], limit: number) {
  let piece = 1;
  let sum = 0;
  return nums.map((x) => {
    if (sum + x > limit) {
      piece++;
      sum = 0;
    }
    sum += x;
    return piece;
  });
}

const program: Program = {
  title: "Split array largest sum (binary search on the limit)",
  code,
  fields: [
    { key: "nums", label: "nums (non-negative)", kind: "array", maxLength: 10, min: 0, max: 99 },
    { key: "k", label: "k (pieces)", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "Example", input: { nums: [7, 2, 5, 10, 8], k: 2 } },
    { label: "Five values", input: { nums: [1, 2, 3, 4, 5], k: 2 } },
    { label: "Three pieces", input: { nums: [10, 5, 13, 4, 8, 4, 5, 11, 14, 9], k: 3 } },
  ],
  check: (input) => ((input.nums as number[]).length ? ((input.k as number) <= (input.nums as number[]).length ? null : "k can't be more than the number of values.") : "Add at least one value."),
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const r = recorder();
    let low = Math.max(...nums);
    let high = nums.reduce((a, b) => a + b, 0);
    const pieceTones = (plan: number[], ok: boolean): Record<number, CellTone> =>
      Object.fromEntries(plan.map((p, i) => [i, !ok && p > k ? "tertiary" : p % 2 ? "done" : "success"])) as Record<number, CellTone>;

    r.step(lineOf(code, "let high = nums.reduce"), `The answer is a limit between the biggest value, **${low}**, and the total, **${high}**. A higher limit never needs more pieces, so find the **first limit that needs at most ${k}**.`, {
      arrays: [{ name: "nums", values: nums }],
      vars: { k, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const plan = cut(nums, mid);
      const need = plan[plan.length - 1];
      const ok = need <= k;
      r.step(lineOf(code, "const mid = low + "), `Try limit **${mid}**: extend each piece while its sum stays within ${mid}. That cuts the array into **${need}** piece${need === 1 ? "" : "s"}.`, {
        arrays: [{ name: "nums", values: nums }, { name: `piece at limit ${mid}`, values: plan, tones: pieceTones(plan, ok) }],
        vars: { k, low, mid, high, pieces: need },
      });
      if (ok) {
        high = mid;
        r.step(lineOf(code, "if (pieces(mid) <= k) high = mid;"), `${need} <= ${k}: limit ${mid} works (fewer pieces can always be split further). Try smaller — \`high = ${high}\`.`, { arrays: [{ name: "nums", values: nums }], vars: { k, low, high } });
      } else {
        low = mid + 1;
        r.step(lineOf(code, "else low = mid + 1;"), `${need} > ${k}: limit ${mid} needs too many pieces. Raise it — \`low = ${low}\`.`, { arrays: [{ name: "nums", values: nums }], vars: { k, low, high } });
      }
    }
    const plan = cut(nums, low);
    r.step(lineOf(code, "return low;"), `One limit left: the smallest possible largest sum is **${low}**. **O(n log(total))**.`, {
      arrays: [{ name: "nums", values: nums }, { name: `piece at limit ${low}`, values: plan, tones: pieceTones(plan, true) }],
      vars: { k, answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
