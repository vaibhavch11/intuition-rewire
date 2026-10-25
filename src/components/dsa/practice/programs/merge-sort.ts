import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type ArrayView, type CellTone, type Program } from "../types";

const code = `function mergeSort(nums) {
  if (nums.length <= 1) return nums;              // one value is already sorted
  const mid = Math.floor(nums.length / 2);
  const left = mergeSort(nums.slice(0, mid));     // sort each half...
  const right = mergeSort(nums.slice(mid));
  return merge(left, right);                      // ...then merge them
}

function merge(left, right) {
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) out.push(left[i++]);   // <= keeps equal values in order: stable
    else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}`;

const program: Program = {
  title: "Merge sort",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [38, 27, 43, 3, 9, 82, 10] } },
    { label: "Four values", input: { nums: [4, 1, 3, 2] } },
  ],
  run(input) {
    // The simulator sorts nums[lo, hi) in place so every sub-array keeps its position on screen.
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    const sortedRanges: [number, number][] = [];

    const view = (lo: number, hi: number, tones: Record<number, CellTone> = {}, extra: ArrayView[] = []) => {
      const base: Record<number, CellTone> = {};
      for (const [a, b] of sortedRanges) Object.assign(base, toneRange(a, b - 1, "done"));
      for (let k = 0; k < n; k++) if (k < lo || k >= hi) base[k] = base[k] ?? "muted";
      return { arrays: [{ name: "nums", values: [...nums], tones: { ...base, ...tones } }, ...extra] };
    };

    const sort = (lo: number, hi: number, depth: number) => {
      if (hi - lo <= 1) {
        sortedRanges.push([lo, hi]);
        return;
      }
      const mid = lo + Math.floor((hi - lo) / 2);
      r.step(lineOf(code, "const mid = Math.floor(nums.length / 2);"), `Split [${nums.slice(lo, hi).join(", ")}] into [${nums.slice(lo, mid).join(", ")}] and [${nums.slice(mid, hi).join(", ")}], and sort each half first.`, {
        ...view(lo, hi, { ...toneRange(lo, mid - 1, "primary"), ...toneRange(mid, hi - 1, "tertiary") }),
        vars: { depth },
      });
      sort(lo, mid, depth + 1);
      sort(mid, hi, depth + 1);
      const left = nums.slice(lo, mid);
      const right = nums.slice(mid, hi);
      const out: number[] = [];
      let i = 0;
      let j = 0;
      const mergeView = (note: string, line: string) =>
        r.step(lineOf(code, line), note, {
          ...view(lo, hi, toneRange(lo, hi - 1, "primary"), [
            { name: "left", values: left, tones: toneRange(0, i - 1, "muted"), pointers: pointersAt(left.length, { i }) },
            { name: "right", values: right, tones: toneRange(0, j - 1, "muted"), pointers: pointersAt(right.length, { j }, { j: "tertiary" }) },
            { name: "out", values: [...out], tones: out.length ? { [out.length - 1]: "write" } : {} },
          ]),
          vars: { depth },
        });
      mergeView(`Both halves are sorted: [${left.join(", ")}] and [${right.join(", ")}]. **Merge** them by repeatedly taking the smaller front value.`, "function merge(left, right)");
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
          out.push(left[i++]);
          mergeView(`${left[i - 1]} ≤ ${right[j]}: take ${left[i - 1]} from the left.`, "if (left[i] <= right[j]) out.push(left[i++])");
        } else {
          out.push(right[j++]);
          mergeView(`${right[j - 1]} < ${left[i]}: take ${right[j - 1]} from the right.`, "else out.push(right[j++])");
        }
      }
      if (i < left.length || j < right.length) {
        const fromLeft = i < left.length;
        const rest = fromLeft ? left.slice(i) : right.slice(j);
        out.push(...rest);
        i = left.length;
        j = right.length;
        mergeView(`One side is empty: copy the rest (${rest.join(", ")}) as it is.`, fromLeft ? "while (i < left.length) out.push(left[i++])" : "while (j < right.length) out.push(right[j++])");
      }
      for (let k = 0; k < out.length; k++) nums[lo + k] = out[k];
      for (let s = sortedRanges.length - 1; s >= 0; s--) if (sortedRanges[s][0] >= lo && sortedRanges[s][1] <= hi) sortedRanges.splice(s, 1);
      sortedRanges.push([lo, hi]);
      r.step(lineOf(code, "return merge(left, right);"), `[${out.join(", ")}] is sorted and goes back in place.`, { ...view(lo, hi, toneRange(lo, hi - 1, "success")), vars: { depth } });
    };

    r.step(lineOf(code, "function mergeSort(nums)"), `Merge sort is **divide and conquer**: split the array in half, sort each half the same way, then **merge** the two sorted halves. A single value is already sorted.`, view(0, n));
    sort(0, n, 0);
    r.step(lineOf(code, "if (nums.length <= 1) return nums;"), `Sorted: **[${nums.join(", ")}]**. There are about log₂ n levels of halving, and each level merges all n values: **O(n log n)** time in every case, with **O(n)** extra space for the merged arrays.`, { arrays: [{ name: "nums", values: [...nums], tones: toneRange(0, n - 1, "success") }], done: true });
    return r.frames;
  },
};

export default program;
