import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function minimumAbsDifference(arr) {
  const a = [...arr].sort((x, y) => x - y);
  let best = Infinity;
  for (let i = 1; i < a.length; i++) best = Math.min(best, a[i] - a[i - 1]);   // the closest pair is always adjacent
  const pairs = [];
  for (let i = 1; i < a.length; i++) {
    if (a[i] - a[i - 1] === best) pairs.push([a[i - 1], a[i]]);
  }
  return pairs;
}`;

const program: Program = {
  title: "Minimum absolute difference (sort, then adjacent gaps)",
  code,
  fields: [{ key: "arr", label: "arr (distinct)", kind: "array", maxLength: 9, min: -99, max: 99 }],
  examples: [
    { label: "Example", input: { arr: [4, 2, 1, 3] } },
    { label: "Spread out", input: { arr: [3, 8, -10, 23, 19, -4, -14, 27] } },
  ],
  check: (input) => (new Set(input.arr as number[]).size === (input.arr as number[]).length && (input.arr as number[]).length >= 2 ? null : "arr: at least 2 values, all different."),
  run(input) {
    const a = [...(input.arr as number[])].sort((x, y) => x - y);
    const n = a.length;
    const r = recorder();
    const gaps = a.map((v, i) => (i === 0 ? "" : v - a[i - 1]));
    let best = Infinity;

    r.step(lineOf(code, "const a = "), `Sorted: [${a.join(", ")}]. In sorted order the **closest pair is always two neighbours** — any value in between would be closer to both. So only the n − 1 gaps between neighbours matter.`, {
      arrays: [{ name: "sorted", values: a, tones: toneRange(0, n - 1, "done") }],
    });
    for (let i = 1; i < n; i++) {
      const gap = a[i] - a[i - 1];
      const better = gap < best;
      best = Math.min(best, gap);
      r.step(lineOf(code, "for (let i = 1; i < a.length; i++) best = "), `${a[i]} − ${a[i - 1]} = ${gap}${better ? ": the smallest gap so far." : "."}`, {
        arrays: [
          { name: "sorted", values: a, tones: { [i - 1]: "primary", [i]: "primary" }, pointers: pointersAt(n, { i }) },
          { name: "gap to the left", values: gaps.slice(0, i + 1), tones: { [i]: better ? "write" : "idle" } },
        ],
        vars: { best },
      });
    }
    const pairs: string[] = [];
    for (let i = 1; i < n; i++) if (a[i] - a[i - 1] === best) pairs.push(`[${a[i - 1]}, ${a[i]}]`);
    const hits: Record<number, CellTone> = {};
    a.forEach((_, i) => {
      if (i > 0 && a[i] - a[i - 1] === best) hits[i - 1] = hits[i] = "success";
    });
    const gapHits: Record<number, CellTone> = {};
    gaps.forEach((g, i) => {
      if (g === best) gapHits[i] = "success";
    });
    r.step(lineOf(code, "return pairs;"), `The minimum gap is ${best}. Every neighbouring pair with that gap, in order: **${pairs.join(", ")}**. Sorting dominates: **O(n log n)**.`, {
      arrays: [{ name: "sorted", values: a, tones: hits }, { name: "gap to the left", values: gaps, tones: gapHits }],
      vars: { best },
      done: true,
    });
    return r.frames;
  },
};

export default program;
