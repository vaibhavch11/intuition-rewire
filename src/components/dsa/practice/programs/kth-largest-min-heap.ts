import { SimHeap, heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function findKthLargest(nums, k) {
  const heap = new Heap();                   // a min-heap of the k largest seen so far
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) heap.pop();         // drop the smallest: it can't be in the top k
  }
  return heap.peek();                        // the smallest of the k largest
}`;

const L = {
  heap: lineOf(code, "const heap = new Heap();"),
  push: lineOf(code, "heap.push(x);"),
  drop: lineOf(code, "if (heap.size() > k) heap.pop();"),
  ret: lineOf(code, "return heap.peek();"),
};

const program: Program = {
  title: "Kth largest element (a min-heap of size k)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10, min: -99, max: 999 },
    { key: "k", label: "k", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "The lesson's example", input: { nums: [3, 2, 1, 5, 6, 4], k: 2 } },
    { label: "Duplicates count", input: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 } },
    { label: "k = 1: the maximum", input: { nums: [7, -3, 9, 2], k: 1 } },
  ],
  check(input) {
    const n = (input.nums as number[]).length;
    if (n === 0) return "Enter at least one value.";
    return (input.k as number) > n ? `k can be at most ${n}, the number of values.` : null;
  },
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const heap = new SimHeap((a: number, b: number) => a - b);
    const r = recorder();

    const views = (i: number | undefined, tones: Record<number, CellTone> = {}) => ({
      trees: [heapTree(`min-heap of the k = ${k} largest so far`, heap.items, { tones })],
      arrays: [
        {
          name: "nums",
          values: nums,
          tones: i === undefined ? {} : { ...Object.fromEntries(nums.slice(0, i).map((_, j) => [j, "done" as CellTone])), [i]: "primary" as CellTone },
          pointers: pointersAt(nums.length, { x: i }),
        },
        { name: "heap", values: heap.items, tones },
      ],
    });

    r.step(L.heap, `An empty **min-heap**. It will keep the ${k} largest values seen so far; its top, the smallest of them, is the candidate answer.`, {
      ...views(undefined),
      vars: { k, size: 0 },
    });

    nums.forEach((x, i) => {
      const at = heap.push(x);
      r.step(L.push, `x = ${x}: push it.${at === 0 && heap.size() > 1 ? " It's the smallest kept value, so it rises to the top." : ""}`, {
        ...views(i, { [at]: "write" }),
        vars: { x, k, size: heap.size() },
      });
      if (heap.size() > k) {
        const dropped = heap.pop()!;
        r.step(L.drop, `${heap.size() + 1} values > k = ${k}: pop the smallest, **${dropped}**${dropped === x ? " — the new value itself" : ""}. ${k} larger values have been seen, so it can't be in the top ${k}.`, {
          ...views(i, { 0: "tertiary" }),
          vars: { x, k, dropped, size: heap.size() },
        });
      }
    });

    const top = heap.peek()!;
    r.step(L.ret, `The heap holds the ${k} largest values: ${[...heap.items].sort((a, b) => b - a).join(", ")}. Its top, **${top}**, is the smallest of them — the **kth largest**.`, {
      ...views(undefined, { 0: "success" }),
      vars: { k, returned: top },
      done: true,
    });
    return r.frames;
  },
};

export default program;
