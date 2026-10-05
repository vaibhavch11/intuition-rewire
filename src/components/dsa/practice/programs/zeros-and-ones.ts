import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function maxLen(arr) {
  const first = new Map([[0, -1]]);              // balance -> first index it appeared
  let sum = 0, best = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i] === 0 ? -1 : 1;                 // a 0 counts as -1
    if (first.has(sum)) {
      best = Math.max(best, i - first.get(sum));  // same balance: equal 0s and 1s between
    } else {
      first.set(sum, i);
    }
  }
  return best;
}`;

const program: Program = {
  title: "Largest subarray of 0s and 1s (0 as −1)",
  code,
  fields: [{ key: "arr", label: "arr", kind: "array", maxLength: 12, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { arr: [1, 0, 1, 1, 1, 0, 0] } },
    { label: "Short", input: { arr: [0, 0, 1, 1, 0] } },
    { label: "Only 1s", input: { arr: [1, 1, 1] } },
  ],
  run(input) {
    const arr = input.arr as number[];
    const n = arr.length;
    const r = recorder();
    const first = new Map<number, number>([[0, -1]]);
    const signed: Scalar[] = arr.map((x) => (x === 0 ? "−1" : "+1"));
    const sums: Scalar[] = arr.map(() => null);
    let sum = 0;
    let best = 0;
    let bestFrom = -1;

    const views = (i: number, tones: Record<number, CellTone>, marks: MapMark<number>[] = []) => ({
      arrays: [
        { name: "arr", values: arr, tones, pointers: i >= 0 ? pointersAt(n, { i }) : {} },
        { name: "0 as −1, 1 as +1", values: signed, tones },
        { name: "balance (prefix sum of ±1)", values: [...sums], tones: i >= 0 ? { [i]: "primary" as const } : {} },
      ],
      maps: [mapView("first", first, { keyLabel: "balance", valueLabel: "index", marks })],
    });

    r.step(
      2,
      `Turn every **0 into −1**. A stretch with as many 0s as 1s then adds up to exactly **0** — so this is "Largest Subarray with 0 Sum" in disguise. Track the running sum (the **balance**) and the first index of each balance.`,
      { ...views(-1, {}), vars: { sum, best } }
    );

    for (let i = 0; i < n; i++) {
      sum += arr[i] === 0 ? -1 : 1;
      sums[i] = sum;
      const j = first.get(sum);
      if (j !== undefined) {
        const len = i - j;
        const better = len > best;
        if (better) {
          best = len;
          bestFrom = j + 1;
        }
        const part = arr.slice(j + 1, i + 1);
        r.step(
          7,
          `Balance ${sum} was first seen at index ${j}, so arr[${j + 1}..${i}] has ${part.filter((x) => x === 0).length} zeros and ${part.filter((x) => x === 1).length} ones — equal. Length ${len}${better ? `: best = **${best}**.` : `, best stays ${best}.`}`,
          { ...views(i, toneRange(j + 1, i, "success"), [[sum, "success", "seen"]]), vars: { i, balance: sum, best } }
        );
      } else {
        first.set(sum, i);
        r.step(
          9,
          `${arr[i]} counts as ${arr[i] === 0 ? "−1" : "+1"}: the balance is ${sum}, seen for the first time. Store ${sum} → ${i}.`,
          { ...views(i, { [i]: "primary" }, [[sum, "write", "new"]]), vars: { i, balance: sum, best } }
        );
      }
    }

    r.step(
      12,
      best === 0
        ? "The balance never repeated, so no stretch has equal 0s and 1s. The answer is **0**."
        : `The longest stretch with equal 0s and 1s is arr[${bestFrom}..${bestFrom + best - 1}], length **${best}** — found in one pass.`,
      { ...views(-1, best ? toneRange(bestFrom, bestFrom + best - 1, "success") : {}), vars: { best }, done: true }
    );
    return r.frames;
  },
};

export default program;
