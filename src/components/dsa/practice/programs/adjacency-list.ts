import { asEdges, checkEdges, edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type MapView, type Program } from "../types";

const code = `function buildGraph(n, edges) {
  const adj = Array.from({ length: n }, () => []);   // one empty list per vertex
  for (const [u, v] of edges) {
    adj[u].push(v);           // u lists v as a neighbour...
    adj[v].push(u);           // ...and v lists u (leave this out for a directed graph)
  }
  return adj;
}`;

const program: Program = {
  title: "Build an adjacency list",
  code,
  fields: [
    { key: "n", label: "n (vertices)", kind: "number", min: 1, max: 8 },
    { key: "edges", label: "edges", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[u,v] pairs, like [0,1] [1,2]" },
  ],
  examples: [
    { label: "Example", input: { n: 5, edges: [[0, 1], [0, 2], [1, 2], [1, 3], [3, 4]] } },
    { label: "A chain", input: { n: 4, edges: [[0, 1], [1, 2], [2, 3]] } },
    { label: "A star", input: { n: 5, edges: [[0, 1], [0, 2], [0, 3], [0, 4]] } },
  ],
  check: (input) => checkEdges(input.n as number, input.edges as number[][]),
  run(input) {
    const n = input.n as number;
    const edges = asEdges(input);
    const layout = ringLayout(n, edges);
    const adj: number[][] = Array.from({ length: n }, () => []);
    const r = recorder();
    const lists = (hot: number[] = []): MapView => ({
      name: "adj (vertex → neighbours)",
      entries: adj.map((nb, v) => [v, nb.length ? nb.join(", ") : "—"]),
      tones: Object.fromEntries(hot.map((v) => [v, "write" as const])),
      keyLabel: "vertex",
      valueLabel: "neighbours",
    });
    const added: number[][] = [];
    const picture = (hot?: number[], tones: Record<number, "primary"> = {}) =>
      graphView("graph", layout, added, {
        tones,
        edgeTones: hot ? { [edgeKey(hot[0], hot[1])]: "active" } : {},
      });

    r.step(lineOf(code, "const adj = "), `Start with an **empty list** for each of the ${n} vertices. Nothing is joined yet.`, {
      graphs: [picture()],
      maps: [lists()],
    });
    for (const [u, v] of edges) {
      added.push([u, v]);
      adj[u].push(v);
      r.step(lineOf(code, "adj[u].push(v)"), `Edge \`[${u}, ${v}]\`: vertex **${u}** gets **${v}** as a neighbour.`, {
        graphs: [picture([u, v], { [u]: "primary" })],
        maps: [lists([u])],
        vars: { u, v },
      });
      adj[v].push(u);
      r.step(lineOf(code, "adj[v].push(u)"), `The edge works both ways, so vertex **${v}** gets **${u}** too. One edge, two list entries.`, {
        graphs: [picture([u, v], { [v]: "primary" })],
        maps: [lists([v])],
        vars: { u, v },
      });
    }
    const total = adj.reduce((s, nb) => s + nb.length, 0);
    r.step(
      lineOf(code, "return adj"),
      `Done: ${edges.length} edge${edges.length === 1 ? "" : "s"} made ${total} list entries — always twice the edge count in an undirected graph. Asking "who are the neighbours of v?" now just reads one list.`,
      { graphs: [picture()], maps: [lists()], done: true }
    );
    return r.frames;
  },
};

export default program;
