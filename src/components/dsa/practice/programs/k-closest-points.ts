import { SimHeap, heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function kClosest(points, k) {
  const dist = ([x, y]) => x * x + y * y;            // squared distance: no square root needed
  const heap = new Heap((a, b) => dist(b) - dist(a)); // a max-heap: the farthest kept point on top
  for (const p of points) {
    heap.push(p);
    if (heap.size() > k) heap.pop();                 // drop the farthest: not among the k closest
  }
  return heap.items;
}`;

const L = {
  heap: lineOf(code, "const heap = new Heap("),
  push: lineOf(code, "heap.push(p);"),
  drop: lineOf(code, "if (heap.size() > k) heap.pop();"),
  ret: lineOf(code, "return heap.items;"),
};

type Point = [number, number];
const dist = ([x, y]: Point) => x * x + y * y;
const label = ([x, y]: Point) => `(${x},${y})`;

const program: Program = {
  title: "K closest points (a max-heap of size k)",
  code,
  fields: [
    { key: "points", label: "points", kind: "pairs", ordered: false, maxLength: 8, min: -9, max: 9 },
    { key: "k", label: "k", kind: "number", min: 1, max: 8 },
  ],
  examples: [
    { label: "The lesson's example", input: { points: [[3, 3], [5, -1], [-3, 4], [1, 1], [-3, -2]], k: 3 } },
    { label: "k = 1", input: { points: [[1, 3], [-2, 2]], k: 1 } },
    { label: "Spread out", input: { points: [[0, 9], [2, -1], [-4, -4], [6, 0], [-1, 1], [3, 5]], k: 2 } },
  ],
  check(input) {
    const n = (input.points as number[][]).length;
    return (input.k as number) > n ? `k can be at most ${n}, the number of points.` : null;
  },
  run(input) {
    const points = input.points as Point[];
    const k = input.k as number;
    const heap = new SimHeap((a: Point, b: Point) => dist(b) - dist(a));
    const r = recorder();

    const views = (i: number | undefined, tones: Record<number, CellTone> = {}) => ({
      trees: [
        heapTree("max-heap: squared distance in the node, the point under it", heap.items.map(dist), {
          tones,
          captions: Object.fromEntries(heap.items.map((p, j) => [j, label(p)])),
        }),
      ],
      arrays: [
        {
          name: "points",
          values: points.map(label),
          tones: i === undefined ? {} : { ...Object.fromEntries(points.slice(0, i).map((_, j) => [j, "done" as CellTone])), [i]: "primary" as CellTone },
          pointers: pointersAt(points.length, { p: i }),
        },
        { name: "distance (x² + y²)", values: points.map(dist) },
        { name: "heap", values: heap.items.map(label), tones },
      ],
    });

    r.step(L.heap, `An empty **max-heap by squared distance**. It will keep the ${k} closest points so far, with the **farthest** of them on top — the next one to throw out.`, {
      ...views(undefined),
      vars: { k, size: 0 },
    });

    points.forEach((p, i) => {
      const at = heap.push(p);
      r.step(L.push, `${label(p)}: distance ${p[0]}² + ${p[1]}² = **${dist(p)}**. Push it${at === 0 && heap.size() > 1 ? " — it's the farthest kept point, so it rises to the top" : ""}.`, {
        ...views(i, { [at]: "write" }),
        vars: { p: label(p), dist: dist(p), k, size: heap.size() },
      });
      if (heap.size() > k) {
        const far = heap.pop()!;
        r.step(L.drop, `${heap.size() + 1} points > k = ${k}: pop the farthest, **${label(far)}** (distance ${dist(far)}). ${k} closer points have been seen, so it can't be in the answer.`, {
          ...views(i, { 0: "tertiary" }),
          vars: { p: label(p), k, dropped: label(far), size: heap.size() },
        });
      }
    });

    const answer = heap.items.map(label);
    r.step(L.ret, `Every point has been read. The heap holds the **${k} closest**: ${answer.join(", ")} (any order is accepted).`, {
      ...views(undefined, Object.fromEntries(heap.items.map((_, j) => [j, "success" as CellTone]))),
      vars: { k, returned: `[${answer.join(", ")}]` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
