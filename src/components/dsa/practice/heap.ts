import type { CellTone, EdgeTone, Pointer, Scalar, TreeNodeView, TreeView } from "./types";

/**
 * The complete binary tree of a heap stored in an array: node i is array
 * index i, with children 2i + 1 and 2i + 2. Tones and pointers are keyed by
 * index, so the tree and the array can share them. Only the first `size`
 * values belong to the heap (heap sort keeps a sorted tail after it).
 */
export function heapTree(
  name: string,
  values: Scalar[],
  {
    size = values.length,
    tones = {},
    pointers = {},
    edgeTones = {},
    captions,
  }: {
    size?: number;
    tones?: Record<number, CellTone>;
    pointers?: Record<number, Pointer[]>;
    edgeTones?: Record<number, EdgeTone>;
    /** Text under each node; defaults to its array index. */
    captions?: Record<number, string>;
  } = {}
): TreeView {
  const nodes: TreeNodeView[] = [];
  for (let i = 0; i < size; i++) {
    nodes.push({
      id: i,
      value: values[i],
      left: 2 * i + 1 < size ? 2 * i + 1 : null,
      right: 2 * i + 2 < size ? 2 * i + 2 : null,
    });
  }
  return {
    name,
    nodes,
    root: size > 0 ? 0 : null,
    tones,
    pointers,
    edgeTones,
    captions: captions ?? Object.fromEntries(nodes.map((n) => [n.id, String(n.id)])),
  };
}

/** Edge tones that light up the path from index `from` up to the root. */
export function pathUp(from: number, tone: EdgeTone = "active"): Record<number, EdgeTone> {
  const out: Record<number, EdgeTone> = {};
  for (let i = from; i > 0; i = Math.floor((i - 1) / 2)) out[i] = tone;
  return out;
}

/** The 1-indexed line of `code` holding `snippet`, so frames never point at a stale line number. */
export function lineOf(code: string, snippet: string): number {
  const index = code.split("\n").findIndex((line) => line.includes(snippet));
  if (index < 0) throw new Error(`no line contains "${snippet}"`);
  return index + 1;
}

export const parentOf = (i: number) => Math.floor((i - 1) / 2);

/**
 * The course's JavaScript `Heap` class, step for step (same sift order, same
 * tie-breaking), so a simulator shows exactly the array the lesson's code
 * would hold. push and the sifts report where the moved item settled.
 */
export class SimHeap<T> {
  items: T[] = [];

  constructor(readonly compare: (a: T, b: T) => number) {}

  static from<T>(values: T[], compare: (a: T, b: T) => number): SimHeap<T> {
    const heap = new SimHeap(compare);
    heap.items = [...values];
    for (let i = Math.floor(values.length / 2) - 1; i >= 0; i--) heap.siftDown(i);
    return heap;
  }

  size() {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  /** Adds x and returns the index it settled at. */
  push(x: T): number {
    this.items.push(x);
    return this.siftUp(this.items.length - 1);
  }

  pop(): T | undefined {
    const a = this.items;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  siftUp(i: number): number {
    const a = this.items;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(a[parent], a[i]) <= 0) break;
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
    }
    return i;
  }

  siftDown(i: number): number {
    const a = this.items;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let first = i;
      if (left < a.length && this.compare(a[left], a[first]) < 0) first = left;
      if (right < a.length && this.compare(a[right], a[first]) < 0) first = right;
      if (first === i) return i;
      [a[i], a[first]] = [a[first], a[i]];
      i = first;
    }
  }
}
