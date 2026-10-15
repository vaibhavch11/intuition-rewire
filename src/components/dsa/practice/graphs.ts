import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import type { CellTone, GraphEdgeView, GraphView, Input, Pointer, Scalar } from "./types";

export { lineOf } from "./heap";

/** Where vertices sit: id → [x, y] centre. */
export type Layout = Record<number, [number, number]>;

/**
 * Vertices evenly round a circle, the first id at the top. With `edges`, they
 * go round in the order with the fewest crossing edges: depth-first order,
 * which already untangles trees and cycles, unless trying the other orders of
 * a small graph finds fewer crossings.
 */
export function ringLayout(
  n: number,
  edges: number[][] = [],
  ids: number[] = Array.from({ length: n }, (_, i) => i)
): Layout {
  const radius = n <= 3 ? 60 : n <= 5 ? 92 : n <= 7 ? 112 : 124;
  const out: Layout = {};
  untangled(walkOrder(ids, edges), edges).forEach((id, i) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
    out[id] = [Math.round(radius + radius * Math.cos(t)), Math.round(radius + radius * Math.sin(t))];
  });
  return out;
}

/** 0..n-1 with `first` moved to the front, so a search's start sits at the top. */
export const startFirst = (n: number, first: number) => [
  first,
  ...Array.from({ length: n }, (_, v) => v).filter((v) => v !== first),
];

/** How many pairs of edges cross when the vertices sit round a circle in `order`. */
function crossings(order: number[], edges: number[][]): number {
  const at = new Map(order.map((id, i) => [id, i]));
  const chords = edges.map(([u, v]) => [at.get(u)!, at.get(v)!].sort((a, b) => a - b));
  let count = 0;
  chords.forEach(([a, b], i) => {
    for (const [c, d] of chords.slice(i + 1)) {
      if (a === c || a === d || b === c || b === d) continue;
      if ((a < c && c < b) !== (a < d && d < b)) count++;   // exactly one end inside: they cross
    }
  });
  return count;
}

/**
 * The ring order with the fewest crossings, keeping `order[0]` at the top.
 * Graphs of up to 8 vertices try every order (at most 5040); ties keep `order`.
 */
function untangled(order: number[], edges: number[][]): number[] {
  let best = order;
  let fewest = crossings(order, edges);
  if (fewest === 0 || order.length > 8) return best;
  const rest = order.slice(1);
  const chosen: number[] = [order[0]];
  const used = new Array(rest.length).fill(false);
  const permute = () => {
    if (fewest === 0) return;
    if (chosen.length === order.length) {
      const c = crossings(chosen, edges);
      if (c < fewest) {
        fewest = c;
        best = [...chosen];
      }
      return;
    }
    rest.forEach((id, i) => {
      if (used[i]) return;
      used[i] = true;
      chosen.push(id);
      permute();
      chosen.pop();
      used[i] = false;
    });
  };
  permute();
  return best;
}

/** `ids` in depth-first preorder over undirected `edges`, each component in turn. */
function walkOrder(ids: number[], edges: number[][]): number[] {
  if (edges.length === 0) return ids;
  const next = new Map<number, number[]>(ids.map((id) => [id, []]));
  for (const [u, v] of edges) {
    next.get(u)?.push(v);
    next.get(v)?.push(u);
  }
  const seen = new Set<number>();
  const order: number[] = [];
  const visit = (u: number) => {
    seen.add(u);
    order.push(u);
    for (const v of next.get(u) ?? []) if (!seen.has(v)) visit(v);
  };
  for (const id of ids) if (!seen.has(id)) visit(id);
  return order;
}

/** The same key for u-v and v-u, for colouring undirected edges. */
export const edgeKey = (u: number, v: number) => `${Math.min(u, v)}-${Math.max(u, v)}`;

/** An adjacency list in edge order, as the lessons build it. */
export function adjacency(n: number, edges: number[][], directed = false): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    if (!directed) adj[v].push(u);
  }
  return adj;
}

export interface GraphParts {
  directed?: boolean;
  /** Weight per edge, in the order of `edges`. */
  weights?: Scalar[];
  tones?: Record<number, CellTone>;
  pointers?: Record<number, Pointer[]>;
  captions?: Record<number, string>;
  labels?: Record<number, Scalar>;
  /** Tone per edge, keyed by `edgeKey(u, v)` (or `"u>v"` for a directed edge). */
  edgeTones?: Record<string, EdgeTone>;
}

/** A GraphView of the given vertices and edges, placed by `layout`. */
export function graphView(name: string, layout: Layout, edges: number[][], parts: GraphParts = {}): GraphView {
  const tone = (u: number, v: number): EdgeTone | undefined =>
    parts.edgeTones?.[parts.directed ? `${u}>${v}` : edgeKey(u, v)];
  const viewEdges: GraphEdgeView[] = edges.map(([u, v], i) => ({
    from: u,
    to: v,
    weight: parts.weights?.[i] ?? (edges[i].length > 2 ? edges[i][2] : undefined),
    tone: tone(u, v),
  }));
  return {
    name,
    nodes: Object.entries(layout).map(([id, [x, y]]) => ({ id: Number(id), x, y, label: parts.labels?.[Number(id)] })),
    edges: viewEdges,
    directed: parts.directed,
    tones: parts.tones,
    pointers: parts.pointers,
    captions: parts.captions,
  };
}

/** Rejects edges that name a vertex outside 0..n-1, or a vertex joined to itself. */
export function checkEdges(n: number, edges: number[][], base = 0): string | null {
  for (const [u, v] of edges) {
    if (u < base || v < base || u >= n + base || v >= n + base) {
      return `Every edge must join vertices ${base} to ${n - 1 + base}; [${u},${v}] doesn't.`;
    }
    if (u === v) return `[${u},${v}] joins a vertex to itself; leave self-loops out.`;
  }
  return null;
}

export const asEdges = (input: Input, key = "edges") => (input[key] as number[][]).map((e) => [...e]);
