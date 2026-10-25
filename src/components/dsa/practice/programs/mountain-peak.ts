import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function peakIndexInMountainArray(arr) {
  let low = 0;
  let high = arr.length - 1;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] < arr[mid + 1]) low = mid + 1;   // still climbing: the peak is to the right
    else high = mid;                              // going down: the peak is mid or to its left
  }
  return low;
}`;

const program: Program = {
  title: "Peak index in a mountain array",
  code,
  fields: [{ key: "arr", label: "arr (rises, then falls)", kind: "array", maxLength: 12, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { arr: [0, 2, 5, 8, 6, 3, 1] } },
    { label: "Long climb", input: { arr: [1, 3, 5, 7, 9, 11, 12, 4] } },
    { label: "Smallest", input: { arr: [0, 1, 0] } },
  ],
  check(input) {
    const arr = input.arr as number[];
    if (arr.length < 3) return "A mountain needs at least 3 values.";
    let i = 0;
    while (i + 1 < arr.length && arr[i] < arr[i + 1]) i++;
    if (i === 0 || i === arr.length - 1) return "The values must strictly rise to a peak, then strictly fall.";
    while (i + 1 < arr.length && arr[i] > arr[i + 1]) i++;
    return i === arr.length - 1 ? null : "The values must strictly rise to a peak, then strictly fall.";
  },
  run(input) {
    const arr = input.arr as number[];
    const n = arr.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [{ name: "arr", values: arr, chart: true, tones: { ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted"), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
    });

    r.step(lineOf(code, "let high = arr.length - 1;"), `The peak is somewhere in **0..${high}**. Comparing any value with its right neighbour tells which slope it's on.`, {
      ...view({}, { low, high }),
      vars: { low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const climbing = arr[mid] < arr[mid + 1];
      r.step(lineOf(code, "const mid = low + "), `mid = ${mid}: compare arr[${mid}] = ${arr[mid]} with its right neighbour ${arr[mid + 1]}.`, {
        ...view({ [mid]: "primary", [mid + 1]: "tertiary" }, { low, mid, high }),
        vars: { low, mid, high },
      });
      if (climbing) {
        low = mid + 1;
        r.step(lineOf(code, "if (arr[mid] < arr[mid + 1]) low = mid + 1;"), `${arr[mid]} < ${arr[mid + 1]}: still **climbing**, so the peak is to the right of ${mid}. \`low = ${low}\`.`, {
          ...view({}, { low, high }),
          vars: { low, high },
        });
      } else {
        high = mid;
        r.step(lineOf(code, "else high = mid;"), `${arr[mid]} > ${arr[mid + 1]}: **going down**, so the peak is ${mid} or to its left. \`high = ${high}\`.`, {
          ...view({}, { low, high }),
          vars: { low, high },
        });
      }
    }
    r.step(lineOf(code, "return low;"), `One index left: the peak is at index **${low}** (value ${arr[low]}). **O(log n)** comparisons.`, {
      arrays: [{ name: "arr", values: arr, chart: true, tones: { [low]: "success" }, pointers: pointersAt(n, { peak: low }) }],
      vars: { answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
