import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function pacificAtlantic(heights) {
  const rows = heights.length, cols = heights[0].length;
  const pacific = heights.map((row) => row.map(() => false));
  const atlantic = heights.map((row) => row.map(() => false));
  const climb = (r, c, reach) => {
    if (reach[r][c]) return;                // already known to reach this ocean
    reach[r][c] = true;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && heights[nr][nc] >= heights[r][c]) {
        climb(nr, nc, reach);               // uphill or level: water could flow down from there
      }
    }
  };
  for (let r = 0; r < rows; r++) climb(r, 0, pacific);          // left edge
  for (let c = 0; c < cols; c++) climb(0, c, pacific);          // top edge
  for (let r = 0; r < rows; r++) climb(r, cols - 1, atlantic);  // right edge
  for (let c = 0; c < cols; c++) climb(rows - 1, c, atlantic);  // bottom edge
  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) result.push([r, c]);   // reaches both oceans
    }
  }
  return result;
}`;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const program: Program = {
  title: "Pacific Atlantic water flow (climb from the oceans)",
  code,
  fields: [{ key: "heights", label: "heights", kind: "grid", maxLength: 5, min: 0, max: 9 }],
  examples: [
    { label: "Example", input: { heights: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]] } },
    { label: "A ridge", input: { heights: [[1, 2, 1], [2, 3, 2], [1, 2, 1]] } },
    { label: "Flat", input: { heights: [[2, 2], [2, 2]] } },
  ],
  check: (input) => {
    const heights = input.heights as number[][];
    if (heights.some((row) => row.length !== heights[0].length)) return "Every row needs the same number of cells.";
    return null;
  },
  run(input) {
    const heights = input.heights as number[][];
    const rows = heights.length;
    const cols = heights[0].length;
    const pacific = heights.map((row) => row.map(() => false));
    const atlantic = heights.map((row) => row.map(() => false));
    const r = recorder();

    const frame = (current: [number, number] | null, vars: Record<string, unknown> = {}) => {
      const tones: Record<string, CellTone> = {};
      heights.forEach((row, y) =>
        row.forEach((_, x) => {
          if (pacific[y][x] && atlantic[y][x]) tones[cell(y, x)] = "success";
          else if (pacific[y][x]) tones[cell(y, x)] = "primary";
          else if (atlantic[y][x]) tones[cell(y, x)] = "tertiary";
        })
      );
      if (current) tones[cell(current[0], current[1])] = "write";
      const count = (grid: boolean[][]) => grid.flat().filter(Boolean).length;
      return {
        grids: [{ name: "heights (blue: Pacific, orange: Atlantic, green: both)", values: heights, tones }],
        vars: { "reach Pacific": count(pacific), "reach Atlantic": count(atlantic), ...vars },
      };
    };

    const climb = (y: number, x: number, reach: boolean[][], ocean: string, from: [number, number] | null) => {
      if (reach[y][x]) return;
      reach[y][x] = true;
      r.step(
        lineOf(code, "reach[r][c] = true"),
        from
          ? `\`(${y}, ${x})\` is ${heights[y][x]}, not lower than ${heights[from[0]][from[1]]} at \`(${from[0]}, ${from[1]})\` — water here could flow down that path into the **${ocean}**.`
          : `\`(${y}, ${x})\` is on the ${ocean} edge: water there flows straight into the **${ocean}**.`,
        frame([y, x], { r: y, c: x })
      );
      for (const [dy, dx] of DIRS) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && heights[ny][nx] >= heights[y][x]) climb(ny, nx, reach, ocean, [y, x]);
      }
    };

    r.step(
      lineOf(code, "const climb = "),
      `Don't pour water on every cell. Start **at the oceans** and walk **uphill**: if a neighbour is at least as high, water from it could flow down to here, and on into the ocean. The Pacific touches the top and left edges, the Atlantic the bottom and right.`,
      frame(null)
    );
    for (let y = 0; y < rows; y++) climb(y, 0, pacific, "Pacific", null);
    for (let x = 0; x < cols; x++) climb(0, x, pacific, "Pacific", null);
    r.step(lineOf(code, "climb(0, c, pacific)"), `The Pacific climb is done: every blue cell can drain into the Pacific. Now the same climb from the Atlantic edges.`, frame(null));
    for (let y = 0; y < rows; y++) climb(y, cols - 1, atlantic, "Atlantic", null);
    for (let x = 0; x < cols; x++) climb(rows - 1, x, atlantic, "Atlantic", null);

    const result: string[] = [];
    heights.forEach((row, y) => row.forEach((_, x) => pacific[y][x] && atlantic[y][x] && result.push(`${y},${x}`)));
    r.step(
      lineOf(code, "if (pacific[r][c] && atlantic[r][c])"),
      `The answer is every cell both climbs reached — the green ones: **${result.length}** cell${result.length === 1 ? "" : "s"}. Each climb visits a cell at most once, so this is **O(m · n)**.`,
      { ...frame(null), arrays: [{ name: "result", values: result }], done: true }
    );
    return r.frames;
  },
};

export default program;
