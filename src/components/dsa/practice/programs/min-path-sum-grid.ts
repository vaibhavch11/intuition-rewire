import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function minPathSum(grid) {
  const m = grid.length, n = grid[0].length;
  const best = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (r === 0 && c === 0) best[r][c] = grid[r][c];
      else if (r === 0) best[r][c] = grid[r][c] + best[r][c - 1];       // top row: only from the left
      else if (c === 0) best[r][c] = grid[r][c] + best[r - 1][c];       // left column: only from above
      else best[r][c] = grid[r][c] + Math.min(best[r - 1][c], best[r][c - 1]);
    }
  }
  return best[m - 1][n - 1];
}`;

const program: Program = {
  title: "Minimum path sum",
  code,
  fields: [{ key: "grid", label: "grid (costs)", kind: "grid", maxLength: 5, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { grid: [[1, 3, 1], [1, 5, 1], [4, 2, 1]] } },
    { label: "Two rows", input: { grid: [[1, 2, 3], [4, 5, 6]] } },
    { label: "Detour", input: { grid: [[1, 9, 1, 1], [1, 9, 1, 9], [1, 1, 1, 1]] } },
  ],
  run(input) {
    const grid = input.grid as number[][];
    const m = grid.length;
    const n = grid[0].length;
    const r0 = recorder();
    const best: Scalar[][] = grid.map((row) => row.map(() => ""));
    const view = (tones: Record<string, CellTone> = {}, gt: Record<string, CellTone> = {}) => ({
      grids: [
        { name: "grid", values: grid, tones: gt },
        { name: "best (cheapest sum to each cell)", values: best.map((row) => [...row]), tones },
      ],
    });

    r0.step(lineOf(code, "const best = "), `best[r][c] = the cheapest sum of a path from the top-left to (r, c). Each cell adds its own cost to the cheaper way in: from above or from the left.`, view());
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        const tones: Record<string, CellTone> = { [cell(r, c)]: "write" };
        let note: string;
        let line: string;
        if (r === 0 && c === 0) {
          best[r][c] = grid[r][c];
          note = `The start costs its own value: **${grid[r][c]}**.`;
          line = "if (r === 0 && c === 0) best[r][c] = grid[r][c];";
        } else if (r === 0) {
          best[r][c] = grid[r][c] + (best[r][c - 1] as number);
          tones[cell(r, c - 1)] = "primary";
          note = `Top row: only from the left. ${grid[r][c]} + ${best[r][c - 1]} = **${best[r][c]}**.`;
          line = "else if (r === 0) best[r][c] = ";
        } else if (c === 0) {
          best[r][c] = grid[r][c] + (best[r - 1][c] as number);
          tones[cell(r - 1, c)] = "primary";
          note = `Left column: only from above. ${grid[r][c]} + ${best[r - 1][c]} = **${best[r][c]}**.`;
          line = "else if (c === 0) best[r][c] = ";
        } else {
          const up = best[r - 1][c] as number;
          const left = best[r][c - 1] as number;
          best[r][c] = grid[r][c] + Math.min(up, left);
          tones[cell(r - 1, c)] = up <= left ? "success" : "primary";
          tones[cell(r, c - 1)] = left < up ? "success" : "primary";
          note = `(${r}, ${c}): from above ${up}, from the left ${left}. ${grid[r][c]} + min = **${best[r][c]}**.`;
          line = "else best[r][c] = grid[r][c] + Math.min(";
        }
        r0.step(lineOf(code, line), note, view(tones, { [cell(r, c)]: "primary" }));
      }
    }
    // Walk back from the corner along the cheaper predecessors to show the path.
    const path: Record<string, CellTone> = {};
    let r = m - 1;
    let c = n - 1;
    path[cell(r, c)] = "success";
    while (r > 0 || c > 0) {
      if (r === 0) c--;
      else if (c === 0) r--;
      else if ((best[r - 1][c] as number) <= (best[r][c - 1] as number)) r--;
      else c--;
      path[cell(r, c)] = "success";
    }
    r0.step(lineOf(code, "return best[m - 1][n - 1];"), `The cheapest path costs **${best[m - 1][n - 1]}** (green). O(m · n) time; one row of memory would do.`, { ...view(path, path), done: true });
    return r0.frames;
  },
};

export default program;
