import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function uniquePaths(m, n) {
  const paths = Array.from({ length: m }, () => new Array(n).fill(1));   // edges: one way
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      paths[r][c] = paths[r - 1][c] + paths[r][c - 1];   // from above, or from the left
    }
  }
  return paths[m - 1][n - 1];
}`;

const program: Program = {
  title: "Unique paths: a table of path counts",
  code,
  fields: [
    { key: "m", label: "m (rows)", kind: "number", min: 1, max: 6 },
    { key: "n", label: "n (columns)", kind: "number", min: 1, max: 7 },
  ],
  examples: [
    { label: "3 × 4", input: { m: 3, n: 4 } },
    { label: "3 × 7", input: { m: 3, n: 7 } },
    { label: "1 × 5", input: { m: 1, n: 5 } },
  ],
  run(input) {
    const m = input.m as number;
    const n = input.n as number;
    const r0 = recorder();
    const paths: Scalar[][] = Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => (r === 0 || c === 0 ? 1 : "")));
    const view = (tones: Record<string, CellTone> = {}) => ({ grids: [{ name: "paths to each cell", values: paths.map((row) => [...row]), tones }] });
    const edges: Record<string, CellTone> = {};
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (r === 0 || c === 0) edges[cell(r, c)] = "done";

    r0.step(lineOf(code, "const paths = "), `paths[r][c] = the number of ways to reach cell (r, c) moving only right or down. The **top row and left column** can only be reached one way — straight along the edge — so they start at 1.`, view(edges));
    for (let r = 1; r < m; r++) {
      for (let c = 1; c < n; c++) {
        paths[r][c] = (paths[r - 1][c] as number) + (paths[r][c - 1] as number);
        r0.step(lineOf(code, "paths[r][c] = paths[r - 1][c] + paths[r][c - 1];"), `(${r}, ${c}): ${paths[r - 1][c]} paths come from above, ${paths[r][c - 1]} from the left: **${paths[r][c]}**.`, view({ ...edges, [cell(r - 1, c)]: "primary", [cell(r, c - 1)]: "primary", [cell(r, c)]: "write" }));
      }
    }
    r0.step(lineOf(code, "return paths[m - 1][n - 1];"), `**${paths[m - 1][n - 1]}** paths reach the bottom-right corner. Each of the ${m * n} cells is filled once: O(m · n). Every row only reads the row above, so one row of memory is enough.`, { ...view({ [cell(m - 1, n - 1)]: "success" }), done: true });
    return r0.frames;
  },
};

export default program;
