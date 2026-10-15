import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function orangesRotting(grid) {
  const rows = grid.length, cols = grid[0].length;
  let rotting = [];                       // the oranges spreading rot this minute
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) rotting.push([r, c]);   // every rotten orange starts at once
      else if (grid[r][c] === 1) fresh++;
    }
  }
  let minutes = 0;
  while (rotting.length > 0 && fresh > 0) {
    const next = [];                      // the oranges that rot during this minute
    for (const [r, c] of rotting) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;               // rot it now, so it's never counted twice
          fresh--;
          next.push([nr, nc]);
        }
      }
    }
    rotting = next;
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
}`;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const program: Program = {
  title: "Rotting oranges (multi-source BFS)",
  code,
  fields: [{ key: "grid", label: "grid (0 = empty, 1 = fresh, 2 = rotten)", kind: "grid", maxLength: 5, min: 0, max: 2 }],
  examples: [
    { label: "Example", input: { grid: [[2, 1, 1], [1, 1, 0], [0, 1, 1]] } },
    { label: "Two sources", input: { grid: [[2, 1, 1, 1, 2], [1, 1, 0, 1, 1], [0, 1, 1, 1, 0]] } },
    { label: "Walled off", input: { grid: [[2, 1, 1], [0, 1, 1], [1, 0, 1]] } },
  ],
  check: (input) => {
    const grid = input.grid as number[][];
    if (grid.some((row) => row.length !== grid[0].length)) return "Every row needs the same number of cells.";
    return null;
  },
  run(input) {
    const grid = (input.grid as number[][]).map((row) => [...row]);
    const rows = grid.length;
    const cols = grid[0].length;
    const r = recorder();
    const when: Scalar[][] = grid.map((row) => row.map((v) => (v === 2 ? 0 : "")));
    let rotting: [number, number][] = [];
    let next: [number, number][] = [];
    let fresh = 0;
    let minutes = 0;

    const frame = (spreading: [number, number] | null, vars: Record<string, unknown> = {}) => {
      const tones: Record<string, CellTone> = {};
      grid.forEach((row, y) =>
        row.forEach((v, x) => {
          if (v === 0) tones[cell(y, x)] = "muted";
          else if (v === 2) tones[cell(y, x)] = "tertiary";
        })
      );
      next.forEach(([y, x]) => (tones[cell(y, x)] = "write"));
      if (spreading) tones[cell(spreading[0], spreading[1])] = "primary";
      const minuteTones: Record<string, CellTone> = {};
      when.forEach((row, y) => row.forEach((m, x) => m !== "" && (minuteTones[cell(y, x)] = m === minutes + 1 ? "write" : "done")));
      return {
        grids: [
          { name: "grid", values: grid, tones },
          { name: "minute each orange rotted", values: when, tones: minuteTones },
        ],
        arrays: [
          { name: "rotting (spreading this minute)", values: rotting.map(([y, x]) => `${y},${x}`) },
          { name: "next (rotted this minute)", values: next.map(([y, x]) => `${y},${x}`) },
        ],
        vars: { minutes, fresh, ...vars },
      };
    };

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === 2) rotting.push([y, x]);
        else if (grid[y][x] === 1) fresh++;
      }
    }
    r.step(
      lineOf(code, "if (grid[r][c] === 2) rotting.push"),
      rotting.length === 0
        ? `Scan the grid: there are **no rotten oranges**, and ${fresh} fresh one${fresh === 1 ? "" : "s"}. Nothing can start the rot.`
        : `Scan the grid: ${rotting.length === 1 ? "the one rotten orange goes" : `all **${rotting.length}** rotten oranges go`} into \`rotting\` — ${rotting.length === 1 ? "it starts" : "they all start"} spreading at minute 0. ${fresh} fresh orange${fresh === 1 ? "" : "s"} to rot.`,
      frame(null)
    );

    while (rotting.length > 0 && fresh > 0) {
      next = [];
      r.step(
        lineOf(code, "const next = []"),
        `**Minute ${minutes + 1}** starts. Each of the ${rotting.length} orange${rotting.length === 1 ? "" : "s"} in \`rotting\` passes the rot to its fresh neighbours.`,
        frame(null)
      );
      for (const [y, x] of rotting) {
        let spread = 0;
        for (const [dy, dx] of DIRS) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && grid[ny][nx] === 1) {
            grid[ny][nx] = 2;
            fresh--;
            next.push([ny, nx]);
            when[ny][nx] = minutes + 1;
            spread++;
            r.step(
              lineOf(code, "grid[nr][nc] = 2"),
              `\`(${ny}, ${nx})\` is fresh and touches \`(${y}, ${x})\`: it rots in minute ${minutes + 1}. ${fresh} fresh left.`,
              frame([y, x], { r: y, c: x, nr: ny, nc: nx })
            );
          }
        }
        if (spread === 0) {
          r.step(
            lineOf(code, "for (const [r, c] of rotting)"),
            `\`(${y}, ${x})\` has no fresh neighbours left to rot.`,
            frame([y, x], { r: y, c: x })
          );
        }
      }
      const rotted = next.length;
      minutes++;
      rotting = next;
      r.step(
        lineOf(code, "minutes++"),
        `Minute ${minutes} is over: ${rotted} orange${rotted === 1 ? "" : "s"} rotted. They are the ones that spread the rot next minute.`,
        frame(null)
      );
      next = [];
    }

    r.step(
      lineOf(code, "return fresh === 0"),
      fresh === 0
        ? `No fresh oranges are left, so the answer is **${minutes}** minute${minutes === 1 ? "" : "s"}. Every orange rotted once, so this is **O(m · n)**.`
        : `The rot has stopped spreading, but **${fresh}** fresh orange${fresh === 1 ? " is" : "s are"} left — cut off by empty cells. Return **-1**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
