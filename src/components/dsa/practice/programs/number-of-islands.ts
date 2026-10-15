import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function numIslands(grid) {
  const rows = grid.length, cols = grid[0].length;
  const sink = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1") return;   // water or off the map
    grid[r][c] = "0";                     // sink it, so no later scan counts it again
    sink(r - 1, c);
    sink(r + 1, c);
    sink(r, c - 1);
    sink(r, c + 1);
  };
  let islands = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") {           // land no walk has reached: a new island
        islands++;
        sink(r, c);                       // sink the whole island
      }
    }
  }
  return islands;
}`;

const program: Program = {
  title: "Number of islands (sink each one)",
  code,
  fields: [{ key: "grid", label: "grid (1 = land, 0 = water)", kind: "grid", maxLength: 6, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { grid: [[1, 1, 0, 0, 0], [1, 1, 0, 0, 1], [0, 0, 1, 0, 1], [0, 0, 0, 1, 1]] } },
    { label: "Diagonals", input: { grid: [[1, 0, 1], [0, 1, 0], [1, 0, 1]] } },
    { label: "One big island", input: { grid: [[1, 1, 1], [0, 1, 0], [1, 1, 1]] } },
  ],
  run(input) {
    const grid = (input.grid as number[][]).map((row) => row.map((v) => (v === 1 ? "1" : "0")));
    const rows = grid.length;
    const cols = grid[0].length;
    const r = recorder();
    const owner = new Map<string, number>(); // sunk cell → which island it belonged to
    let islands = 0;

    const frame = (current: [number, number] | null) => {
      const tones: Record<string, CellTone> = {};
      owner.forEach((island, k) => (tones[k] = island === islands ? "success" : "done"));
      if (current) tones[cell(current[0], current[1])] = "primary";
      return { grids: [{ name: "grid", values: grid, tones }], vars: { islands } };
    };

    const sink = (y: number, x: number) => {
      if (y < 0 || y >= rows || x < 0 || x >= cols || grid[y][x] !== "1") return;
      grid[y][x] = "0";
      owner.set(cell(y, x), islands);
      r.step(lineOf(code, `grid[r][c] = "0"`), `Sink \`(${y}, ${x})\`: it belongs to island ${islands}, and turning it to "0" stops the scan from counting it again.`, frame([y, x]));
      sink(y - 1, x);
      sink(y + 1, x);
      sink(y, x - 1);
      sink(y, x + 1);
    };

    r.step(lineOf(code, "let islands = 0"), `Scan the grid row by row. Every "1" the scan meets that no walk has reached is the start of a **new island**.`, frame(null));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === "1") {
          islands++;
          r.step(lineOf(code, "islands++"), `\`(${y}, ${x})\` is land the scan hasn't seen: island **#${islands}**. Now sink every cell joined to it.`, frame([y, x]));
          sink(y, x);
        }
      }
    }
    r.step(
      lineOf(code, "return islands"),
      `The scan is done: **${islands}** island${islands === 1 ? "" : "s"}. Each land cell was sunk exactly once, so the whole count is **O(m · n)**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
