import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);   // search the shorter one
  const m = nums1.length, n = nums2.length;
  const half = Math.floor((m + n + 1) / 2);      // how many values go in the left half
  let low = 0, high = m;
  while (low <= high) {
    const i = Math.floor((low + high) / 2);      // take i values from nums1 ...
    const j = half - i;                          // ... and the rest from nums2
    const left1 = i > 0 ? nums1[i - 1] : -Infinity;
    const right1 = i < m ? nums1[i] : Infinity;
    const left2 = j > 0 ? nums2[j - 1] : -Infinity;
    const right2 = j < n ? nums2[j] : Infinity;
    if (left1 <= right2 && left2 <= right1) {    // every left value <= every right value
      if ((m + n) % 2 === 1) return Math.max(left1, left2);
      return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;
    }
    if (left1 > right2) high = i - 1;            // took too many from nums1
    else low = i + 1;                            // took too few from nums1
  }
}`;

const show = (v: number) => (v === Infinity ? "+∞" : v === -Infinity ? "−∞" : String(v));
const isSorted = (a: number[]) => a.every((v, i) => i === 0 || v >= a[i - 1]);

const program: Program = {
  title: "Median of two sorted arrays (binary search the cut)",
  code,
  fields: [
    { key: "nums1", label: "nums1 (sorted)", kind: "array", maxLength: 8, min: -99, max: 99 },
    { key: "nums2", label: "nums2 (sorted)", kind: "array", maxLength: 8, min: -99, max: 99 },
  ],
  examples: [
    { label: "Odd total", input: { nums1: [1, 3, 8, 9], nums2: [2, 4, 5, 7, 10] } },
    { label: "Even total", input: { nums1: [1, 2], nums2: [3, 4] } },
    { label: "Shorter second", input: { nums1: [2, 6, 9, 12, 15], nums2: [1, 20] } },
  ],
  check(input) {
    const a = input.nums1 as number[];
    const b = input.nums2 as number[];
    if (!isSorted(a) || !isSorted(b)) return "Both arrays must be sorted.";
    return a.length + b.length ? null : "At least one array needs a value.";
  },
  run(input) {
    let nums1 = input.nums1 as number[];
    let nums2 = input.nums2 as number[];
    const r = recorder();
    if (nums1.length > nums2.length) {
      [nums1, nums2] = [nums2, nums1];
      r.step(lineOf(code, "if (nums1.length > nums2.length)"), `nums1 is the longer array, so swap them: search the cut in the **shorter** one, [${nums1.join(", ")}], so the cut in the other always stays in range.`, {
        arrays: [{ name: "nums1", values: nums1 }, { name: "nums2", values: nums2 }],
      });
    }
    const m = nums1.length;
    const n = nums2.length;
    const half = Math.floor((m + n + 1) / 2);
    let low = 0;
    let high = m;
    const view = (i: number, j: number, ok: boolean | null) => {
      const t1: Record<number, CellTone> = { ...toneRange(0, i - 1, "done") };
      const t2: Record<number, CellTone> = { ...toneRange(0, j - 1, "done") };
      const edge: CellTone = ok === null ? "primary" : ok ? "success" : "tertiary";
      if (i > 0) t1[i - 1] = edge;
      if (i < m) t1[i] = edge;
      if (j > 0) t2[j - 1] = edge;
      if (j < n) t2[j] = edge;
      return [
        { name: "nums1", values: nums1, tones: t1, pointers: pointersAt(m, { "cut i": i }) },
        { name: "nums2", values: nums2, tones: t2, pointers: pointersAt(n, { "cut j": j }, { "cut j": "tertiary" }) },
      ];
    };

    r.step(lineOf(code, "const half = "), `${m + n} values in all, so the left half gets **${half}**. If it takes i values from nums1, it takes ${half} − i from nums2. Search i in **0..${m}**.`, {
      arrays: [{ name: "nums1", values: nums1 }, { name: "nums2", values: nums2 }],
      vars: { m, n, half, low, high },
    });
    while (low <= high) {
      const i = Math.floor((low + high) / 2);
      const j = half - i;
      const left1 = i > 0 ? nums1[i - 1] : -Infinity;
      const right1 = i < m ? nums1[i] : Infinity;
      const left2 = j > 0 ? nums2[j - 1] : -Infinity;
      const right2 = j < n ? nums2[j] : Infinity;
      const ok = left1 <= right2 && left2 <= right1;
      r.step(lineOf(code, "const right2 = "), `Try **i = ${i}**, j = ${half} − ${i} = ${j}. Around the cuts: left1 = ${show(left1)}, right1 = ${show(right1)}, left2 = ${show(left2)}, right2 = ${show(right2)}.`, {
        arrays: view(i, j, null),
        vars: { low, high, i, j, left1: show(left1), right1: show(right1), left2: show(left2), right2: show(right2) },
      });
      if (ok) {
        const odd = (m + n) % 2 === 1;
        const answer = odd ? Math.max(left1, left2) : (Math.max(left1, left2) + Math.min(right1, right2)) / 2;
        r.step(lineOf(code, odd ? "if ((m + n) % 2 === 1) return Math.max(left1, left2);" : "return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;"), `${show(left1)} <= ${show(right2)} and ${show(left2)} <= ${show(right1)}: every left value is at most every right value — the right cut. ${odd ? `Odd total: the median is the largest left value` : `Even total: average the largest left and smallest right`}, **${answer}**. **O(log min(m, n))**.`, {
          arrays: view(i, j, true),
          vars: { i, j, median: answer },
          done: true,
        });
        return r.frames;
      }
      if (left1 > right2) {
        high = i - 1;
        r.step(lineOf(code, "if (left1 > right2) high = i - 1;"), `left1 = ${show(left1)} > right2 = ${show(right2)}: too many values came from nums1. Take fewer — \`high = ${high}\`.`, {
          arrays: view(i, j, false),
          vars: { low, high },
        });
      } else {
        low = i + 1;
        r.step(lineOf(code, "else low = i + 1;"), `left2 = ${show(left2)} > right1 = ${show(right1)}: too few values came from nums1. Take more — \`low = ${low}\`.`, {
          arrays: view(i, j, false),
          vars: { low, high },
        });
      }
    }
    r.step(lineOf(code, "while (low <= high) {"), "No valid cut — the inputs weren't sorted. Return **NaN**.", { done: true });
    return r.frames;
  },
};

export default program;
