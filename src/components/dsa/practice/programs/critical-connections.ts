import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { adjacency, asEdges, edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function criticalConnections(n, connections) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of connections) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const disc = new Array(n).fill(-1);       // when the DFS first reached each vertex
  const low = new Array(n).fill(0);         // earliest disc its subtree reaches by one back edge
  const bridges = [];
  let time = 0;
  const dfs = (u, parent) => {
    disc[u] = low[u] = time++;
    for (const v of adj[u]) {
      if (v === parent) continue;           // not straight back along the same edge
      if (disc[v] === -1) {
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.push([u, v]);   // v's subtree can't climb above it
      } else {
        low[u] = Math.min(low[u], disc[v]); // a back edge to an earlier vertex
      }
    }
  };
  dfs(0, -1);                               // the network is connected
  return bridges;
}`;

const program: Program = {
  title: "Critical connections (Tarjan's bridges)",
  code,
  fields: [
    { key: "n", label: "n (servers)", kind: "number", min: 2, max: 8 },
    { key: "edges", label: "connections", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[u,v] pairs, like [0,1] [1,2] [2,0] [1,3]" },
  ],
  examples: [
    { label: "Example", input: { n: 4, edges: [[0, 1], [1, 2], [2, 0], [1, 3]] } },
    { label: "Two loops and a bridge", input: { n: 6, edges: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3]] } },
    { label: "A chain", input: { n: 4, edges: [[0, 1], [1, 2], [2, 3]] } },
  ],
  check: (input) => {
    const n = input.n as number;
    const edges = input.edges as number[][];
    for (const [u, v] of edges) {
      if (u >= n || v >= n) return `Servers are numbered 0 to ${n - 1}; [${u},${v}] is outside that.`;
      if (u === v) return `[${u},${v}] joins a server to itself.`;
    }
    if (new Set(edges.map(([u, v]) => edgeKey(u, v))).size !== edges.length) return "Each connection may appear only once.";
    const adj = adjacency(n, edges);
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) for (const v of adj[stack.pop()!]) if (!seen.has(v)) { seen.add(v); stack.push(v); }
    return seen.size === n ? null : "The network must be connected: every server reachable from server 0.";
  },
  run(input) {
    const n = input.n as number;
    const edges = asEdges(input);
    const adj = adjacency(n, edges);
    const layout = ringLayout(n, edges);
    const disc = new Array(n).fill(-1);
    const low = new Array(n).fill(0);
    const bridges: number[][] = [];
    const calls: number[] = [];
    const edgeTones: Record<string, EdgeTone> = {};
    let time = 0;
    const r = recorder();

    const frame = (hot: [number, number] | null = null, hotTone: EdgeTone = "active", vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      disc.forEach((d, v) => d >= 0 && (tones[v] = "done"));
      calls.forEach((v) => (tones[v] = "tertiary"));
      if (calls.length) tones[calls[calls.length - 1]] = "primary";
      return {
        graphs: [
          graphView("network (caption: disc / low)", layout, edges, {
            tones,
            captions: Object.fromEntries(disc.flatMap((d, v) => (d < 0 ? [] : [[v, `${d} / ${low[v]}`]]))),
            edgeTones: hot ? { ...edgeTones, [edgeKey(hot[0], hot[1])]: hotTone } : edgeTones,
          }),
        ],
        stacks: [{ name: "call stack", values: calls.map((v) => `dfs(${v})`) }],
        arrays: [{ name: "bridges", values: bridges.map(([u, v]) => `${u}-${v}`) }],
        vars,
      };
    };

    const dfs = (u: number, parent: number) => {
      disc[u] = low[u] = time++;
      calls.push(u);
      if (parent >= 0) edgeTones[edgeKey(parent, u)] = "done";
      r.step(
        lineOf(code, "disc[u] = low[u] = time++"),
        `Reach server **${u}** at time ${disc[u]}. For now, the earliest server its part of the walk can get back to is itself: low = ${low[u]}.`,
        frame(null, "active", { u, parent })
      );
      for (const v of adj[u]) {
        if (v === parent) continue;
        if (disc[v] === -1) {
          dfs(v, u);
          const before = low[u];
          low[u] = Math.min(low[u], low[v]);
          if (low[v] > disc[u]) {
            bridges.push([u, v]);
            edgeTones[edgeKey(u, v)] = "write";
            r.step(
              lineOf(code, "if (low[v] > disc[u]) bridges.push([u, v])"),
              `Back at ${u} from ${v}: low[${v}] = ${low[v]} is **later** than ${u}'s own time ${disc[u]}. Nothing below ${v} has another way up past ${u}, so cutting ${u} – ${v} splits the network: it's **critical**.`,
              frame(null, "active", { u, v })
            );
          } else {
            r.step(
              lineOf(code, "low[u] = Math.min(low[u], low[v])"),
              `Back at ${u} from ${v}: ${v}'s part of the walk can climb to time ${low[v]} without this edge, so ${u} – ${v} is on a loop — not critical.${low[u] !== before ? ` low[${u}] becomes ${low[u]}.` : ""}`,
              frame([u, v], "done", { u, v })
            );
          }
        } else {
          const before = low[u];
          low[u] = Math.min(low[u], disc[v]);
          r.step(
            lineOf(code, "low[u] = Math.min(low[u], disc[v])"),
            disc[v] < disc[u]
              ? `${u} – ${v} leads back to ${v}, reached earlier at time ${disc[v]}: a **back edge**, so ${u} sits on a loop through ${v}.${low[u] !== before ? ` low[${u}] drops to ${low[u]}.` : ""}`
              : `${v} was already explored further down this walk, which saw this edge from its side. Nothing changes.`,
            frame([u, v], "active", { u, v })
          );
        }
      }
      calls.pop();
    };

    r.step(
      lineOf(code, "let time = 0"),
      `An edge is **critical** (a bridge) when removing it disconnects the network — that is, when it's on **no cycle**. One DFS finds them all: number the servers in the order the walk reaches them (\`disc\`), and track the earliest number each part of the walk can get back to (\`low\`).`,
      frame()
    );
    dfs(0, -1);
    r.step(
      lineOf(code, "return bridges"),
      bridges.length
        ? `The walk is done. Critical connections: **${bridges.map(([u, v]) => `[${u}, ${v}]`).join(", ")}**. One DFS over every server and connection: **O(V + E)**.`
        : `The walk is done and no connection is critical: every one lies on a loop. **O(V + E)**.`,
      { ...frame(), done: true }
    );
    return r.frames;
  },
};

export default program;
