import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const heap = new Heap((a, b) => a[0] - b[0]);   // [distance, node], closest first
  heap.push([0, k]);
  while (heap.size() > 0) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;              // a stale entry: u was already reached cheaper
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {                // a cheaper way to reach v, through u
        dist[v] = d + w;
        heap.push([dist[v], v]);
      }
    }
  }
  const slowest = Math.max(...dist.slice(1));
  return slowest === Infinity ? -1 : slowest;
}`;

// The edge field reads [u,v] pairs, so each edge's time comes from a parallel list.
const program: Program = {
  title: "Network delay time (Dijkstra)",
  code,
  fields: [
    { key: "n", label: "n (nodes 1..n)", kind: "number", min: 1, max: 7 },
    { key: "edges", label: "times: [u,v] edges", kind: "pairs", ordered: false, maxLength: 10, min: 1, max: 7, hint: "[u,v] pairs, like [2,1] [2,3] [3,4]" },
    { key: "w", label: "their times (one per edge)", kind: "array", maxLength: 10, min: 0, max: 20 },
    { key: "k", label: "k (start)", kind: "number", min: 1, max: 7 },
  ],
  examples: [
    { label: "Longer is faster", input: { n: 4, edges: [[1, 2], [1, 3], [3, 2], [2, 4], [3, 4]], w: [9, 2, 3, 1, 8], k: 1 } },
    { label: "All times 1", input: { n: 4, edges: [[2, 1], [2, 3], [3, 4]], w: [1, 1, 1], k: 2 } },
    { label: "Unreachable node", input: { n: 3, edges: [[1, 2]], w: [4], k: 1 } },
  ],
  check: (input) => {
    const n = input.n as number;
    const edges = input.edges as number[][];
    const w = input.w as number[];
    if ((input.k as number) > n) return `k must be a node from 1 to ${n}.`;
    if (w.length !== edges.length) return `Give exactly one time per edge: ${edges.length} edge${edges.length === 1 ? "" : "s"}, ${w.length} time${w.length === 1 ? "" : "s"}.`;
    for (const [u, v] of edges) {
      if (u > n || v > n) return `Nodes are numbered 1 to ${n}; [${u},${v}] is outside that.`;
      if (u === v) return `[${u},${v}] goes from a node to itself.`;
    }
    if (new Set(edges.map(([u, v]) => `${u}>${v}`)).size !== edges.length) return "Each directed edge u → v may appear only once.";
    return null;
  },
  run(input) {
    const n = input.n as number;
    const k = input.k as number;
    const w = input.w as number[];
    const edges = (input.edges as number[][]).map(([u, v], i) => [u, v, w[i]]);
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const layout = ringLayout(n, edges.map(([u, v]) => [u, v]), [k, ...ids.filter((x) => x !== k)]);
    const adj: [number, number][][] = Array.from({ length: n + 1 }, () => []);
    for (const [u, v, wt] of edges) adj[u].push([v, wt]);
    const dist = new Array(n + 1).fill(Infinity);
    const done = new Set<number>();
    const heap: [number, number][] = [];
    const via: Record<number, number> = {};
    const r = recorder();

    const frame = (current: number | null, hot: [number, number] | null = null, hotTone: EdgeTone = "active", vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      ids.forEach((x) => {
        if (done.has(x)) tones[x] = "done";
        else if (dist[x] !== Infinity) tones[x] = "tertiary";
      });
      if (current !== null) tones[current] = "primary";
      const edgeTones: Record<string, EdgeTone> = {};
      Object.entries(via).forEach(([v, u]) => (edgeTones[`${u}>${v}`] = "done"));
      if (hot) edgeTones[`${hot[0]}>${hot[1]}`] = hotTone;
      return {
        graphs: [
          graphView("network (arrow: u → v, with its time)", layout, edges.map(([u, v]) => [u, v]), {
            directed: true,
            weights: edges.map(([, , wt]) => wt),
            tones,
            captions: Object.fromEntries(ids.map((x) => [x, dist[x] === Infinity ? "∞" : `${dist[x]}`])),
            edgeTones,
          }),
        ],
        arrays: [{ name: "heap [time, node], closest first", values: [...heap].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([d, x]) => `${d}, ${x}`) }],
        vars,
      };
    };
    const popMin = () => {
      let best = 0;
      heap.forEach(([d, x], i) => {
        if (d < heap[best][0] || (d === heap[best][0] && x < heap[best][1])) best = i;
      });
      return heap.splice(best, 1)[0];
    };

    dist[k] = 0;
    heap.push([0, k]);
    r.step(
      lineOf(code, "heap.push([0, k])"),
      `The signal starts at node **${k}** at time 0; every other node is ∞ for now. Edges take **different** times, so BFS's "first arrival is shortest" no longer holds. Dijkstra always continues from the **closest** node not yet settled — a min-heap finds it.`,
      frame(null)
    );
    while (heap.length > 0) {
      const [d, u] = popMin();
      if (d > dist[u]) {
        r.step(lineOf(code, "if (d > dist[u]) continue"), `Pop [${d}, ${u}]: but node ${u} was already reached at time ${dist[u]}. This entry is out of date — skip it.`, frame(null, null, "active", { d, u }));
        continue;
      }
      done.add(u);
      r.step(
        lineOf(code, "const [d, u] = heap.pop()"),
        `Pop the closest entry: node **${u}** at time **${d}**. No other route can beat it — every other route would continue from a node that's already at least this far, and times are never negative. Node ${u} is **settled**.`,
        frame(u, null, "active", { d, u })
      );
      for (const [v, wt] of adj[u]) {
        if (d + wt < dist[v]) {
          const before = dist[v];
          dist[v] = d + wt;
          via[v] = u;
          heap.push([dist[v], v]);
          r.step(
            lineOf(code, "dist[v] = d + w"),
            `${u} → ${v} takes ${wt}: reaching ${v} through ${u} costs ${d} + ${wt} = **${dist[v]}**${before === Infinity ? "" : `, better than ${before}`}. Record it and push [${dist[v]}, ${v}].`,
            frame(u, [u, v], "active", { d, u, v, w: wt })
          );
        } else {
          r.step(lineOf(code, "if (d + w < dist[v])"), `${u} → ${v} takes ${wt}: ${d} + ${wt} = ${d + wt} is no better than ${dist[v]}. Keep the old time.`, frame(u, [u, v], "muted", { d, u, v, w: wt }));
        }
      }
    }
    const slowest = Math.max(...dist.slice(1));
    r.step(
      lineOf(code, "return slowest === Infinity"),
      slowest === Infinity
        ? `The heap is empty but some node is still ∞: the signal can never reach it. The answer is **-1**.`
        : `Every node is settled. The signal reaches them all when the slowest one hears it: **${slowest}**. With a heap, Dijkstra costs **O(E log V)**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
