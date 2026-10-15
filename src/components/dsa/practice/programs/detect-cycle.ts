import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { adjacency, asEdges, checkEdges, edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function hasCycle(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const visited = new Array(n).fill(false);
  const dfs = (u, parent) => {
    visited[u] = true;
    for (const v of adj[u]) {
      if (v === parent) continue;           // the edge we just came along: not a cycle
      if (visited[v]) return true;          // reached again by another route: a cycle
      if (dfs(v, u)) return true;
    }
    return false;
  };
  for (let s = 0; s < n; s++) {
    if (!visited[s] && dfs(s, -1)) return true;   // check every piece of the graph
  }
  return false;
}`;

const program: Program = {
  title: "Detect a cycle (DFS with parent)",
  code,
  fields: [
    { key: "n", label: "n (vertices)", kind: "number", min: 1, max: 8 },
    { key: "edges", label: "edges", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[u,v] pairs, like [0,1] [1,2]" },
  ],
  examples: [
    { label: "Example", input: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 1], [3, 4]] } },
    { label: "A tree", input: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]] } },
    { label: "Cycle in the 2nd piece", input: { n: 6, edges: [[0, 1], [1, 2], [3, 4], [4, 5], [5, 3]] } },
  ],
  check: (input) => {
    const edges = input.edges as number[][];
    const bad = checkEdges(input.n as number, edges);
    if (bad) return bad;
    const seen = new Set<string>();
    for (const [u, v] of edges) {
      if (seen.has(edgeKey(u, v))) return `[${u},${v}] appears twice; list each edge once.`;
      seen.add(edgeKey(u, v));
    }
    return null;
  },
  run(input) {
    const n = input.n as number;
    const edges = asEdges(input);
    const adj = adjacency(n, edges);
    const layout = ringLayout(n, edges);
    const r = recorder();
    const visited = new Array(n).fill(false);
    const calls: { u: number; parent: number }[] = [];
    const tree: Record<string, EdgeTone> = {};

    const frame = (hot?: [number, number], hotTone: EdgeTone = "active", vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      visited.forEach((seen, v) => seen && (tones[v] = "done"));
      calls.forEach(({ u }) => (tones[u] = "tertiary"));
      if (calls.length) tones[calls[calls.length - 1].u] = "primary";
      return {
        graphs: [
          graphView("graph", layout, edges, {
            tones,
            captions: Object.fromEntries(calls.filter(({ parent }) => parent >= 0).map(({ u, parent }) => [u, `from ${parent}`])),
            edgeTones: hot ? { ...tree, [edgeKey(hot[0], hot[1])]: hotTone } : tree,
          }),
        ],
        stacks: [{ name: "call stack", values: calls.map(({ u, parent }) => `dfs(${u}, ${parent})`) }],
        vars,
      };
    };

    const dfs = (u: number, parent: number): boolean => {
      visited[u] = true;
      calls.push({ u, parent });
      if (parent >= 0) tree[edgeKey(parent, u)] = "done";
      r.step(
        lineOf(code, "visited[u] = true"),
        parent < 0 ? `Start a walk at **${u}**. It has no parent yet (-1).` : `Visit **${u}**, remembering we came from **${parent}**.`,
        frame(undefined, "active", { u, parent })
      );
      for (const v of adj[u]) {
        if (v === parent) {
          r.step(lineOf(code, "if (v === parent) continue"), `${u} → ${v} is the edge we just walked along. Going back down it isn't a loop — skip it.`, frame([u, v], "muted", { u, parent, v }));
          continue;
        }
        if (visited[v]) {
          // In an undirected DFS a visited non-parent neighbour is always still on the
          // call stack, so the loop is the stack from v up to u, closed by the edge u-v.
          const loop = calls.slice(calls.findIndex((c) => c.u === v)).map((c) => c.u);
          loop.forEach((w, i) => i > 0 && (tree[edgeKey(loop[i - 1], w)] = "write"));
          tree[edgeKey(u, v)] = "write";
          r.step(
            lineOf(code, "if (visited[v]) return true"),
            `${u} → **${v}**: ${v} is already visited, and we did **not** just come from it. So there are two different routes between ${v} and ${u}: together they form a **cycle**, ${[...loop, v].join(" → ")}.`,
            frame(undefined, "active", { u, parent, v })
          );
          return true;
        }
        if (dfs(v, u)) return true;
      }
      calls.pop();
      r.step(
        lineOf(code, "    return false"),
        `Every neighbour of **${u}** is done and none closed a loop. \`dfs(${u})\` returns false.`,
        frame(undefined, "active", { u })
      );
      return false;
    };

    r.step(lineOf(code, "const visited"), `A walk that only remembers what's visited can't tell a loop from the edge it just came along. So each call also carries its **parent**: the vertex it came from.`, frame());
    for (let s = 0; s < n; s++) {
      if (visited[s]) continue;
      if (dfs(s, -1)) {
        r.step(lineOf(code, "if (!visited[s] && dfs(s, -1)) return true"), `A cycle was found, so the answer is **true** — no need to look further.`, { ...frame(), done: true });
        return r.frames;
      }
    }
    r.step(code.split("\n").length - 1, `Every vertex was visited and no edge led back to an already visited vertex: **no cycle**. Each vertex and edge was handled once: **O(V + E)**.`, { ...frame(), done: true });
    return r.frames;
  },
};

export default program;
