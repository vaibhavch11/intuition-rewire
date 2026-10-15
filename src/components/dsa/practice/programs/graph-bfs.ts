import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { adjacency, asEdges, checkEdges, edgeKey, graphView, lineOf, ringLayout, startFirst } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function bfs(adj, start) {
  const visited = new Array(adj.length).fill(false);
  const order = [];
  const queue = [start];
  visited[start] = true;               // mark on the way IN, so nobody adds it twice
  let head = 0;                        // the queue's front (faster than queue.shift())
  while (head < queue.length) {
    const u = queue[head++];           // the oldest vertex: the nearest one left
    order.push(u);
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        queue.push(v);                 // one ring further out
      }
    }
  }
  return order;
}`;

const program: Program = {
  title: "Breadth-first search (BFS)",
  code,
  fields: [
    { key: "n", label: "n (vertices)", kind: "number", min: 1, max: 8 },
    { key: "edges", label: "edges", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[u,v] pairs, like [0,1] [1,2]" },
    { key: "start", label: "start", kind: "number", min: 0, max: 7 },
  ],
  examples: [
    { label: "Example", input: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]], start: 0 } },
    { label: "Two pieces", input: { n: 5, edges: [[0, 1], [1, 2], [3, 4]], start: 1 } },
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
    const dist: Record<number, string> = {};
    const order: number[] = [];
    const queue = [start];
    const tree: Record<string, EdgeTone> = {};
    let head = 0;

    const picture = (current: number | null, hot?: [number, number]) => {
      const tones: Record<number, CellTone> = {};
      order.forEach((v) => (tones[v] = "done"));
      queue.slice(head).forEach((v) => (tones[v] = "tertiary"));
      if (current !== null) tones[current] = "primary";
      return graphView("graph", layout, edges, {
        tones,
        captions: dist,
        edgeTones: hot ? { ...tree, [edgeKey(hot[0], hot[1])]: "active" } : tree,
        pointers: current !== null ? { [current]: [{ label: "u" }] } : {},
      });
    };
    const lists = () => [
      { name: "queue (front → back)", values: queue.slice(head) },
      { name: "order", values: [...order] },
    ];

    visited[start] = true;
    dist[start] = "d=0";
    r.step(lineOf(code, "visited[start] = true"), `Start at **${start}**: put it in the queue and mark it visited right away, so nothing can add it again. Its distance is 0.`, {
      graphs: [picture(null)],
      arrays: lists(),
    });

    while (head < queue.length) {
      const u = queue[head++];
      order.push(u);
      r.step(lineOf(code, "const u = queue[head++]"), `Take **${u}** from the **front** of the queue — the oldest, so the nearest vertex still waiting (distance ${dist[u].slice(2)}).`, {
        graphs: [picture(u)],
        arrays: lists(),
        vars: { u },
      });
      for (const v of adj[u]) {
        if (visited[v]) {
          r.step(lineOf(code, "if (!visited[v])"), `Neighbour **${v}** is already visited — skip it. Without this check, the walk would go round in circles.`, {
            graphs: [picture(u, [u, v])],
            arrays: lists(),
            vars: { u, v },
          });
          continue;
        }
        visited[v] = true;
        queue.push(v);
        dist[v] = `d=${Number(dist[u].slice(2)) + 1}`;
        tree[edgeKey(u, v)] = "done";
        r.step(lineOf(code, "queue.push(v)"), `Neighbour **${v}** is new: mark it and add it to the **back** of the queue. It's one edge further than ${u}, at distance ${dist[v].slice(2)}.`, {
          graphs: [picture(u, [u, v])],
          arrays: lists(),
          vars: { u, v },
        });
      }
    }
    const missed = n - order.length;
    r.step(
      lineOf(code, "return order"),
      `The queue is empty. BFS visited ${order.join(", ")} — ring by ring, nearest first. ${missed ? `${missed} vertex${missed === 1 ? " was" : "es were"} never reached: ${missed === 1 ? "it's" : "they're"} in another piece of the graph.` : "Every vertex was reached."} **O(V + E)**.`,
      { graphs: [picture(null)], arrays: lists(), done: true }
    );
    return r.frames;
  },
};

export default program;
