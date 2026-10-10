import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function countZeroSum(arr) {
  const seen = new Map([[0, 1]]);               // prefix sum -> times seen so far
  let sum = 0, count = 0;
  for (const x of arr) {
    sum += x;
    count += seen.get(sum) ?? 0;                // each earlier equal sum = one zero-sum subarray
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
  }
  return count;
}`;

const program: Program = {
  title: "Count zero-sum subarrays (prefix sum counts)",
  code,
  fields: [{ key: "arr", label: "arr", kind: "array", maxLength: 10, min: -30, max: 30 }],
  examples: [
    { label: "Example", input: { arr: [15, -2, 2, -8, 1, 7, 10, 23] } },
    { label: "Zeros", input: { arr: [0, 0, 5, 5, 0, 0] } },
    { label: "Mixed", input: { arr: [6, -1, -3, 4, -2, 2, 4, 6, -12, -7] } },
  ],
  run(input) {
    const arr = input.arr as number[];
    const n = arr.length;
    const r = recorder();
    const seen = new Map<number, number>([[0, 1]]);
    const sums: Scalar[] = arr.map(() => null);
    // prefixAt[t + 1] is the prefix sum after index t; prefixAt[0] = 0 is the empty start.
    const prefixAt = [0];
    let sum = 0;
    let count = 0;

    const views = (i: number, tones: Record<number, CellTone>, marks: MapMark<number>[] = []) => ({
      arrays: [
        { name: "arr", values: arr, tones, pointers: i >= 0 ? pointersAt(n, { i }) : {} },
        { name: "prefix sum", values: [...sums], tones: i >= 0 ? { [i]: "primary" as const } : {} },
      ],
      maps: [mapView("seen", seen, { keyLabel: "sum", valueLabel: "times", marks })],
    });

    r.step(
      2,
      `A subarray adds up to 0 exactly when the prefix sum **before** it equals the prefix sum **at its end**. So at each index, every earlier time we saw the current sum is one zero-sum subarray ending here. The map counts sums; **0 → 1** is the empty start before index 0.`,
      { ...views(-1, {}), vars: { sum, count } }
    );

    for (let i = 0; i < n; i++) {
      sum += arr[i];
      sums[i] = sum;
      const times = seen.get(sum) ?? 0;
      const starts: number[] = [];
      prefixAt.forEach((p, t) => p === sum && starts.push(t)); // subarray starts at index t
      count += times;
      r.step(
        6,
        times === 0
          ? `Prefix sum ${sum} hasn't been seen before, so no zero-sum subarray ends at index ${i}. count stays ${count}.`
          : `Prefix sum ${sum} was seen **${times}** ${times === 1 ? "time" : "times"} before, so ${times} zero-sum ${times === 1 ? "subarray ends" : "subarrays end"} here: ${starts.map((t) => `arr[${t}..${i}]`).join(", ")}. count = **${count}**.`,
        {
          ...views(i, times ? toneRange(starts[0], i, "success") : { [i]: "primary" }, times ? [[sum, "success", `×${times}`]] : []),
          vars: { i, sum, count },
        }
      );
      seen.set(sum, times + 1);
      prefixAt.push(sum);
      r.step(7, `Record this prefix sum: seen[${sum}] = ${times + 1}. Later indexes that reach ${sum} again will pair with this spot too.`, {
        ...views(i, { [i]: "primary" }, [[sum, "write", times ? "+1" : "new"]]),
        vars: { i, sum, count },
      });
    }

    r.step(9, `Done: **${count}** zero-sum ${count === 1 ? "subarray" : "subarrays"}, counted in one pass without listing them all.`, {
      ...views(-1, {}),
      vars: { count },
      done: true,
    });
    return r.frames;
  },
};

export default program;
