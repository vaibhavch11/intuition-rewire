import type { CellTone, EdgeTone, Frame, GraphView, Pointer, Scalar } from "./types";

/** Horizontal room per leaf and vertical room per level, in pixels. */
const LEAF_GAP = 46;
const LEVEL_GAP = 62;

export interface TreeParts {
  tones?: Record<number, CellTone>;
  edgeTones?: Record<number, EdgeTone>;
  pointers?: Record<number, Pointer[]>;
  captions?: Record<number, string>;
}

/**
 * A recursion or decision tree that grows as the calls happen, drawn top-down
 * with each call under its caller. Nodes are added in call order; `view()`
 * snapshots the tree so far, and `place()` gives every snapshot the layout of
 * the finished tree once the run is over, so nodes never move between steps.
 */
export function callTree(name: string) {
  const parents: (number | null)[] = [];
  const labels: Scalar[] = [];
  const edgeLabels: (Scalar | undefined)[] = [];

  return {
    get size() {
      return parents.length;
    },
    /** Adds a call under `parent` (null for the first call) and returns its id; `edge` labels the branch. */
    add(parent: number | null, label: Scalar, edge?: Scalar) {
      parents.push(parent);
      labels.push(label);
      edgeLabels.push(edge);
      return parents.length - 1;
    },
    relabel(id: number, label: Scalar) {
      labels[id] = label;
    },
    parentOf: (id: number) => parents[id],
    /** The calls from the root down to `id`. */
    pathTo(id: number) {
      const path: number[] = [];
      for (let at: number | null = id; at !== null; at = parents[at]) path.unshift(at);
      return path;
    },
    view(parts: TreeParts = {}): GraphView {
      return {
        name,
        nodes: labels.map((label, id) => ({ id, x: 0, y: 0, label })),
        edges: parents.flatMap((p, id) => (p === null ? [] : [{ from: p, to: id, tone: parts.edgeTones?.[id] ?? "idle", ...(edgeLabels[id] === undefined ? {} : { weight: edgeLabels[id] }) }])),
        tones: parts.tones,
        pointers: parts.pointers,
        captions: parts.captions,
      };
    },
    /** Lays out the finished tree and moves every recorded snapshot onto it. */
    place(frames: Frame[]) {
      const children = parents.map(() => [] as number[]);
      parents.forEach((p, id) => {
        if (p !== null) children[p].push(id);
      });
      const pos: [number, number][] = parents.map(() => [0, 0]);
      let leaf = 0;
      const walk = (id: number, depth: number) => {
        const kids = children[id];
        if (kids.length === 0) {
          pos[id] = [leaf++ * LEAF_GAP, depth * LEVEL_GAP];
          return;
        }
        for (const k of kids) walk(k, depth + 1);
        pos[id] = [(pos[kids[0]][0] + pos[kids[kids.length - 1]][0]) / 2, depth * LEVEL_GAP];
      };
      parents.forEach((p, id) => {
        if (p === null) walk(id, 0);
      });
      for (const frame of frames) {
        for (const g of frame.graphs) {
          if (g.name !== name) continue;
          for (const node of g.nodes) [node.x, node.y] = pos[node.id] ?? [0, 0];
        }
      }
    },
  };
}

/** Tones for the calls on the path from the root to `id`: the live call stack. */
export function stackTones(path: number[], current: CellTone = "write", rest: CellTone = "primary"): Record<number, CellTone> {
  const out: Record<number, CellTone> = {};
  path.forEach((id, i) => {
    out[id] = i === path.length - 1 ? current : rest;
  });
  return out;
}

/** The 1-indexed line of the k-th line (1-based) containing `snippet`. */
export function lineNth(code: string, snippet: string, k: number): number {
  let seen = 0;
  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(snippet) && ++seen === k) return i + 1;
  }
  throw new Error(`no line ${k} contains "${snippet}"`);
}
