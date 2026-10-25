import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function reversePairs(nums) {
  const a = [...nums];
  const sortCount = (lo, hi) => {                 // sorts a[lo..hi), returns the reverse pairs inside it
    if (hi - lo <= 1) return 0;
    const mid = (lo + hi) >> 1;
    let count = sortCount(lo, mid) + sortCount(mid, hi);
    let j = mid;
    for (let i = lo; i < mid; i++) {              // both halves are sorted: j only moves forward
      while (j < hi && a[i] > 2 * a[j]) j++;
      count += j - mid;                           // a[mid..j) are all small enough for a[i]
    }
    const merged = [];
    let p = lo, q = mid;
    while (p < mid && q < hi) merged.push(a[p] <= a[q] ? a[p++] : a[q++]);
    while (p < mid) merged.push(a[p++]);
    while (q < hi) merged.push(a[q++]);
    for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];
    return count;
  };
  return sortCount(0, a.length);
}`;

const program: Program = {
  title: "Reverse pairs (merge sort with a counting pass)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: -50, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [1, 3, 2, 3, 1] } },
    { label: "Another", input: { nums: [2, 4, 3, 5, 1] } },
  ],
  run(input) {
    const a = [...(input.nums as number[])];
    const n = a.length;
    const r = recorder();
    let total = 0;

    const view = (lo: number, hi: number, tones: Record<number, CellTone>, marks: Record<string, number> = {}) => {
      const base: Record<number, CellTone> = {};
      for (let k = 0; k < n; k++) if (k < lo || k >= hi) base[k] = "muted";
      return { arrays: [{ name: "a", values: [...a], tones: { ...base, ...tones }, pointers: pointersAt(n, marks, { j: "tertiary" }) }], vars: { "reverse pairs": total } };
    };

    const sortCount = (lo: number, hi: number): void => {
      if (hi - lo <= 1) return;
      const mid = (lo + hi) >> 1;
      sortCount(lo, mid);
      sortCount(mid, hi);
      r.step(lineOf(code, "let j = mid;"), `Halves [${a.slice(lo, mid).join(", ")}] and [${a.slice(mid, hi).join(", ")}] are each sorted. Before merging, count the pairs across them: for each left value a[i], how many right values have **a[i] > 2 · a[j]**?`, view(lo, hi, { ...toneRange(lo, mid - 1, "primary"), ...toneRange(mid, hi - 1, "tertiary") }));
      let j = mid;
      for (let i = lo; i < mid; i++) {
        while (j < hi && a[i] > 2 * a[j]) j++;
        total += j - mid;
        r.step(
          lineOf(code, "count += j - mid;"),
          j > mid ? `${a[i]} > 2 × each of ${a.slice(mid, j).join(", ")}: **${j - mid}** pair${j - mid === 1 ? "" : "s"}. The left half is sorted, so the next a[i] is at least as big — j never has to move back.` : `${a[i]} isn't more than twice ${a[mid]}: no pairs for it.`,
          view(lo, hi, { [i]: "primary", ...toneRange(mid, j - 1, "write") }, j < hi ? { i, j } : { i })
        );
      }
      const merged: number[] = [];
      let p = lo;
      let q = mid;
      while (p < mid && q < hi) merged.push(a[p] <= a[q] ? a[p++] : a[q++]);
      while (p < mid) merged.push(a[p++]);
      while (q < hi) merged.push(a[q++]);
      for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];
      r.step(lineOf(code, "while (p < mid && q < hi) merged.push"), `Now merge the halves as usual: [${merged.join(", ")}]. Counting and merging are separate passes, because the pair condition (×2) isn't the merge's order.`, view(lo, hi, toneRange(lo, hi - 1, "success")));
    };

    r.step(lineOf(code, "const a = [...nums];"), `A **reverse pair** is i < j with nums[i] > 2 · nums[j]. Like counting inversions, merge sort counts the pairs inside each half recursively and the pairs **across** halves at each merge — where both halves are sorted, so two pointers count them in linear time.`, { arrays: [{ name: "a", values: [...a] }], vars: { "reverse pairs": 0 } });
    sortCount(0, n);
    r.step(lineOf(code, "return sortCount(0, a.length);"), `**${total}** reverse pair${total === 1 ? "" : "s"}. Each level does a linear counting pass and a linear merge: **O(n log n)** time, **O(n)** space.`, { arrays: [{ name: "a (sorted)", values: [...a], tones: toneRange(0, n - 1, "success") }], vars: { "reverse pairs": total }, done: true });
    return r.frames;
  },
};

export default program;
