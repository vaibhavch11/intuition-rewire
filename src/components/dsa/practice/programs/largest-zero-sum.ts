import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function maxLen(arr) {
  const first = new Map([[0, -1]]);              // prefix sum -> first index it appeared
  let sum = 0, best = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (first.has(sum)) {
      best = Math.max(best, i - first.get(sum));  // same sum again: zero in between
    } else {
      first.set(sum, i);                          // remember only the FIRST index
    }
  }
  return best;
}`;

const program: Program = {
  title: "Largest zero-sum subarray (first index of each prefix sum)",
  code,
  fields: [{ key: "arr", label: "arr", kind: "array", maxLength: 10, min: -30, max: 30 }],
  examples: [
    { label: "Example", input: { arr: [15, -2, 2, -8, 1, 7, 10, 23] } },
    { label: "Whole array", input: { arr: [1, 2, -3, 3, -1, -2] } },
    { label: "None", input: { arr: [1, 2, 3] } },
    { label: "Zeros", input: { arr: [0, 4, 0, 0] } },
  ],
  run(input) {
    const arr = input.arr as number[];
    const n = arr.length;
    const r = recorder();
    const first = new Map<number, number>([[0, -1]]);
    const sums: Scalar[] = arr.map(() => null);
    let sum = 0;
    let best = 0;
    let bestFrom = -1;

    const views = (i: number, tones: Record<number, CellTone>, marks: MapMark<number>[] = []) => ({
      arrays: [
        { name: "arr", values: arr, tones, pointers: i >= 0 ? pointersAt(n, { i }) : {} },
        { name: "prefix sum (arr[0] + … + arr[i])", values: [...sums], tones: i >= 0 ? { [i]: "primary" as const } : {} },
      ],
      maps: [mapView("first", first, { keyLabel: "sum", valueLabel: "index", marks })],
    });

    r.step(
      2,
      `Walk left to right keeping a running **prefix sum**. If the same sum shows up twice, everything **between** the two spots must add up to 0. The map remembers where each sum appeared first; **0 → −1** stands for the empty start before index 0.`,
      { ...views(-1, {}), vars: { sum, best } }
    );

    for (let i = 0; i < n; i++) {
      sum += arr[i];
      sums[i] = sum;
      const j = first.get(sum);
      if (j !== undefined) {
        const len = i - j;
        const better = len > best;
        if (better) {
          best = len;
          bestFrom = j + 1;
        }
        r.step(
          7,
          `Prefix sum ${sum} again! It was first seen at index ${j}${j === -1 ? " (the empty start)" : ""}, so arr[${j + 1}..${i}] = [${arr.slice(j + 1, i + 1).join(", ")}] adds up to **0**. Length ${i} − (${j}) = ${len}${better ? ` — the longest so far, best = **${best}**.` : `, not longer than best = ${best}.`} The map is **not** updated: keeping the earliest index keeps future subarrays as long as possible.`,
          {
            ...views(i, toneRange(j + 1, i, "success"), [[sum, "success", "seen"]]),
            vars: { i, sum, best },
          }
        );
      } else {
        first.set(sum, i);
        r.step(
          9,
          `Prefix sum ${sum} is new. Remember it with index ${i}: if ${sum} appears again later, the part right after index ${i} sums to 0.`,
          { ...views(i, { [i]: "primary" }, [[sum, "write", "new"]]), vars: { i, sum, best } }
        );
      }
    }

    r.step(
      12,
      best === 0
        ? "No prefix sum ever repeated, so no subarray adds up to 0. The answer is **0**."
        : `Done in one pass: the longest zero-sum subarray is arr[${bestFrom}..${bestFrom + best - 1}] = [${arr.slice(bestFrom, bestFrom + best).join(", ")}], length **${best}**.`,
      { ...views(-1, best ? toneRange(bestFrom, bestFrom + best - 1, "success") : {}), vars: { best }, done: true }
    );
    return r.frames;
  },
};

export default program;
