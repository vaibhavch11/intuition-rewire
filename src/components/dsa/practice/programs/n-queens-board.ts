import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function solveNQueens(n) {
  const cols = new Set(), diag = new Set(), anti = new Set();   // attacked columns and diagonals
  const queens = [];
  const result = [];
  const place = (r) => {
    if (r === n) {                                              // a queen in every row
      result.push(queens.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue;   // attacked: prune
      cols.add(c); diag.add(r - c); anti.add(r + c);            // place the queen
      queens.push(c);
      place(r + 1);
      queens.pop();                                             // remove it again
      cols.delete(c); diag.delete(r - c); anti.delete(r + c);
    }
  };
  place(0);
  return result;
}`;

const program: Program = {
  title: "N-Queens: one queen per row",
  code,
  fields: [{ key: "n", label: "n", kind: "number", min: 1, max: 5 }],
  examples: [
    { label: "n = 4", input: { n: 4 } },
    { label: "n = 5", input: { n: 5 } },
    { label: "n = 3", input: { n: 3 } },
  ],
  run(input) {
    const n = input.n as number;
    const r0 = recorder();
    const queens: number[] = [];
    const result: string[] = [];
    const attacked = (r: number, c: number) => queens.some((qc, qr) => qc === c || qr - qc === r - c || qr + qc === r + c);
    const view = (extra: Record<string, CellTone> = {}, row: number | null = null) => {
      const values = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (queens[r] === c ? "Q" : row !== null && r === row && attacked(r, c) ? "×" : "")));
      const tones: Record<string, CellTone> = {};
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (queens[r] === c) tones[cell(r, c)] = "success";
          else if (row !== null && r === row && attacked(r, c)) tones[cell(r, c)] = "tertiary";
        }
      }
      return {
        grids: [{ name: "board", values, tones: { ...tones, ...extra } }],
        arrays: [{ name: "solutions (column of the queen in each row)", values: [...result] }],
      };
    };

    const place = (r: number) => {
      if (r === n) {
        result.push(`[${queens.join(",")}]`);
        r0.step(lineOf(code, "result.push(queens.map("), `A queen in every row and none attack each other: solution **#${result.length}**, columns ${queens.join(", ")}. Record it and keep searching.`, view());
        return;
      }
      const blocked = [...Array(n).keys()].filter((c) => attacked(r, c));
      const free = [...Array(n).keys()].filter((c) => !attacked(r, c));
      r0.step(lineOf(code, "if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue;"), free.length ? `Row ${r}: ${blocked.length ? `column${blocked.length === 1 ? "" : "s"} ${blocked.join(", ")} ${blocked.length === 1 ? "is" : "are"} attacked (×). ` : ""}Try column${free.length === 1 ? "" : "s"} ${free.join(", ")}.` : `Row ${r}: **every** column is attacked. Dead end — back up and move the queen above.`, view({}, r));
      for (const c of free) {
        queens.push(c);
        r0.step(lineOf(code, "queens.push(c);"), `Place a queen at row ${r}, column ${c}. Its column and both diagonals are now attacked.`, view({ [cell(r, c)]: "write" }));
        place(r + 1);
        queens.pop();
        r0.step(lineOf(code, "queens.pop();"), `Remove the queen from row ${r}, column ${c}${c !== free[free.length - 1] ? " and try the next free column" : " — row " + r + " has no more columns to try"}.`, view({}, r));
      }
    };
    r0.step(lineOf(code, "const cols = new Set()"), `Place one queen per row, top to bottom. A square is attacked if an earlier queen shares its column, its \\ diagonal (same row − col) or its / diagonal (same row + col).`, view());
    place(0);
    const first = result.length ? (JSON.parse(result[0]) as number[]) : [];
    queens.push(...first);
    r0.step(lineOf(code, "return result;"), `Search finished: **${result.length}** solution${result.length === 1 ? "" : "s"} for n = ${n}${result.length ? " (the first is shown)" : ""}. Pruning attacked squares keeps the tree far smaller than the ${n}^${n} ways to put one queen per row.`, { ...view(), done: true });
    return r0.frames;
  },
};

export default program;
