import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { edgeKey, graphView, lineOf, type Layout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function minCostConnectPoints(points) {
  const n = points.length;
  const dist = (i, j) => Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
  const inTree = new Array(n).fill(false);
  const best = new Array(n).fill(Infinity);   // cheapest edge from the tree to each point
  best[0] = 0;
  let total = 0;
  for (let added = 0; added < n; added++) {
    let u = -1;
    for (let i = 0; i < n; i++) {             // the closest point not yet in the tree
      if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
    }
    inTree[u] = true;
    total += best[u];                         // join it by its cheapest edge
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && dist(u, v) < best[v]) best[v] = dist(u, v);   // u may offer a cheaper edge
    }
  }
  return total;
}`;

const program: Program = {
  title: "Min cost to connect all points (Prim)",
  code,
  fields: [{ key: "points", label: "points [x,y]", kind: "pairs", ordered: false, maxLength: 7, min: 0, max: 10, hint: "[x,y] points, like [0,0] [2,2] [3,10]" }],
  examples: [
    { label: "Example", input: { points: [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]] } },
    { label: "A line", input: { points: [[0, 0], [3, 0], [1, 0], [6, 0]] } },
    { label: "A square", input: { points: [[0, 0], [4, 0], [0, 4], [4, 4], [2, 2]] } },
  ],
  check: (input) => {
    const points = input.points as number[][];
    if (points.length < 1) return "Give at least one point.";
    if (new Set(points.map(([x, y]) => `${x},${y}`)).size !== points.length) return "The points must all be different.";
    return null;
  },
  run(input) {
    const points = input.points as number[][];
    const n = points.length;
    const maxY = Math.max(...points.map(([, y]) => y));
    const layout: Layout = Object.fromEntries(points.map(([x, y], i) => [i, [x * 40, (maxY - y) * 30]]));
    const dist = (i: number, j: number) => Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
    const inTree = new Array(n).fill(false);
    const best = new Array(n).fill(Infinity);
    const via = new Array(n).fill(-1);
    const tree: number[][] = [];
    let total = 0;
    const r = recorder();

    const frame = (current: number | null, offered: number[] = [], vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      inTree.forEach((t, i) => t && (tones[i] = "done"));
      if (current !== null) tones[current] = "primary";
      // Tree edges, then each outside point's cheapest link to the tree.
      const links = [...tree, ...via.flatMap((u, v) => (inTree[v] || u < 0 ? [] : [[u, v]]))];
      const edgeTones: Record<string, EdgeTone> = {};
      tree.forEach(([u, v]) => (edgeTones[edgeKey(u, v)] = "done"));
      via.forEach((u, v) => !inTree[v] && u >= 0 && (edgeTones[edgeKey(u, v)] = offered.includes(v) ? "active" : "muted"));
      return {
        graphs: [
          graphView("points (green: the tree; grey: each point's cheapest link to it)", layout, links, {
            weights: links.map(([u, v]) => dist(u, v)),
            labels: Object.fromEntries(points.map((_, i) => [i, i])),
            captions: Object.fromEntries(points.map(([x, y], i) => [i, `${x},${y}`])),
            tones,
            edgeTones,
          }),
        ],
        maps: [
          {
            name: "best (cheapest edge from the tree)",
            entries: best.map((b, i) => [i, b === Infinity ? "∞" : inTree[i] ? `${b} ✓` : b] as [number, string | number]),
            keyLabel: "point",
            valueLabel: "best",
            tones: Object.fromEntries(offered.map((v) => [v, "write" as const])),
          },
        ],
        vars: { total, ...vars },
      };
    };

    best[0] = 0;
    r.step(
      lineOf(code, "best[0] = 0"),
      `Any two points can be joined, for their Manhattan distance |x₁ - x₂| + |y₁ - y₂|. We need the cheapest set of links that connects everything: a **minimum spanning tree**. Prim grows one tree from point 0, always adding the point that's **cheapest to attach**.`,
      frame(null)
    );
    for (let added = 0; added < n; added++) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
      inTree[u] = true;
      total += best[u];
      if (via[u] >= 0) tree.push([via[u], u]);
      r.step(
        lineOf(code, "total += best[u]"),
        added === 0
          ? `Start the tree with point **0** \`(${points[0].join(", ")})\`. Cost so far: 0.`
          : `The cheapest point to attach is **${u}**, linked to ${via[u]} for **${best[u]}**. No cheaper link from the tree to the outside exists, so this edge is safe to take. Total: ${total}.`,
        frame(u, [], { u })
      );
      const offered: number[] = [];
      for (let v = 0; v < n; v++) {
        if (!inTree[v] && dist(u, v) < best[v]) {
          best[v] = dist(u, v);
          via[v] = u;
          offered.push(v);
        }
      }
      if (offered.length) {
        r.step(
          lineOf(code, "if (!inTree[v] && dist(u, v) < best[v])"),
          `Point ${u} is now in the tree, so it may offer cheaper links: ${offered.map((v) => `${v} for ${best[v]}`).join(", ")}.`,
          frame(u, offered, { u })
        );
      }
    }
    r.step(
      lineOf(code, "return total"),
      `All ${n} points are joined by ${n - 1} link${n === 2 ? "" : "s"}, costing **${total}** in total. Each of the n rounds scans all n points: **O(n²)**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
