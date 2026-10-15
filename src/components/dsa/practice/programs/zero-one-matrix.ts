import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function updateMatrix(mat) {
  const rows = mat.length, cols = mat[0].length;
  const dist = mat.map((row) => row.map(() => -1));   // -1: not reached yet
  const queue = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mat[r][c] === 0) {
        dist[r][c] = 0;                   // every 0 is a source, at distance 0
        queue.push([r, c]);
      }
    }
  }
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;    // first visit = nearest 0, one step further
        queue.push([nr, nc]);
      }
    }
  }
  return dist;
}`;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const program: Program = {
  title: "01 matrix (multi-source BFS)",
  code,
  fields: [{ key: "mat", label: "mat (0s and 1s, at least one 0)", kind: "grid", maxLength: 5, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { mat: [[0, 0, 0], [0, 1, 0], [1, 1, 1]] } },
    { label: "One zero", input: { mat: [[1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 1, 1]] } },
    { label: "Zeros apart", input: { mat: [[0, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 0]] } },
  ],
  check: (input) => {
    const mat = input.mat as number[][];
    if (mat.some((row) => row.length !== mat[0].length)) return "Every row needs the same number of cells.";
    if (!mat.some((row) => row.includes(0))) return "The matrix needs at least one 0 to measure from.";
    return null;
  },
  run(input) {
    const mat = input.mat as number[][];
    const rows = mat.length;
    const cols = mat[0].length;
    const dist: number[][] = mat.map((row) => row.map(() => -1));
    const queue: [number, number][] = [];
    let head = 0;
    const r = recorder();

    const frame = (current: [number, number] | null, fresh: [number, number] | null = null) => {
      const tones: Record<string, CellTone> = {};
      dist.forEach((row, y) => row.forEach((d, x) => d >= 0 && (tones[cell(y, x)] = "done")));
      queue.slice(head).forEach(([y, x]) => (tones[cell(y, x)] = "tertiary"));
      if (current) tones[cell(current[0], current[1])] = "primary";
      if (fresh) tones[cell(fresh[0], fresh[1])] = "write";
      return {
        grids: [
          { name: "mat", values: mat },
          { name: "dist", values: dist.map((row) => row.map((d) => (d === -1 ? "?" : d))), tones },
        ],
        arrays: [{ name: "queue (front → back)", values: queue.slice(head).map(([y, x]) => `${y},${x}`) }],
      };
    };

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (mat[y][x] === 0) {
          dist[y][x] = 0;
          queue.push([y, x]);
        }
      }
    }
    r.step(
      lineOf(code, "dist[r][c] = 0"),
      `Every **0** is its own nearest 0, at distance 0. All ${queue.length} of them go into the queue **together** — the search spreads out from all of them at once. "?" marks a cell not reached yet.`,
      frame(null)
    );

    while (head < queue.length) {
      const [y, x] = queue[head++];
      const before = queue.length;
      for (const [dy, dx] of DIRS) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && dist[ny][nx] === -1) {
          dist[ny][nx] = dist[y][x] + 1;
          queue.push([ny, nx]);
          r.step(
            lineOf(code, "dist[nr][nc] = dist[r][c] + 1"),
            `\`(${ny}, ${nx})\` is reached for the first time, from \`(${y}, ${x})\`. BFS reaches cells in order of distance, so this is its nearest 0: **${dist[ny][nx]}** step${dist[ny][nx] === 1 ? "" : "s"}.`,
            { ...frame([y, x], [ny, nx]), vars: { r: y, c: x, nr: ny, nc: nx } }
          );
        }
      }
      if (queue.length === before) {
        r.step(
          lineOf(code, "const [r, c] = queue[head++]"),
          `Take \`(${y}, ${x})\` (distance ${dist[y][x]}): every neighbour already has its distance.`,
          { ...frame([y, x]), vars: { r: y, c: x } }
        );
      }
    }

    r.step(
      lineOf(code, "return dist"),
      `The queue is empty and every cell has its distance. Each cell entered the queue once, so the whole matrix took **O(m · n)** — not one search per cell.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
