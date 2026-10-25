import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function smallestDistancePair(nums, k) {
  const a = [...nums].sort((x, y) => x - y);
  const countWithin = (d) => {                   // how many pairs are at most d apart?
    let count = 0, left = 0;
    for (let right = 0; right < a.length; right++) {
      while (a[right] - a[left] > d) left++;     // shrink until the window spans at most d
      count += right - left;                     // a[right] pairs with every value in the window
    }
    return count;
  };
  let low = 0;
  let high = a[a.length - 1] - a[0];
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (countWithin(mid) >= k) high = mid;       // at least k pairs within mid: the answer is mid or less
    else low = mid + 1;                          // fewer than k: the answer is bigger
  }
  return low;
}`;

/** For each right end, how many earlier values are within d of it (sorted input). */
function within(a: number[], d: number) {
  let left = 0;
  return a.map((v, right) => {
    while (v - a[left] > d) left++;
    return right - left;
  });
}

const program: Program = {
  title: "Find k-th smallest pair distance (binary search + sliding window)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10, min: 0, max: 99 },
    { key: "k", label: "k", kind: "number", min: 1, max: 45 },
  ],
  examples: [
    { label: "Example", input: { nums: [1, 3, 4, 8], k: 4 } },
    { label: "Duplicates", input: { nums: [1, 3, 1], k: 1 } },
    { label: "Bigger", input: { nums: [9, 2, 14, 7, 20, 2, 11], k: 10 } },
  ],
  check(input) {
    const n = (input.nums as number[]).length;
    if (n < 2) return "nums needs at least two values.";
    return (input.k as number) <= (n * (n - 1)) / 2 ? null : `k can be at most ${(n * (n - 1)) / 2}, the number of pairs.`;
  },
  run(input) {
    const a = [...(input.nums as number[])].sort((x, y) => x - y);
    const k = input.k as number;
    const r = recorder();
    let low = 0;
    let high = a[a.length - 1] - a[0];

    r.step(lineOf(code, "let high = a[a.length - 1] - a[0];"), `Sorted: [${a.join(", ")}]. The answer is a distance in **${low}..${high}**. The number of pairs at most d apart only grows with d, so find the **first d with at least ${k}**.`, {
      arrays: [{ name: "sorted", values: a }],
      vars: { k, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const per = within(a, mid);
      const count = per.reduce((s, x) => s + x, 0);
      const ok = count >= k;
      r.step(lineOf(code, "const mid = low + "), `Try **d = ${mid}**. Slide a window whose values span at most ${mid}; each value pairs with the window's values before it: ${per.join(" + ")} = **${count}** pairs.`, {
        arrays: [{ name: "sorted", values: a }, { name: `pairs within ${mid}, by right end`, values: per, tones: Object.fromEntries(per.map((x, i) => [i, x ? (ok ? "success" : "tertiary") : "idle"])) as Record<number, CellTone> }],
        vars: { k, low, mid, high, count },
      });
      if (ok) {
        high = mid;
        r.step(lineOf(code, "if (countWithin(mid) >= k) high = mid;"), `${count} >= ${k}: the ${k}-th distance is at most ${mid}. \`high = ${high}\`.`, { arrays: [{ name: "sorted", values: a }], vars: { k, low, high } });
      } else {
        low = mid + 1;
        r.step(lineOf(code, "else low = mid + 1;"), `${count} < ${k}: fewer than ${k} pairs are within ${mid}, so the answer is bigger. \`low = ${low}\`.`, { arrays: [{ name: "sorted", values: a }], vars: { k, low, high } });
      }
    }
    r.step(lineOf(code, "return low;"), `One distance left: the ${k}-th smallest pair distance is **${low}**. **O(n log n + n log W)**, never listing the pairs.`, {
      arrays: [{ name: "sorted", values: a }, { name: `pairs within ${low}, by right end`, values: within(a, low) }],
      vars: { k, answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
