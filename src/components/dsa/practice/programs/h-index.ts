import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function hIndex(citations) {
  const c = [...citations].sort((a, b) => b - a);   // most cited first
  let h = 0;
  while (h < c.length && c[h] >= h + 1) h++;        // the (h+1)-th best paper has at least h+1 citations
  return h;
}`;

const program: Program = {
  title: "H-index (sort descending, then count)",
  code,
  fields: [{ key: "citations", label: "citations", kind: "array", maxLength: 10, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { citations: [3, 0, 6, 1, 5] } },
    { label: "Few citations", input: { citations: [1, 3, 1] } },
    { label: "All high", input: { citations: [10, 8, 9] } },
  ],
  run(input) {
    const c = [...(input.citations as number[])].sort((a, b) => b - a);
    const n = c.length;
    const r = recorder();
    const rank = c.map((_, i) => i + 1);

    r.step(lineOf(code, "const c = "), `The h-index is the largest h such that **h papers have at least h citations** each. Sort most cited first: then the best h papers are simply the first h, and the h-th of them is the weakest one that has to reach h.`, {
      arrays: [
        { name: "citations (most cited first)", values: c, chart: true, tones: toneRange(0, n - 1, "done") },
        { name: "rank", values: rank },
      ],
    });
    let h = 0;
    while (h < n && c[h] >= h + 1) {
      h++;
      r.step(lineOf(code, "while (h < c.length && c[h] >= h + 1) h++"), `Paper #${h} has ${c[h - 1]} ≥ ${h} citations: the top ${h} papers all have at least ${h}. h = ${h}.`, {
        arrays: [
          { name: "citations (most cited first)", values: c, chart: true, tones: toneRange(0, h - 1, "success"), pointers: pointersAt(n, { h: h - 1 }) },
          { name: "rank", values: rank, tones: { [h - 1]: "primary" } },
        ],
        vars: { h },
      });
    }
    r.step(
      lineOf(code, "return h;"),
      h < n ? `Paper #${h + 1} has only ${c[h]} citation${c[h] === 1 ? "" : "s"} — fewer than ${h + 1} — so ${h + 1} papers can't each have ${h + 1}. The h-index is **${h}**. Sorting dominates: **O(n log n)**.` : `Every paper passes, so the h-index is **${h}**, the number of papers.`,
      {
        arrays: [
          { name: "citations (most cited first)", values: c, chart: true, tones: { ...toneRange(0, h - 1, "success"), ...(h < n ? { [h]: "write" as const } : {}) } },
          { name: "rank", values: rank },
        ],
        vars: { h },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
