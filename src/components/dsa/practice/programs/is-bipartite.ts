import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { adjacency, asEdges, checkEdges, edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Pointer, type Program } from "../types";

const code = `function isBipartite(graph) {
  const n = graph.length;
  const color = new Array(n).fill(-1);      // -1: not coloured yet
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;          // already coloured by an earlier search
    color[s] = 0;
    const queue = [s];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      for (const v of graph[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];          // a neighbour must take the other colour
          queue.push(v);
        } else if (color[v] === color[u]) {
          return false;                     // both ends of an edge share a colour
        }
      }
    }
  }
  return true;
}`;

const program: Program = {
  title: "Is graph bipartite? (BFS colouring)",
  code,
  fields: [
    { key: "n", label: "n (vertices)", kind: "number", min: 1, max: 8 },
    { key: "edges", label: "edges", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[u,v] pairs, like [0,1] [1,2]" },
  ],
  examples: [
    { label: "Example", input: { n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]] } },
    { label: "Odd cycle", input: { n: 4, edges: [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3]] } },
    { label: "Two pieces", input: { n: 6, edges: [[0, 1], [1, 2], [3, 4], [4, 5], [5, 3]] } },
  ],
  check: (input) => checkEdges(input.n as number, input.edges as number[][]),
  run(input) {
    const n = input.n as number;
    const edges = asEdges(input);
    const graph = adjacency(n, edges);
    const layout = ringLayout(n, edges);
    const r = recorder();
    const color = new Array(n).fill(-1);
    let queue: number[] = [];
    let head = 0;

    const frame = (u: number | null, hot?: [number, number], hotTone: EdgeTone = "active", vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      color.forEach((c, v) => c !== -1 && (tones[v] = c === 0 ? "primary" : "tertiary"));
      const pointers: Record<number, Pointer[]> = u === null ? {} : { [u]: [{ label: "u", tone: "primary" }] };
      return {
        graphs: [
          graphView("graph (blue: colour 0, orange: colour 1)", layout, edges, {
            tones,
            pointers,
            captions: Object.fromEntries(color.flatMap((c, v) => (c === -1 ? [] : [[v, `colour ${c}`]]))),
            edgeTones: hot ? { [edgeKey(hot[0], hot[1])]: hotTone } : {},
          }),
        ],
        arrays: [{ name: "queue (front → back)", values: queue.slice(head) }],
        vars,
      };
    };

    r.step(lineOf(code, "const color = "), `Bipartite means the vertices split into **two teams** so that every edge joins different teams. Try to colour the graph with two colours and see whether it ever goes wrong.`, frame(null));
    for (let s = 0; s < n; s++) {
      if (color[s] !== -1) continue;
      color[s] = 0;
      queue = [s];
      head = 0;
      r.step(lineOf(code, "color[s] = 0"), `**${s}** isn't coloured yet, so it starts a new piece of the graph. Either colour would do: give it colour 0.`, frame(s, undefined, "active", { s }));
      while (head < queue.length) {
        const u = queue[head++];
        for (const v of graph[u]) {
          if (color[v] === -1) {
            color[v] = 1 - color[u];
            queue.push(v);
            r.step(
              lineOf(code, "color[v] = 1 - color[u]"),
              `${v} is next to ${u} (colour ${color[u]}), so it has **no choice**: colour ${color[v]}. Queue it to colour its own neighbours.`,
              frame(u, [u, v], "active", { u, v })
            );
          } else if (color[v] === color[u]) {
            r.step(
              lineOf(code, "return false"),
              `Edge ${u} – ${v}: both are colour **${color[u]}**. Every colour was forced, so no other choice would fix it — the graph has an odd cycle and is **not bipartite**.`,
              { ...frame(u, [u, v], "write", { u, v }), done: true }
            );
            return r.frames;
          } else {
            r.step(lineOf(code, "} else if (color[v] === color[u])"), `Edge ${u} – ${v} already joins colour ${color[u]} to colour ${color[v]}. Fine.`, frame(u, [u, v], "done", { u, v }));
          }
        }
      }
    }
    r.step(
      lineOf(code, "return true"),
      `Every vertex got a colour and every edge joins the two different colours: the graph **is bipartite**. Each vertex and edge was checked once: **O(V + E)**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
