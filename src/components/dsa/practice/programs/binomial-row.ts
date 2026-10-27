import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function binomial(n, k) {
  const row = new Array(k + 1).fill(0);
  row[0] = 1;                                         // row 0: C(0, 0) = 1
  for (let i = 1; i <= n; i++) {
    for (let j = Math.min(i, k); j >= 1; j--) {       // right to left: row[j - 1] is still the old row
      row[j] += row[j - 1];
    }
  }
  return row[k];
}`;

const program: Program = {
  title: "C(n, k) with one row, updated right to left",
  code,
  fields: [
    { key: "n", label: "n", kind: "number", min: 0, max: 8 },
    { key: "k", label: "k", kind: "number", min: 0, max: 5 },
  ],
  examples: [
    { label: "C(5, 2)", input: { n: 5, k: 2 } },
    { label: "C(6, 3)", input: { n: 6, k: 3 } },
    { label: "C(4, 4)", input: { n: 4, k: 4 } },
  ],
  check: (input) => ((input.k as number) <= (input.n as number) ? null : "k can't be bigger than n."),
  run(input) {
    const n = input.n as number;
    const k = input.k as number;
    const r = recorder();
    const row = new Array(k + 1).fill(0);
    row[0] = 1;
    const view = (tones: Record<number, CellTone> = {}, i: number | null = null) => ({
      arrays: [{ name: i === null ? "row" : `row (becoming row ${i})`, values: [...row], tones }],
    });

    r.step(lineOf(code, "row[0] = 1;"), `Keep a **single row** of k + 1 = ${k + 1} cells instead of the whole table. It starts as row 0: C(0, 0) = 1.`, view({ 0: "success" }, 0));
    for (let i = 1; i <= n; i++) {
      const top = Math.min(i, k);
      r.step(lineOf(code, "for (let i = 1; i <= n; i++) {"), `Turn it into row ${i}, from j = ${top} down to 1. Going **right to left**, row[j − 1] still holds row ${i - 1}'s value when row[j] reads it.`, view({}, i));
      for (let j = top; j >= 1; j--) {
        const before = row[j];
        row[j] += row[j - 1];
        r.step(lineOf(code, "row[j] += row[j - 1];"), `row[${j}] = ${before} + row[${j - 1}] (still row ${i - 1}: ${row[j - 1]}) = **${row[j]}**.`, view({ [j]: "write", [j - 1]: "primary" }, i));
      }
    }
    r.step(lineOf(code, "return row[k];"), `C(${n}, ${k}) = row[${k}] = **${row[k]}** — the same answer as the full table with O(k) memory instead of O(n · k).`, { ...view({ [k]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
