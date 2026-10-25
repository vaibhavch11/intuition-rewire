import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function findClosestElements(arr, k, x) {
  let low = 0;
  let high = arr.length - k;                 // the window arr[s..s+k-1] starts somewhere in 0..n-k
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (x - arr[mid] > arr[mid + k] - x) low = mid + 1;   // arr[mid + k] is closer: start later
    else high = mid;                                     // arr[mid] is at least as close: start here or earlier
  }
  return arr.slice(low, low + k);
}`;

const program: Program = {
  title: "Find k closest elements (binary search the window's start)",
  code,
  fields: [
    { key: "arr", label: "arr (sorted)", kind: "array", maxLength: 12, min: -99, max: 99 },
    { key: "k", label: "k", kind: "number", min: 1, max: 12 },
    { key: "x", label: "x", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Example", input: { arr: [1, 3, 5, 8, 9, 12], k: 3, x: 7 } },
    { label: "Tie", input: { arr: [1, 2, 3, 4, 5], k: 4, x: 3 } },
    { label: "x below all", input: { arr: [1, 1, 2, 3, 4, 5], k: 4, x: -1 } },
  ],
  check(input) {
    const arr = input.arr as number[];
    for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i - 1]) return "arr must be sorted.";
    return (input.k as number) <= arr.length ? null : "k can't be bigger than the array.";
  },
  run(input) {
    const arr = input.arr as number[];
    const k = input.k as number;
    const x = input.x as number;
    const n = arr.length;
    const r = recorder();
    let low = 0;
    let high = n - k;
    const window = (s: number, tone: CellTone) => toneRange(s, s + k - 1, tone);

    r.step(lineOf(code, "let high = arr.length - k;"), `The ${k} closest values to ${x} sit side by side, so the answer is a window of ${k}. It can start anywhere in **${low}..${high}**.`, {
      arrays: [{ name: "arr", values: arr, pointers: pointersAt(n, { low, high }, { high: "tertiary" }) }],
      vars: { k, x, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const leftGap = x - arr[mid];
      const rightGap = arr[mid + k] - x;
      r.step(lineOf(code, "const mid = low + "), `Try starting at **mid = ${mid}**: the window is arr[${mid}..${mid + k - 1}]. Starting one later would swap arr[${mid}] = ${arr[mid]} out for arr[${mid + k}] = ${arr[mid + k]}. Compare x − arr[mid] = ${leftGap} with arr[mid + k] − x = ${rightGap}.`, {
        arrays: [{ name: "arr", values: arr, tones: { ...window(mid, "primary"), [mid]: "write", [mid + k]: "tertiary" }, pointers: pointersAt(n, { low, mid, high }, { mid: "secondary", high: "tertiary" }) }],
        vars: { k, x, low, mid, high, "x - arr[mid]": leftGap, "arr[mid+k] - x": rightGap },
      });
      if (leftGap > rightGap) {
        low = mid + 1;
        r.step(lineOf(code, "if (x - arr[mid] > arr[mid + k] - x) low = mid + 1;"), `${leftGap} > ${rightGap}: ${arr[mid + k]} is closer to ${x} than ${arr[mid]}, so the window should start later. \`low = ${low}\`.`, {
          arrays: [{ name: "arr", values: arr, pointers: pointersAt(n, { low, high }, { high: "tertiary" }) }],
          vars: { k, x, low, high },
        });
      } else {
        high = mid;
        r.step(lineOf(code, "else high = mid;"), `${leftGap} <= ${rightGap}: ${arr[mid]} is at least as close as ${arr[mid + k]} (ties keep the smaller value), so start ${mid} or earlier. \`high = ${high}\`.`, {
          arrays: [{ name: "arr", values: arr, pointers: pointersAt(n, { low, high }, { high: "tertiary" }) }],
          vars: { k, x, low, high },
        });
      }
    }
    const answer = arr.slice(low, low + k);
    r.step(lineOf(code, "return arr.slice(low, low + k);"), `The window starts at ${low}: the ${k} closest values to ${x} are **[${answer.join(", ")}]**. **O(log(n − k) + k)**.`, {
      arrays: [{ name: "arr", values: arr, tones: window(low, "success"), pointers: pointersAt(n, { start: low }) }],
      vars: { k, x, start: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
