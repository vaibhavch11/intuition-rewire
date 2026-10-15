import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function findCircleNum(isConnected) {
  const n = isConnected.length;
  const visited = new Array(n).fill(false);
  const visit = (city) => {
    visited[city] = true;
    for (let other = 0; other < n; other++) {
      if (isConnected[city][other] === 1 && !visited[other]) visit(other);   // a road to someone new
    }
  };
  let provinces = 0;
  for (let city = 0; city < n; city++) {
    if (!visited[city]) {                 // no walk has reached this city: a new province
      provinces++;
      visit(city);                        // mark every city it can reach
    }
  }
  return provinces;
}`;

const program: Program = {
  title: "Number of provinces (DFS)",
  code,
  fields: [{ key: "isConnected", label: "isConnected (n × n, 0 or 1)", kind: "grid", maxLength: 7, min: 0, max: 1 }],
  examples: [
    { label: "Two provinces", input: { isConnected: [[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]] } },
    { label: "A chain", input: { isConnected: [[1, 1, 0, 0], [1, 1, 1, 0], [0, 1, 1, 1], [0, 0, 1, 1]] } },
    { label: "No roads", input: { isConnected: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] } },
  ],
  check: (input) => {
    const m = input.isConnected as number[][];
    if (m.some((row) => row.length !== m.length)) return "isConnected must be square: n rows of n values.";
    for (let i = 0; i < m.length; i++) {
      if (m[i][i] !== 1) return `isConnected[${i}][${i}] must be 1: every city is connected to itself.`;
      for (let j = 0; j < m.length; j++) if (m[i][j] !== m[j][i]) return `Roads go both ways, so [${i}][${j}] and [${j}][${i}] must match.`;
    }
    return null;
  },
  run(input) {
    const m = input.isConnected as number[][];
    const n = m.length;
    const edges: number[][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (m[i][j] === 1) edges.push([i, j]);
    const layout = ringLayout(n, edges);
    const r = recorder();
    const visited = new Array(n).fill(false);
    const province = new Array<number>(n).fill(0);
    const tree: Record<string, EdgeTone> = {};
    let provinces = 0;

    const frame = (city: number | null, row: number | null = city) => {
      const tones: Record<number, CellTone> = {};
      for (let v = 0; v < n; v++) if (visited[v]) tones[v] = province[v] === provinces ? "success" : "done";
      if (city !== null) tones[city] = "primary";
      const gridTones: Record<string, CellTone> = {};
      if (row !== null) for (let j = 0; j < n; j++) gridTones[cell(row, j)] = m[row][j] === 1 ? "primary" : "muted";
      return {
        graphs: [
          graphView("cities", layout, edges, {
            tones,
            edgeTones: tree,
            captions: Object.fromEntries(visited.map((v, i) => [i, v ? `P${province[i]}` : ""]).filter(([, t]) => t)),
          }),
        ],
        grids: [{ name: "isConnected", values: m, tones: gridTones }],
        vars: { provinces },
      };
    };

    const visit = (city: number, from: number | null) => {
      visited[city] = true;
      province[city] = provinces;
      if (from !== null) tree[edgeKey(from, city)] = "done";
      r.step(
        lineOf(code, "visited[city] = true"),
        `Visit city **${city}** — it's in province ${provinces}. Read its row of the matrix: every 1 is a direct road.`,
        frame(city)
      );
      for (let other = 0; other < n; other++) {
        if (m[city][other] === 1 && !visited[other]) visit(other, city);
      }
    };

    r.step(lineOf(code, "let provinces = 0"), `Cities are vertices, roads are edges, and a province is a **connected piece** of the graph. Count the pieces by starting a walk from every city no walk has reached.`, frame(null));
    for (let city = 0; city < n; city++) {
      if (!visited[city]) {
        provinces++;
        r.step(lineOf(code, "provinces++"), `City **${city}** hasn't been reached by any walk: it starts province **${provinces}**.`, frame(city, null));
        visit(city, null);
      }
    }
    r.step(lineOf(code, "return provinces"), `Every city has been reached: **${provinces}** province${provinces === 1 ? "" : "s"}. Each city's row was read once, so **O(n²)**.`, {
      ...frame(null),
      done: true,
    });
    return r.frames;
  },
};

export default program;
