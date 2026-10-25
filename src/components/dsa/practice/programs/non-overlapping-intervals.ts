import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function eraseOverlapIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);   // by end time
  let kept = 0, lastEnd = -Infinity;
  for (const [start, end] of sorted) {
    if (start >= lastEnd) {          // fits after the last kept interval: keep it
      kept++;
      lastEnd = end;
    }                                // otherwise it overlaps: remove it
  }
  return sorted.length - kept;
}`;

const show = (p: number[]) => `${p[0]},${p[1]}`;

const program: Program = {
  title: "Non-overlapping intervals (greedy by end time)",
  code,
  fields: [{ key: "intervals", label: "intervals", kind: "pairs", maxLength: 8, min: -50, max: 99 }],
  examples: [
    { label: "Example", input: { intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] } },
    { label: "All the same", input: { intervals: [[1, 2], [1, 2], [1, 2]] } },
    { label: "One long", input: { intervals: [[1, 100], [11, 22], [1, 11], [2, 12]] } },
  ],
  run(input) {
    const sorted = (input.intervals as number[][]).map((p) => [...p]).sort((a, b) => a[1] - b[1]);
    const n = sorted.length;
    const r = recorder();
    const values = sorted.map(show);
    const fate: Record<number, CellTone> = {};
    let kept = 0;
    let lastEnd = -Infinity;

    r.step(lineOf(code, "const sorted = "), `To remove as few intervals as possible, **keep** as many non-overlapping ones as possible. Sort by **end time**: the interval that ends first leaves the most room for the rest, so it's always safe to keep it.`, {
      arrays: [{ name: "intervals (by end)", values }],
    });
    sorted.forEach(([start, end], i) => {
      if (start >= lastEnd) {
        kept++;
        const prev = lastEnd;
        lastEnd = end;
        fate[i] = "success";
        r.step(lineOf(code, "kept++;"), `[${values[i]}] starts at ${start}${prev === -Infinity ? " — it's the first" : `, not before the last kept end ${prev}`}: **keep** it. Nothing kept later may start before ${end}.`, {
          arrays: [{ name: "intervals (by end)", values, tones: { ...fate }, pointers: pointersAt(n, { i }) }],
          vars: { kept, lastEnd },
        });
      } else {
        fate[i] = "muted";
        r.step(lineOf(code, "if (start >= lastEnd)"), `[${values[i]}] starts at ${start}, before ${lastEnd}: it overlaps a kept interval. **Remove** it — keeping it instead could only end later.`, {
          arrays: [{ name: "intervals (by end)", values, tones: { ...fate, [i]: "write" }, pointers: pointersAt(n, { i }) }],
          vars: { kept, lastEnd },
        });
      }
    });
    r.step(lineOf(code, "return sorted.length - kept;"), `Kept ${kept} of ${n}, so remove **${n - kept}**. Sort plus one pass: **O(n log n)** time, O(1) extra besides the sort.`, {
      arrays: [{ name: "intervals (by end)", values, tones: fate }],
      vars: { kept, removed: n - kept },
      done: true,
    });
    return r.frames;
  },
};

export default program;
