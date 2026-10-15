import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

function shortestPathBinaryMatrix(grid) {
  const n = grid.length;
  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;   // blocked start or end
  const dist = grid.map((row) => row.map(() => 0));   // 0: not reached yet
  dist[0][0] = 1;                           // a path's length counts cells, so the start is 1
  const queue = [[0, 0]];
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    if (r === n - 1 && c === n - 1) return dist[r][c];   // first arrival = shortest
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0 && dist[nr][nc] === 0) {
        dist[nr][nc] = dist[r][c] + 1;      // one cell further than the cell that found it
        queue.push([nr, nc]);
      }
    }
  }
  return -1;                                // the queue ran dry: no way through
}`;

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

const program: Program = {
  title: "Shortest path in a binary matrix (BFS)",
  code,
  fields: [{ key: "grid", label: "grid (0 = open, 1 = blocked, square)", kind: "grid", maxLength: 6, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { grid: [[0, 0, 0], [1, 1, 0], [1, 1, 0]] } },
    { label: "Winding", input: { grid: [[0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [0, 1, 0, 1, 0], [0, 0, 0, 1, 0], [1, 1, 1, 1, 0]] } },
    { label: "No way through", input: { grid: [[0, 0, 1], [0, 1, 0], [1, 0, 0]] } },
  ],
  check: (input) => {
    const grid = input.grid as number[][];
    if (grid.some((row) => row.length !== grid.length)) return "The grid must be square: n rows of n cells.";
    return null;
  },
  run(input) {
    const grid = input.grid as number[][];
    const n = grid.length;
    const r = recorder();
    const dist = grid.map((row) => row.map(() => 0));
    const queue: [number, number][] = [];
    let head = 0;
    let path = new Set<string>();

    const frame = (current: [number, number] | null, fresh: [number, number] | null = null, vars: Record<string, unknown> = {}) => {
      const tones: Record<string, CellTone> = {};
      const values: Scalar[][] = grid.map((row, y) => row.map((v, x) => (v === 1 ? "■" : dist[y][x] === 0 ? "" : dist[y][x])));
      grid.forEach((row, y) =>
        row.forEach((v, x) => {
          if (v === 1) tones[cell(y, x)] = "muted";
          else if (dist[y][x] > 0) tones[cell(y, x)] = "done";
        })
      );
      queue.slice(head).forEach(([y, x]) => (tones[cell(y, x)] = "tertiary"));
      path.forEach((k) => (tones[k] = "success"));
      if (current) tones[cell(current[0], current[1])] = "primary";
      if (fresh) tones[cell(fresh[0], fresh[1])] = "write";
      return {
        grids: [{ name: "dist (cells on the shortest path to here; ■ = blocked)", values, tones }],
        arrays: [{ name: "queue (front → back)", values: queue.slice(head).map(([y, x]) => `${y},${x}`) }],
        vars,
      };
    };

    if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) {
      r.step(lineOf(code, "blocked start or end"), `The ${grid[0][0] === 1 ? "start" : "end"} cell is blocked, so no path can exist: **-1**.`, { ...frame(null), done: true });
      return r.frames;
    }
    dist[0][0] = 1;
    queue.push([0, 0]);
    r.step(lineOf(code, "dist[0][0] = 1"), `Every step costs the same — one cell — so BFS finds the fewest. Start at the top-left: a path that's just this cell has length **1**.`, frame(null, [0, 0]));

    while (head < queue.length) {
      const [y, x] = queue[head++];
      if (y === n - 1 && x === n - 1) {
        // Walk back along cells whose distance drops by one, to show one shortest path.
        path = new Set([cell(y, x)]);
        let [py, px] = [y, x];
        while (dist[py][px] > 1) {
          const back = DIRS.map(([dy, dx]) => [py + dy, px + dx]).find(([ny, nx]) => ny >= 0 && ny < n && nx >= 0 && nx < n && dist[ny][nx] === dist[py][px] - 1)!;
          [py, px] = back;
          path.add(cell(py, px));
        }
        r.step(
          lineOf(code, "if (r === n - 1 && c === n - 1) return dist[r][c]"),
          `The bottom-right cell comes out of the queue. BFS takes cells in order of distance, so nothing shorter is left: the answer is **${dist[y][x]}**. Green is one shortest path.`,
          { ...frame(null), done: true }
        );
        return r.frames;
      }
      const before = queue.length;
      for (const [dy, dx] of DIRS) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < n && nx >= 0 && nx < n && grid[ny][nx] === 0 && dist[ny][nx] === 0) {
          dist[ny][nx] = dist[y][x] + 1;
          queue.push([ny, nx]);
          r.step(
            lineOf(code, "dist[nr][nc] = dist[r][c] + 1"),
            `\`(${ny}, ${nx})\` is open and new${dy !== 0 && dx !== 0 ? " (a diagonal step counts too)" : ""}: the shortest path to it is ${dist[y][x]} + 1 = **${dist[ny][nx]}** cells. Queue it.`,
            frame([y, x], [ny, nx], { r: y, c: x })
          );
        }
      }
      if (queue.length === before) {
        r.step(lineOf(code, "const [r, c] = queue[head++]"), `Take \`(${y}, ${x})\` (distance ${dist[y][x]}): none of its 8 neighbours is open and new.`, frame([y, x], null, { r: y, c: x }));
      }
    }
    r.step(lineOf(code, "the queue ran dry"), `The queue ran dry without reaching the bottom-right: walls cut it off. The answer is **-1**.`, { ...frame(null), done: true });
    return r.frames;
  },
};

export default program;
