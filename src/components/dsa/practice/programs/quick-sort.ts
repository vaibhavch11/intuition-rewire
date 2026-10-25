import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function quickSort(nums, lo = 0, hi = nums.length - 1) {
  if (lo >= hi) return nums;                      // 0 or 1 values: nothing to do
  const p = partition(nums, lo, hi);
  quickSort(nums, lo, p - 1);                     // sort the smaller values...
  quickSort(nums, p + 1, hi);                     // ...and the bigger ones
  return nums;
}

function partition(nums, lo, hi) {
  const pivot = nums[hi];                         // Lomuto: the last value is the pivot
  let i = lo;                                     // nums[lo..i) are smaller than the pivot
  for (let j = lo; j < hi; j++) {
    if (nums[j] < pivot) {
      [nums[i], nums[j]] = [nums[j], nums[i]];
      i++;
    }
  }
  [nums[i], nums[hi]] = [nums[hi], nums[i]];      // the pivot lands in its final place
  return i;
}`;

const program: Program = {
  title: "Quick sort (Lomuto partition)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [10, 80, 30, 90, 40, 50, 70] } },
    { label: "Small", input: { nums: [3, 6, 1, 8, 2] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    const placed = new Set<number>();

    const view = (lo: number, hi: number, tones: Record<number, CellTone> = {}, marks: Record<string, number> = {}) => {
      const base: Record<number, CellTone> = {};
      for (let k = 0; k < n; k++) base[k] = placed.has(k) ? "done" : k < lo || k > hi ? "muted" : "idle";
      return { arrays: [{ name: "nums", values: [...nums], chart: true, tones: { ...base, ...tones }, pointers: pointersAt(n, marks, { i: "tertiary", pivot: "secondary" }) }] };
    };

    const sort = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) {
        placed.add(lo);
        return;
      }
      const pivot = nums[hi];
      let i = lo;
      r.step(lineOf(code, "const pivot = nums[hi];"), `Partition [${nums.slice(lo, hi + 1).join(", ")}] around the **pivot** ${pivot} (the last value): smaller values go to its left, the rest to its right.`, { ...view(lo, hi, { [hi]: "success" }, { i, pivot: hi }), vars: { pivot } });
      for (let j = lo; j < hi; j++) {
        if (nums[j] < pivot) {
          [nums[i], nums[j]] = [nums[j], nums[i]];
          i++;
          r.step(lineOf(code, "[nums[i], nums[j]] = [nums[j], nums[i]];"), `${nums[i - 1]} < ${pivot}: it belongs on the left. Swap it to index ${i - 1} and grow the smaller-than-pivot zone.`, { ...view(lo, hi, { ...toneRange(lo, i - 1, "primary"), [hi]: "success", [i - 1]: "write" }, { i, j, pivot: hi }), vars: { pivot } });
        } else {
          r.step(lineOf(code, "if (nums[j] < pivot)"), `${nums[j]} ≥ ${pivot}: it stays on the right side.`, { ...view(lo, hi, { ...toneRange(lo, i - 1, "primary"), [hi]: "success", [j]: "tertiary" }, { i, j, pivot: hi }), vars: { pivot } });
        }
      }
      [nums[i], nums[hi]] = [nums[hi], nums[i]];
      placed.add(i);
      r.step(lineOf(code, "[nums[i], nums[hi]] = [nums[hi], nums[i]];"), `Swap the pivot into index ${i}: everything left of it is smaller, everything right is not. ${pivot} is now in its **final place** — sort the two sides separately.`, { ...view(lo, hi, { ...toneRange(lo, i - 1, "primary"), [i]: "done" }), vars: { pivot } });
      sort(lo, i - 1);
      sort(i + 1, hi);
    };

    r.step(lineOf(code, "function quickSort(nums, lo = 0, hi = nums.length - 1)"), `Quick sort picks a **pivot**, moves smaller values before it and larger ones after it (**partition**), and then sorts each side the same way. Unlike merge sort, the work happens before the recursion, and it sorts **in place**.`, view(0, n - 1));
    sort(0, n - 1);
    r.step(lineOf(code, "return nums;"), `Sorted: **[${nums.join(", ")}]**. Each level of partitioning touches every value once; with pivots near the middle there are about log n levels: **O(n log n)** on average. A bad pivot every time (sorted input with this last-value pivot) gives **O(n²)**.`, { arrays: [{ name: "nums", values: [...nums], chart: true, tones: toneRange(0, n - 1, "success") }], done: true });
    return r.frames;
  },
};

export default program;
