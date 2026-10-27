import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function uniquePathsWithObstacles(grid) {
  const m = grid.length, n = grid[0].length;
  const paths = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 1) continue;                     // blocked: 0 paths
      if (r === 0 && c === 0) { paths[r][c] = 1; continue; }
      paths[r][c] = (r > 0 ? paths[r - 1][c] : 0) + (c > 0 ? paths[r][c - 1] : 0);   // above + left
    }
  }
  return paths[m - 1][n - 1];
}`;

const program: Program = {
  title: "Unique paths with obstacles",
  code,
  fields: [{ key: "grid", label: "obstacleGrid (1 = blocked)", kind: "grid", maxLength: 6, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { grid: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] } },
    { label: "Edge blocked", input: { grid: [[0, 1, 0, 0], [0, 0, 0, 0], [1, 0, 1, 0]] } },
    { label: "Start blocked", input: { grid: [[1, 0], [0, 0]] } },
  ],
  run(input) {
    const grid = input.grid as number[][];
    const m = grid.length;
    const n = grid[0].length;
    const r0 = recorder();
    const paths: Scalar[][] = grid.map((row) => row.map((v) => (v === 1 ? "X" : "")));
    const blocked: Record<string, CellTone> = {};
    grid.forEach((row, r) => row.forEach((v, c) => {
      if (v === 1) blocked[cell(r, c)] = "muted";
    }));
    const num = (r: number, c: number) => (r < 0 || c < 0 || paths[r][c] === "X" ? 0 : (paths[r][c] as number));
    const view = (tones: Record<string, CellTone> = {}) => ({ grids: [{ name: "paths (X = obstacle, 0 paths)", values: paths.map((row) => [...row]), tones: { ...blocked, ...tones } }] });

    r0.step(lineOf(code, "const paths = "), `Count the paths to every cell, row by row. An obstacle (X) has **0** paths, so it adds nothing to the cells after it.`, view());
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === 1) continue;
        if (r === 0 && c === 0) {
          paths[0][0] = 1;
          r0.step(lineOf(code, "if (r === 0 && c === 0) { paths[r][c] = 1; continue; }"), `The start is open: **1** way to be there.`, view({ [cell(0, 0)]: "write" }));
          continue;
        }
        const up = r > 0 ? num(r - 1, c) : 0;
        const left = c > 0 ? num(r, c - 1) : 0;
        paths[r][c] = up + left;
        const tones: Record<string, CellTone> = { [cell(r, c)]: "write" };
        if (r > 0 && grid[r - 1][c] !== 1) tones[cell(r - 1, c)] = "primary";
        if (c > 0 && grid[r][c - 1] !== 1) tones[cell(r, c - 1)] = "primary";
        r0.step(lineOf(code, "paths[r][c] = (r > 0 ? paths[r - 1][c] : 0) + (c > 0 ? paths[r][c - 1] : 0);"), `(${r}, ${c}): ${up} from above${r > 0 && grid[r - 1][c] === 1 ? " (blocked)" : r === 0 ? " (none: top row)" : ""}, ${left} from the left${c > 0 && grid[r][c - 1] === 1 ? " (blocked)" : c === 0 ? " (none: left column)" : ""}: **${up + left}**.`, view(tones));
      }
    }
    const answer = grid[m - 1][n - 1] === 1 ? 0 : (paths[m - 1][n - 1] as number);
    r0.step(lineOf(code, "return paths[m - 1][n - 1];"), grid[m - 1][n - 1] === 1 ? `The corner itself is blocked: **0** paths.` : `**${answer}** path${answer === 1 ? "" : "s"} reach the bottom-right corner around the obstacles. O(m · n).`, { ...view({ [cell(m - 1, n - 1)]: answer ? "success" : "tertiary" }), done: true });
    return r0.frames;
  },
};

export default program;
