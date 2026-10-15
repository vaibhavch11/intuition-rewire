import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function findRedundantConnection(edges) {
  const n = edges.length;
  const parent = Array.from({ length: n + 1 }, (_, i) => i);   // everyone starts in their own group
  const size = new Array(n + 1).fill(1);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];        // path halving: skip a level on the way up
      x = parent[x];
    }
    return x;                               // the root names the group
  };
  for (const [u, v] of edges) {
    let a = find(u), b = find(v);
    if (a === b) return [u, v];             // already in one group: this edge closes a cycle
    if (size[a] < size[b]) [a, b] = [b, a];
    parent[b] = a;                          // hang the smaller tree under the bigger one
    size[a] += size[b];
  }
  return [];
}`;

const program: Program = {
  title: "Redundant connection (Union-Find)",
  code,
  fields: [{ key: "edges", label: "edges (a tree on 1..n plus one extra edge)", kind: "pairs", ordered: false, maxLength: 8, min: 1, max: 8, hint: "[u,v] pairs, like [1,2] [1,3] [2,3]" }],
  examples: [
    { label: "Example", input: { edges: [[1, 2], [1, 3], [2, 3]] } },
    { label: "Longer loop", input: { edges: [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]] } },
    { label: "Late cycle", input: { edges: [[1, 2], [3, 4], [5, 6], [2, 4], [4, 6], [1, 6]] } },
  ],
  check: (input) => {
    const edges = input.edges as number[][];
    const n = edges.length;
    if (n < 3) return "Give at least 3 edges: a tree plus one extra edge needs a cycle of 3 or more.";
    for (const [u, v] of edges) {
      if (u < 1 || v < 1 || u > n || v > n) return `With ${n} edges the vertices are 1 to ${n}; [${u},${v}] is outside that.`;
      if (u === v) return `[${u},${v}] joins a vertex to itself.`;
    }
    if (new Set(edges.map(([u, v]) => edgeKey(u, v))).size !== n) return "Each edge may appear only once.";
    // n vertices and n edges: connected means exactly one cycle, which is the problem's promise.
    const seen = new Set([1]);
    const stack = [1];
    while (stack.length) {
      const x = stack.pop()!;
      for (const [u, v] of edges) {
        const y = u === x ? v : v === x ? u : 0;
        if (y && !seen.has(y)) { seen.add(y); stack.push(y); }
      }
    }
    return seen.size === n ? null : "The edges must join all of 1..n into one piece (a tree plus one extra edge).";
  },
  run(input) {
    const edges = (input.edges as number[][]).map((e) => [...e]);
    const n = edges.length;
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const layout = ringLayout(n, edges, ids);
    const parent = Array.from({ length: n + 1 }, (_, i) => i);
    const size = new Array(n + 1).fill(1);
    const added: Record<string, EdgeTone> = {};
    const r = recorder();

    const frame = (hot: number[] | null, hotTone: EdgeTone, marked: number[] = [], vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      ids.forEach((x) => parent[x] === x && size[x] > 1 && (tones[x] = "done"));
      marked.forEach((x) => (tones[x] = "primary"));
      const forest = ids.filter((x) => parent[x] !== x).map((x) => [x, parent[x]]);
      return {
        graphs: [
          graphView("graph (green: edges added so far)", layout, edges, {
            tones: Object.fromEntries(marked.map((x) => [x, "primary"])),
            edgeTones: hot ? { ...added, [edgeKey(hot[0], hot[1])]: hotTone } : added,
          }),
          graphView("union-find forest (arrow: child → parent)", layout, forest, {
            directed: true,
            tones,
            pointers: Object.fromEntries(ids.filter((x) => parent[x] === x && size[x] > 1).map((x) => [x, [{ label: `root (${size[x]})`, tone: "secondary" as const }]])),
          }),
        ],
        maps: [
          {
            name: "parent",
            entries: ids.map((x) => [x, parent[x]] as [number, number]),
            keyLabel: "vertex",
            valueLabel: "parent",
            tones: Object.fromEntries(marked.map((x) => [x - 1, "primary" as const])),
          },
        ],
        vars,
      };
    };

    const find = (x: number) => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };

    r.step(
      lineOf(code, "const parent = "),
      `Every vertex starts as its **own group**: its parent is itself. Add the edges one by one. An edge whose two ends are **already in one group** joins vertices that were already connected — that edge closes the cycle.`,
      frame(null, "active")
    );
    for (const [u, v] of edges) {
      let a = find(u);
      let b = find(v);
      if (a === b) {
        r.step(
          lineOf(code, "if (a === b) return [u, v]"),
          `Edge [${u}, ${v}]: find(${u}) and find(${v}) both give root **${a}**. ${u} and ${v} are already connected, so this edge makes a cycle. It's the redundant one: **[${u}, ${v}]**.`,
          { ...frame([u, v], "write", [u, v], { u, v, root: a }), done: true }
        );
        return r.frames;
      }
      if (size[a] < size[b]) [a, b] = [b, a];
      parent[b] = a;
      size[a] += size[b];
      added[edgeKey(u, v)] = "done";
      r.step(
        lineOf(code, "parent[b] = a"),
        `Edge [${u}, ${v}]: the roots are different (${a} and ${b}), so it joins two separate groups. Merge them: the smaller tree's root **${b}** now points at **${a}**, the root of the bigger one (${size[a]} vertices now).`,
        frame([u, v], "active", [u, v], { u, v })
      );
    }
    r.step(code.split("\n").length - 1, `No edge closed a cycle.`, { ...frame(null, "active"), done: true });
    return r.frames;
  },
};

export default program;
