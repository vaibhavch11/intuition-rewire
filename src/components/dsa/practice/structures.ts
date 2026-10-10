import type {
  CellTone,
  EdgeTone,
  ListLink,
  ListNodeView,
  ListView,
  MapView,
  Pointer,
  PointerTone,
  Scalar,
  TreeNodeView,
  TreeView,
} from "./types";

/** The id a list's trailing null box uses, so pointers can point at it. */
export const NULL_ID = -1;

/** One highlighted map entry: its key, a tone, and an optional tag above it. */
export type MapMark<K> = [key: K, tone: CellTone, tag?: string, tagTone?: PointerTone];

/**
 * A MapView of a JavaScript Map, in insertion order. Entries are marked by
 * key, so a program never has to work out where a key sits in the table.
 */
export function mapView<K extends Scalar, V extends Scalar>(
  name: string,
  map: Map<K, V>,
  { keyLabel, valueLabel, marks = [] }: { keyLabel?: string; valueLabel?: string; marks?: MapMark<K>[] } = {}
): MapView {
  const keys = [...map.keys()];
  const tones: Record<number, CellTone> = {};
  const pointers: Record<number, Pointer[]> = {};
  for (const [key, tone, tag, tagTone] of marks) {
    const i = keys.indexOf(key);
    if (i < 0) continue;
    tones[i] = tone;
    if (tag) (pointers[i] ??= []).push({ label: tag, tone: tagTone ?? "primary" });
  }
  return { name, entries: [...map].map(([k, v]) => [k, v]), tones, pointers, keyLabel, valueLabel };
}

/** Pointer tags keyed by node id, from `{ label: id }`; missing ids are skipped. */
export function tagsAt(
  marks: Record<string, number | null | undefined>,
  tones: Record<string, PointerTone> = {}
): Record<number, Pointer[]> {
  const out: Record<number, Pointer[]> = {};
  for (const [label, id] of Object.entries(marks)) {
    if (id === undefined || id === null) continue;
    (out[id] ??= []).push({ label, tone: tones[label] ?? "primary" });
  }
  return out;
}

/**
 * A plain singly linked list laid out left to right: node i has id i and sits
 * in column i, and a null box closes the chain unless `nullEnd` is false.
 */
export function chain(
  name: string,
  values: number[],
  {
    tones = {},
    pointers = {},
    linkTones = {},
    row = 0,
    startCol = 0,
    idOffset = 0,
    nullEnd = true,
  }: {
    tones?: Record<number, CellTone>;
    pointers?: Record<number, Pointer[]>;
    linkTones?: Record<number, EdgeTone>;
    row?: number;
    startCol?: number;
    idOffset?: number;
    nullEnd?: boolean;
  } = {}
): ListView {
  const nodes: ListNodeView[] = values.map((value, i) => ({
    id: idOffset + i,
    value,
    col: startCol + i,
    row,
    tone: tones[idOffset + i],
  }));
  const links: ListLink[] = [];
  for (let i = 0; i + 1 < values.length; i++) {
    links.push({ from: idOffset + i, to: idOffset + i + 1, tone: linkTones[idOffset + i] });
  }
  const nullId = NULL_ID - idOffset;
  if (nullEnd) {
    nodes.push({ id: nullId, value: null, col: startCol + values.length, row });
    if (values.length > 0) {
      const last = idOffset + values.length - 1;
      links.push({ from: last, to: nullId, tone: linkTones[last] });
    }
  }
  return { name, nodes, links, pointers };
}

// ---------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------

export interface Tree {
  nodes: TreeNodeView[];
  root: number | null;
}

/** Builds a tree from LeetCode-style level order, where null is a missing child. Ids are 0, 1, 2… in level order. */
export function buildTree(values: (number | null)[]): Tree {
  if (values.length === 0 || values[0] === null) return { nodes: [], root: null };
  const nodes: TreeNodeView[] = [{ id: 0, value: values[0], left: null, right: null }];
  const queue = [nodes[0]];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const parent = queue.shift()!;
    for (const side of ["left", "right"] as const) {
      if (i >= values.length) break;
      const value = values[i++];
      if (value === null) continue;
      const child: TreeNodeView = { id: nodes.length, value, left: null, right: null };
      nodes.push(child);
      parent[side] = child.id;
      queue.push(child);
    }
  }
  return { nodes, root: 0 };
}

/** Looks up nodes by id; `node(id)` throws if the id is missing. */
export function indexTree(tree: Tree) {
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  return {
    byId,
    node: (id: number) => {
      const n = byId.get(id);
      if (!n) throw new Error(`no tree node ${id}`);
      return n;
    },
  };
}

export function treeView(
  name: string,
  tree: Tree,
  parts: Omit<TreeView, "name" | "nodes" | "root"> = {}
): TreeView {
  return { name, nodes: tree.nodes, root: tree.root, ...parts };
}

/** Tones every node in `ids` with `tone`, on top of `base`. */
export function toneIds(ids: Iterable<number>, tone: CellTone, base: Record<number, CellTone> = {}) {
  const out = { ...base };
  for (const id of ids) out[id] = tone;
  return out;
}

// ---------------------------------------------------------------------------
// Operation lists: "push 1, push 2, pop, top"
// ---------------------------------------------------------------------------

export interface Op {
  name: string;
  arg?: number;
}

/**
 * Parses a comma-separated list of operations. `withArg` names take one whole
 * number (`push 5`); the rest take none. Returns the ops or a reason it can't.
 */
export function parseOps(text: string, withArg: string[], noArg: string[], max = 12): Op[] | string {
  const parts = text.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "Enter at least one operation, like push 3.";
  if (parts.length > max) return `Use at most ${max} operations so every step stays readable.`;
  const ops: Op[] = [];
  for (const part of parts) {
    const [rawName, rawArg, ...rest] = part.split(/\s+/);
    const name = rawName.toLowerCase();
    const known = [...withArg, ...noArg].find((n) => n.toLowerCase() === name);
    if (!known || rest.length > 0) return `"${part}" isn't an operation. Use ${[...withArg.map((n) => `${n} 5`), ...noArg].join(", ")}.`;
    if (withArg.includes(known)) {
      if (rawArg === undefined || !/^-?\d+$/.test(rawArg)) return `"${part}": ${known} needs a whole number, like ${known} 5.`;
      const arg = Number(rawArg);
      if (Math.abs(arg) > 999) return `"${part}": keep numbers between -999 and 999.`;
      ops.push({ name: known, arg });
    } else {
      if (rawArg !== undefined) return `"${part}": ${known} doesn't take a number.`;
      ops.push({ name: known });
    }
  }
  return ops;
}
