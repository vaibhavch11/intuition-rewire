import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { adjacency, asEdges, checkEdges, edgeKey, graphView, lineOf, ringLayout, startFirst } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function dfs(adj, start) {
  const visited = new Array(adj.length).fill(false);
  const order = [];
  const visit = (u) => {
    visited[u] = true;
    order.push(u);
    for (const v of adj[u]) {
      if (!visited[v]) visit(v);       // go deep before trying the next neighbour
    }
  };
  visit(start);
  return order;
}`;

const program: Program = {
  title: "Depth-first search (DFS)",
  code,
  fields: [
    { key: "n", label: "n (vertices)", kind: "number", min: 1, max: 8 },
    { key: "edges", label: "edges", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[u,v] pairs, like [0,1] [1,2]" },
    { key: "start", label: "start", kind: "number", min: 0, max: 7 },
  ],
  examples: [
    { label: "Example", input: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]], start: 0 } },
    { label: "A branchy tree", input: { n: 7, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], start: 0 } },
    { label: "A cycle", input: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], start: 0 } },
  ],
  check: (input) =>
    (input.start as number) >= (input.n as number) ? `start must be a vertex from 0 to ${(input.n as number) - 1}.` : checkEdges(input.n as number, input.edges as number[][]),
  run(input) {
    const n = input.n as number;
    const start = input.start as number;
    const edges = asEdges(input);
    const adj = adjacency(n, edges);
    const layout = ringLayout(n, edges, startFirst(n, start));
    const r = recorder();
    const visited = new Array(n).fill(false);
    const order: number[] = [];
    const calls: number[] = [];
    const tree: Record<string, EdgeTone> = {};

    const picture = (hot?: [number, number]) => {
      const tones: Record<number, CellTone> = {};
      order.forEach((v) => (tones[v] = "done"));
      calls.forEach((v) => (tones[v] = "tertiary"));
      if (calls.length) tones[calls[calls.length - 1]] = "primary";
      return graphView("graph", layout, edges, {
        tones,
        captions: Object.fromEntries(order.map((v, i) => [v, `#${i + 1}`])),
        edgeTones: hot ? { ...tree, [edgeKey(hot[0], hot[1])]: "active" } : tree,
      });
    };
    const frame = (hot?: [number, number]) => ({
      graphs: [picture(hot)],
      stacks: [{ name: "call stack", values: calls.map((v) => `visit(${v})`) }],
      arrays: [{ name: "order", values: [...order] }],
    });

    const visit = (u: number, from: number | null) => {
      visited[u] = true;
      order.push(u);
      calls.push(u);
      if (from !== null) tree[edgeKey(from, u)] = "done";
      r.step(
        lineOf(code, "visited[u] = true"),
        from === null
          ? `Call \`visit(${start})\`: mark **${start}** visited. It's the first vertex of the walk.`
          : `Dive into **${u}** before looking at ${from}'s other neighbours: mark it visited. The call stack is the path we came by.`,
        { ...frame(), vars: { u } }
      );
      for (const v of adj[u]) {
        if (visited[v]) {
          r.step(lineOf(code, "if (!visited[v]) visit(v)"), `From ${u}: neighbour **${v}** is already visited — skip it.`, { ...frame([u, v]), vars: { u, v } });
          continue;
        }
        visit(v, u);
      }
      calls.pop();
      r.step(
        lineOf(code, "for (const v of adj[u])"),
        calls.length
          ? `**${u}** has nothing new left. \`visit(${u})\` returns, and the walk backs up to **${calls[calls.length - 1]}** to try its next neighbour.`
          : `**${u}** has nothing new left, and it was the start: the walk is complete.`,
        { ...frame(), vars: { u } }
      );
    };

    r.step(lineOf(code, "visit(start)"), `Start the walk at **${start}**.`, frame());
    visit(start, null);
    const missed = n - order.length;
    r.step(
      lineOf(code, "return order"),
      `DFS visited ${order.join(", ")}: down one path as far as it goes, then back up. ${missed ? `${missed} vertex${missed === 1 ? " was" : "es were"} not reachable from ${start}.` : "Every vertex was reached."} **O(V + E)**.`,
      { ...frame(), done: true }
    );
    return r.frames;
  },
};

export default program;
