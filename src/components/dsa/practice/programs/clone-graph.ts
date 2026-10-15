import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { asEdges, edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function cloneGraph(node) {
  if (node === null) return null;
  const copies = new Map([[node, new Node(node.val)]]);   // original -> copy
  const queue = [node];
  let head = 0;
  while (head < queue.length) {
    const orig = queue[head++];
    for (const nb of orig.neighbors) {
      if (!copies.has(nb)) {
        copies.set(nb, new Node(nb.val)); // first time we see nb: make its copy
        queue.push(nb);
      }
      copies.get(orig).neighbors.push(copies.get(nb));   // wire the copied edge
    }
  }
  return copies.get(node);
}`;

const program: Program = {
  title: "Clone a graph (BFS + map)",
  code,
  fields: [{ key: "edges", label: "edges (nodes 1 to n)", kind: "pairs", ordered: false, maxLength: 9, min: 1, max: 7, hint: "[u,v] pairs, like [1,2] [2,3]" }],
  examples: [
    { label: "Square", input: { edges: [[1, 2], [2, 3], [3, 4], [4, 1]] } },
    { label: "Triangle + tail", input: { edges: [[1, 2], [2, 3], [3, 1], [3, 4]] } },
    { label: "Two nodes", input: { edges: [[1, 2]] } },
  ],
  check: (input) => {
    const edges = input.edges as number[][];
    const n = Math.max(...edges.flat());
    const seen = new Set(edges.flat());
    for (let v = 1; v <= n; v++) if (!seen.has(v)) return `Number the nodes 1 to ${n} with no gaps; node ${v} has no edge.`;
    if (edges.some(([u, v]) => u === v)) return "Leave out self-loops.";
    const adj: number[][] = Array.from({ length: n + 1 }, () => []);
    for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
    const reach = new Set([1]);
    const stack = [1];
    while (stack.length) for (const v of adj[stack.pop()!]) if (!reach.has(v)) { reach.add(v); stack.push(v); }
    return reach.size === n ? null : "The graph must be connected: every node reachable from node 1.";
  },
  run(input) {
    const edges = asEdges(input);
    const n = Math.max(...edges.flat());
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const layout = ringLayout(n, edges, ids);
    const adj: number[][] = Array.from({ length: n + 1 }, () => []);
    for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
    const r = recorder();
    const copied = new Set<number>([1]);
    const wired: number[][] = [];
    const queue = [1];
    let head = 0;

    const frame = (orig: number | null, nb: number | null = null) => {
      const tones: Record<number, CellTone> = {};
      queue.slice(0, head).forEach((v) => (tones[v] = "done"));
      queue.slice(head).forEach((v) => (tones[v] = "tertiary"));
      if (orig !== null) tones[orig] = "primary";
      const hot: Record<string, EdgeTone> = orig !== null && nb !== null ? { [edgeKey(orig, nb)]: "active" } : {};
      const copyLayout = Object.fromEntries([...copied].map((v) => [v, layout[v]]));
      const copyTones: Record<number, CellTone> = Object.fromEntries([...copied].map((v) => [v, "success" as const]));
      if (orig !== null) copyTones[orig] = "write";
      return {
        graphs: [
          graphView("original", layout, edges, { tones, edgeTones: hot }),
          graphView("copy (new nodes)", copyLayout, wired, { directed: true, tones: copyTones, edgeTones: Object.fromEntries(wired.map(([a, b]) => [`${a}>${b}`, "done" as const])) }),
        ],
        arrays: [{ name: "queue (front → back)", values: queue.slice(head) }],
      };
    };

    r.step(lineOf(code, "const copies = "), `Copy the node we were given (**1**) and remember the pair in \`copies\`. The map is both the visited set and the way to find a node's copy.`, frame(null));
    while (head < queue.length) {
      const orig = queue[head++];
      r.step(lineOf(code, "const orig = queue[head++]"), `Take original **${orig}** from the queue and wire its copy to the copies of its neighbours.`, { ...frame(orig), vars: { orig } });
      for (const nb of adj[orig]) {
        if (!copied.has(nb)) {
          copied.add(nb);
          queue.push(nb);
          r.step(lineOf(code, "copies.set(nb, new Node(nb.val))"), `First time we see **${nb}**: create its copy and queue the original.`, { ...frame(orig, nb), vars: { orig, nb } });
        }
        wired.push([orig, nb]);
        r.step(lineOf(code, "copies.get(orig).neighbors.push"), `Wire copy ${orig} → copy ${nb}. (Copy ${nb} gets its own wire back to ${orig} when ${nb} is taken from the queue.)`, { ...frame(orig, nb), vars: { orig, nb } });
      }
    }
    r.step(lineOf(code, "return copies.get(node)"), `Every node was copied once and every edge wired from both ends: ${n} new nodes, ${wired.length} wires, and no pointer into the original. **O(V + E)**.`, { ...frame(null), done: true });
    return r.frames;
  },
};

export default program;
