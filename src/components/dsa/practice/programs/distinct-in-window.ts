import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function countDistinct(arr, k) {
  const freq = new Map();                           // value -> count inside the window
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    freq.set(arr[i], (freq.get(arr[i]) ?? 0) + 1);  // the new element comes in
    if (i >= k) {
      const out = arr[i - k];                       // the element sliding out
      freq.set(out, freq.get(out) - 1);
      if (freq.get(out) === 0) freq.delete(out);    // no copies left: drop the key
    }
    if (i >= k - 1) result.push(freq.size);         // distinct = number of keys
  }
  return result;
}`;

const program: Program = {
  title: "Distinct elements in every window",
  code,
  fields: [
    { key: "arr", label: "arr", kind: "array", maxLength: 10, min: -20, max: 20 },
    { key: "k", label: "k", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "Example", input: { arr: [1, 2, 1, 3, 4, 2, 3], k: 4 } },
    { label: "Repeats", input: { arr: [4, 1, 1, 4, 4], k: 2 } },
    { label: "All same", input: { arr: [5, 5, 5, 5], k: 3 } },
  ],
  check(input) {
    return (input.k as number) > (input.arr as number[]).length ? "k can't be bigger than the array." : null;
  },
  run(input) {
    const arr = input.arr as number[];
    const k = input.k as number;
    const n = arr.length;
    const r = recorder();
    const freq = new Map<number, number>();
    const result: number[] = [];

    const arrView = (i: number, extra: Record<number, CellTone> = {}) => {
      const lo = Math.max(0, i - k + 1);
      return {
        name: "arr",
        values: arr,
        tones: { ...toneRange(lo, i, "primary"), ...extra },
        pointers: pointersAt(n, i - k + 1 >= 0 && k > 1 ? { start: lo, end: i } : { end: i }),
      };
    };
    const resultView = (fresh = false) => ({ name: "result", values: [...result], tones: fresh ? { [result.length - 1]: "success" as const } : {} });

    r.step(2, `Slide a window of **${k}** across the array and report how many **different** values each window holds. The map keeps **value → count inside the window**, so the answer is always just the number of keys.`, {
      arrays: [{ name: "arr", values: arr }, resultView()],
      maps: [mapView("freq", freq, { valueLabel: "count" })],
    });

    for (let i = 0; i < n; i++) {
      const x = arr[i];
      const before = freq.get(x);
      freq.set(x, (before ?? 0) + 1);
      const entered =
        before === undefined
          ? `${x} comes in on the right — a new key`
          : `${x} comes in on the right — already a key, so its count rises to ${before + 1}`;

      if (i >= k) {
        // One step: the new element enters and the oldest one leaves.
        const out = arr[i - k];
        const left = (freq.get(out) as number) - 1;
        if (left === 0) freq.delete(out);
        else freq.set(out, left);
        const marks: MapMark<number>[] =
          out === x ? [[x, "write", "in & out"]] : [[x, "write", before === undefined ? "new" : "+1"]];
        if (left > 0 && out !== x) marks.push([out, "tertiary", "−1"]);
        r.step(
          left === 0 ? 9 : 8,
          out === x
            ? `${x} comes in on the right and another ${x} slides out on the left: its count is unchanged, still ${freq.get(x)}.`
            : `${entered}. ${out} slides out on the left${left === 0 ? " — its last copy, so its count hits 0 and the key is **deleted** (otherwise freq.size would still count it)." : `; another copy is still inside, so its count drops to ${left}.`}`,
          {
            arrays: [arrView(i, { [i]: "write", [i - k]: "muted" }), resultView()],
            maps: [mapView("freq", freq, { valueLabel: "count", marks })],
            vars: { i, "distinct now": freq.size },
          }
        );
      } else if (i < k - 1) {
        r.step(5, `${entered}. The first window isn't full yet (${i + 1} of ${k}).`, {
          arrays: [arrView(i, { [i]: "write" }), resultView()],
          maps: [mapView("freq", freq, { valueLabel: "count", marks: [[x, "write", before === undefined ? "new" : "+1"]] })],
          vars: { i, "distinct now": freq.size },
        });
      }

      if (i >= k - 1) {
        result.push(freq.size);
        r.step(
          11,
          `${i === k - 1 ? `${entered}, filling the first window. ` : ""}Window [${i - k + 1}..${i}] = [${arr.slice(i - k + 1, i + 1).join(", ")}] holds **${freq.size}** distinct ${freq.size === 1 ? "value" : "values"} — read straight off the map's size.`,
          {
            arrays: [arrView(i), resultView(true)],
            maps: [mapView("freq", freq, { valueLabel: "count", marks: i === k - 1 ? [[x, "write"]] : [] })],
            vars: { i, distinct: freq.size },
          }
        );
      }
    }

    r.step(13, `Done: [${result.join(", ")}]. Each element entered once and left once, so the whole slide is **O(n)** instead of recounting every window.`, {
      arrays: [{ name: "arr", values: arr }, { name: "result", values: result, tones: toneRange(0, result.length - 1, "success") }],
      maps: [mapView("freq", freq, { valueLabel: "count" })],
      vars: { windows: result.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
