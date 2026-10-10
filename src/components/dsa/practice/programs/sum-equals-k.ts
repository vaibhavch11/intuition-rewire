import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);               // prefix sum -> times seen so far
  let sum = 0, count = 0;
  for (const x of nums) {
    sum += x;
    count += seen.get(sum - k) ?? 0;            // an earlier prefix of sum - k leaves exactly k
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
  }
  return count;
}`;

const program: Program = {
  title: "Subarray sum equals k (prefix sum counts)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10, min: -20, max: 20 },
    { key: "k", label: "k", kind: "number", min: -50, max: 50 },
  ],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3], k: 3 } },
    { label: "Repeats", input: { nums: [1, 1, 1], k: 2 } },
    { label: "Negatives", input: { nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const n = nums.length;
    const r = recorder();
    const seen = new Map<number, number>([[0, 1]]);
    const sums: Scalar[] = nums.map(() => null);
    const prefixAt = [0]; // prefixAt[t] = sum of nums[0..t-1]
    let sum = 0;
    let count = 0;

    const views = (i: number, tones: Record<number, CellTone>, marks: MapMark<number>[] = []) => ({
      arrays: [
        { name: "nums", values: nums, tones, pointers: i >= 0 ? pointersAt(n, { i }) : {} },
        { name: "prefix sum", values: [...sums], tones: i >= 0 ? { [i]: "primary" as const } : {} },
      ],
      maps: [mapView("seen", seen, { keyLabel: "sum", valueLabel: "times", marks })],
    });

    r.step(
      2,
      `sum(nums[a..i]) = prefix(i) − prefix(before a). For that to be **${k}**, the earlier prefix must be **prefix(i) − ${k}**. So at each index, look up how many times sum − k has been seen. **0 → 1** is the empty start, for subarrays that begin at index 0.`,
      { ...views(-1, {}), vars: { k, sum, count } }
    );

    for (let i = 0; i < n; i++) {
      sum += nums[i];
      sums[i] = sum;
      const want = sum - k;
      const times = seen.get(want) ?? 0;
      const starts: number[] = [];
      prefixAt.forEach((p, t) => p === want && starts.push(t));
      count += times;
      r.step(
        6,
        times === 0
          ? `sum = ${sum}, so we need an earlier prefix of ${sum} − ${k} = **${want}**. None yet: no subarray ending at ${i} adds up to ${k}.`
          : `sum = ${sum}, so we need an earlier prefix of ${sum} − ${k} = **${want}**, seen ${times} ${times === 1 ? "time" : "times"}: ${starts.map((t) => `nums[${t}..${i}]`).join(", ")} ${times === 1 ? "adds" : "each add"} up to ${k}. count = **${count}**.`,
        {
          ...views(i, times ? toneRange(starts[starts.length - 1], i, "success") : { [i]: "primary" }, times ? [[want, "success", `×${times}`]] : []),
          vars: { i, sum, "sum − k": want, count },
        }
      );
      seen.set(sum, (seen.get(sum) ?? 0) + 1);
      prefixAt.push(sum);
      r.step(7, `Store the current prefix: seen[${sum}] = ${seen.get(sum)}. Later indexes may need it.`, {
        ...views(i, { [i]: "primary" }, [[sum, "write", seen.get(sum) === 1 ? "new" : "+1"]]),
        vars: { i, sum, count },
      });
    }

    r.step(9, `Done: **${count}** ${count === 1 ? "subarray adds" : "subarrays add"} up to ${k}. One pass, O(n) — negatives are fine, unlike a sliding window.`, {
      ...views(-1, {}),
      vars: { k, count },
      done: true,
    });
    return r.frames;
  },
};

export default program;
