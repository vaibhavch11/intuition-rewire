import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function findKthPositive(arr, k) {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] - (mid + 1) < k) low = mid + 1;   // fewer than k missing before arr[mid]
    else high = mid;
  }
  return low + k;                         // low array values and k missing numbers come first
}`;

/** 1st, 2nd, 3rd, 4th, 11th, 21st, ... */
const ord = (k: number) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][k % 10] ?? "th")}`;

const program: Program = {
  title: "Kth missing positive number (binary search on the missing count)",
  code,
  fields: [
    { key: "arr", label: "arr (strictly increasing, positive)", kind: "array", maxLength: 10, min: 1, max: 99 },
    { key: "k", label: "k", kind: "number", min: 1, max: 99 },
  ],
  examples: [
    { label: "Example", input: { arr: [2, 3, 4, 7, 11], k: 5 } },
    { label: "Past the end", input: { arr: [1, 2, 3, 4], k: 2 } },
    { label: "Before the start", input: { arr: [5, 6, 7], k: 3 } },
  ],
  check(input) {
    const arr = input.arr as number[];
    for (let i = 1; i < arr.length; i++) if (arr[i] <= arr[i - 1]) return "arr must be strictly increasing.";
    return null;
  },
  run(input) {
    const arr = input.arr as number[];
    const k = input.k as number;
    const n = arr.length;
    const r = recorder();
    const missing = arr.map((v, i) => v - (i + 1));
    let low = 0;
    let high = n;
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => {
      const outside = { ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted") };
      return {
        arrays: [
          { name: "arr", values: arr, tones: { ...outside, ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) },
          { name: "missing before arr[i]", values: missing, tones: { ...outside, ...tones } },
        ],
      };
    };

    r.step(lineOf(code, "let high = arr.length;"), `Below arr[i] there would be i + 1 values if none were missing, so **arr[i] − (i + 1)** are missing. Those counts never go down — binary search them for the first index with at least ${k} missing (or ${n}, past the end).`, {
      ...view({}, { low, high }),
      vars: { k, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const few = missing[mid] < k;
      r.step(lineOf(code, "const mid = low + "), `mid = ${mid}: arr[${mid}] = ${arr[mid]}, so **${missing[mid]}** number${missing[mid] === 1 ? " is" : "s are"} missing before it — ${few ? `fewer than ${k}` : `at least ${k}`}.`, {
        ...view({ [mid]: "primary" }, { low, mid, high }),
        vars: { k, low, mid, high },
      });
      if (few) {
        low = mid + 1;
        r.step(lineOf(code, "if (arr[mid] - (mid + 1) < k) low = mid + 1;"), `Not enough missing yet: the ${ord(k)} missing number is beyond arr[${mid}]. \`low = ${low}\`.`, {
          ...view({}, { low, high }),
          vars: { k, low, high },
        });
      } else {
        high = mid;
        r.step(lineOf(code, "else high = mid;"), `Already ${missing[mid]} missing before arr[${mid}], so the ${ord(k)} missing comes before it. Index ${mid} might be the first such index: \`high = ${high}\`.`, {
          ...view({}, { low, high }),
          vars: { k, low, high },
        });
      }
    }
    const answer = low + k;
    r.step(lineOf(code, "return low + k;"), `low = ${low}: the answer comes after ${low} array value${low === 1 ? "" : "s"} and ${k} missing numbers, so it's ${low} + ${k} = **${answer}**. **O(log n)**.`, {
      arrays: [
        { name: "arr", values: arr, tones: { ...toneRange(0, low - 1, "done") }, pointers: pointersAt(n, { low }) },
        { name: "missing before arr[i]", values: missing, tones: low < n ? { [low]: "success" } : {} },
      ],
      vars: { k, low, answer },
      done: true,
    });
    return r.frames;
  },
};

export default program;
