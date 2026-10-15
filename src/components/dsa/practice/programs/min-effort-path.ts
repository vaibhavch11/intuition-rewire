import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function minimumEffortPath(heights) {
  const rows = heights.length, cols = heights[0].length;
  const effort = heights.map((row) => row.map(() => Infinity));   // best effort to reach each cell
  effort[0][0] = 0;
  const heap = new Heap((a, b) => a[0] - b[0]);   // [effort, row, col], easiest first
  heap.push([0, 0, 0]);
  while (heap.size() > 0) {
    const [e, r, c] = heap.pop();
    if (e > effort[r][c]) continue;         // a stale entry
    if (r === rows - 1 && c === cols - 1) return e;   // settled: no easier path exists
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const next = Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]));   // a path costs its biggest step
      if (next < effort[nr][nc]) {
        effort[nr][nc] = next;
        heap.push([next, nr, nc]);
      }
    }
  }
  return 0;
}`;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const program: Program = {
  title: "Path with minimum effort (Dijkstra on a grid)",
  code,
  fields: [{ key: "heights", label: "heights", kind: "grid", maxLength: 5, min: 1, max: 9 }],
  examples: [
    { label: "Example", input: { heights: [[1, 2, 2], [3, 8, 2], [5, 3, 5]] } },
    { label: "Around the peak", input: { heights: [[1, 2, 3], [3, 8, 4], [5, 3, 5]] } },
    { label: "Flat road", input: { heights: [[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]] } },
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
    const effort = heights.map((row) => row.map(() => Infinity));
    const settled = new Set<string>();
    const heap: [number, number, number][] = [];
    const from = new Map<string, string>();
    const r = recorder();
    let path = new Set<string>();

    const frame = (current: [number, number] | null, fresh: [number, number] | null = null, vars: Record<string, unknown> = {}) => {
      const tones: Record<string, CellTone> = {};
      effort.forEach((row, y) => row.forEach((e, x) => e !== Infinity && (tones[cell(y, x)] = "tertiary")));
      settled.forEach((k) => (tones[k] = "done"));
      path.forEach((k) => (tones[k] = "success"));
      if (current) tones[cell(current[0], current[1])] = "primary";
      if (fresh) tones[cell(fresh[0], fresh[1])] = "write";
      return {
        grids: [
          { name: "heights", values: heights, tones },
          { name: "effort (biggest step on the best path so far)", values: effort.map((row) => row.map((e) => (e === Infinity ? "∞" : e))), tones },
        ],
        arrays: [{ name: "heap [effort, cell], easiest first", values: [...heap].sort((a, b) => a[0] - b[0]).map(([e, y, x]) => `${e}: ${y},${x}`) }],
        vars,
      };
    };
    const popMin = () => {
      let best = 0;
      heap.forEach(([e], i) => e < heap[best][0] && (best = i));
      return heap.splice(best, 1)[0];
    };

    effort[0][0] = 0;
    heap.push([0, 0, 0]);
    r.step(
      lineOf(code, "heap.push([0, 0, 0])"),
      `A path's **effort** is its single biggest climb or drop between neighbours. Start at the top-left with effort 0. Like Dijkstra, always continue from the cell with the **smallest** effort so far — only the "cost" of a path is now its maximum step, not a sum.`,
      frame(null, [0, 0])
    );
    while (heap.length > 0) {
      const [e, y, x] = popMin();
      if (e > effort[y][x]) {
        r.step(lineOf(code, "if (e > effort[r][c]) continue"), `Pop [${e}, (${y}, ${x})]: out of date — that cell was already reached with effort ${effort[y][x]}. Skip it.`, frame(null, null, { e }));
        continue;
      }
      settled.add(cell(y, x));
      if (y === rows - 1 && x === cols - 1) {
        let k = cell(y, x);
        path = new Set([k]);
        while (from.has(k)) {
          k = from.get(k)!;
          path.add(k);
        }
        r.step(
          lineOf(code, "if (r === rows - 1 && c === cols - 1) return e"),
          `The bottom-right cell comes out of the heap with effort **${e}**. Everything left in the heap is at least ${e}, so no easier path exists. Green is the path it found.`,
          { ...frame(null), done: true }
        );
        return r.frames;
      }
      r.step(lineOf(code, "const [e, r, c] = heap.pop()"), `Pop the easiest cell: \`(${y}, ${x})\` with effort **${e}**. It's settled; now try its neighbours.`, frame([y, x], null, { e, r: y, c: x }));
      for (const [dy, dx] of DIRS) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
        const step = Math.abs(heights[ny][nx] - heights[y][x]);
        const next = Math.max(e, step);
        if (next < effort[ny][nx]) {
          const before = effort[ny][nx];
          effort[ny][nx] = next;
          from.set(cell(ny, nx), cell(y, x));
          heap.push([next, ny, nx]);
          r.step(
            lineOf(code, "effort[nr][nc] = next"),
            `Step to \`(${ny}, ${nx})\`: |${heights[ny][nx]} - ${heights[y][x]}| = ${step}, so the path's biggest step becomes max(${e}, ${step}) = **${next}**${before === Infinity ? "" : `, easier than ${before}`}. Record it and push it.`,
            frame([y, x], [ny, nx], { e, next })
          );
        }
      }
    }
    return r.frames;
  },
};

export default program;
