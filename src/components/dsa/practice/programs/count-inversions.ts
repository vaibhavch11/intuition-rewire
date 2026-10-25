import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function countInversions(nums) {
  const a = [...nums];
  const sortCount = (lo, hi) => {                 // sorts a[lo..hi), returns the inversions inside it
    if (hi - lo <= 1) return 0;
    const mid = (lo + hi) >> 1;
    let count = sortCount(lo, mid) + sortCount(mid, hi);
    const merged = [];
    let i = lo, j = mid;
    while (i < mid && j < hi) {
      if (a[i] <= a[j]) merged.push(a[i++]);
      else {
        count += mid - i;                         // a[j] is smaller than everything left in the left half
        merged.push(a[j++]);
      }
    }
    while (i < mid) merged.push(a[i++]);
    while (j < hi) merged.push(a[j++]);
    for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];
    return count;
  };
  return sortCount(0, a.length);
}`;

const program: Program = {
  title: "Count inversions (merge sort that counts)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [2, 4, 1, 3, 5] } },
    { label: "Reversed", input: { nums: [5, 4, 3, 2, 1] } },
    { label: "Sorted", input: { nums: [1, 2, 3, 4] } },
  ],
  run(input) {
    const a = [...(input.nums as number[])];
    const n = a.length;
    const r = recorder();
    let total = 0;

    const view = (lo: number, hi: number, tones: Record<number, CellTone>, marks: Record<string, number> = {}, merged: number[] | null = null) => {
      const base: Record<number, CellTone> = {};
      for (let k = 0; k < n; k++) if (k < lo || k >= hi) base[k] = "muted";
      return {
        arrays: [{ name: "a", values: [...a], tones: { ...base, ...tones }, pointers: pointersAt(n, marks, { j: "tertiary" }) }, ...(merged ? [{ name: "merged", values: [...merged] }] : [])],
        vars: { inversions: total },
      };
    };

    const sortCount = (lo: number, hi: number): void => {
      if (hi - lo <= 1) return;
      const mid = (lo + hi) >> 1;
      sortCount(lo, mid);
      sortCount(mid, hi);
      const merged: number[] = [];
      let i = lo;
      let j = mid;
      r.step(lineOf(code, "let i = lo, j = mid;"), `Both halves are sorted: [${a.slice(lo, mid).join(", ")}] and [${a.slice(mid, hi).join(", ")}]. While merging, every time a value is taken from the **right** half, it jumps ahead of all the values still waiting on the left — each of those pairs is an inversion.`, view(lo, hi, { ...toneRange(lo, mid - 1, "primary"), ...toneRange(mid, hi - 1, "tertiary") }, { i, j }, merged));
      while (i < mid && j < hi) {
        if (a[i] <= a[j]) {
          merged.push(a[i++]);
          r.step(lineOf(code, "if (a[i] <= a[j]) merged.push(a[i++]);"), `${a[i - 1]} ≤ ${a[j]}: take it from the left. No inversion.`, view(lo, hi, { ...toneRange(i, mid - 1, "primary"), ...toneRange(j, hi - 1, "tertiary") }, i < mid ? { i, j } : { j }, merged));
        } else {
          const jumped = mid - i;
          total += jumped;
          merged.push(a[j++]);
          r.step(lineOf(code, "count += mid - i;"), `${a[j - 1]} < ${a[i]}: take it from the right. It's smaller than all **${jumped}** value${jumped === 1 ? "" : "s"} left in the left half (${a.slice(i, mid).join(", ")}) — that many inversions.`, view(lo, hi, { ...toneRange(i, mid - 1, "write"), ...toneRange(j, hi - 1, "tertiary") }, j < hi ? { i, j } : { i }, merged));
        }
      }
      while (i < mid) merged.push(a[i++]);
      while (j < hi) merged.push(a[j++]);
      for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];
      r.step(lineOf(code, "for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];"), `Copy the rest and write [${merged.join(", ")}] back, sorted.`, view(lo, hi, toneRange(lo, hi - 1, "success")));
    };

    r.step(lineOf(code, "const a = [...nums];"), `An **inversion** is a pair i < j with nums[i] > nums[j]. Merge sort can count them while it sorts: inversions inside each half are counted by the recursive calls, and the ones **across** the two halves while merging.`, { arrays: [{ name: "a", values: [...a] }], vars: { inversions: 0 } });
    sortCount(0, n);
    r.step(lineOf(code, "return sortCount(0, a.length);"), `**${total}** inversion${total === 1 ? "" : "s"}. Merge sort's O(n log n), with one extra addition per merge step: **O(n log n)** time, **O(n)** space.`, { arrays: [{ name: "a (sorted)", values: [...a], tones: toneRange(0, n - 1, "success") }], vars: { inversions: total }, done: true });
    return r.frames;
  },
};

export default program;
