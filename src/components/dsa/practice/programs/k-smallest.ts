import { heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function kSmallest(nums, k) {
  const heap = new Heap((a, b) => b - a);    // a max-heap of the k smallest so far
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) heap.pop();         // drop the largest: it can't be among the k smallest
  }
  const out = [];
  while (heap.size() > 0) out.push(heap.pop());
  return out.reverse();                      // smallest first
}`;

const L = {
  heap: lineOf(code, "const heap = new Heap("),
  push: lineOf(code, "heap.push(x);"),
  drop: lineOf(code, "if (heap.size() > k) heap.pop();"),
  drain: lineOf(code, "while (heap.size() > 0) out.push(heap.pop());"),
  ret: lineOf(code, "return out.reverse();"),
};

/** A max-heap on a plain array; push and pop return the index where the moved value settled. */
function push(h: number[], x: number) {
  h.push(x);
  let i = h.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (h[p] >= h[i]) break;
    [h[p], h[i]] = [h[i], h[p]];
    i = p;
  }
  return i;
}
function pop(h: number[]) {
  const top = h[0];
  const last = h.pop()!;
  if (h.length) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let big = i;
      if (l < h.length && h[l] > h[big]) big = l;
      if (r < h.length && h[r] > h[big]) big = r;
      if (big === i) break;
      [h[i], h[big]] = [h[big], h[i]];
      i = big;
    }
  }
  return top;
}

const program: Program = {
  title: "The k smallest values (a max-heap of size k)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10, min: -99, max: 999 },
    { key: "k", label: "k", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "The lesson's example", input: { nums: [5, 1, 9, 3, 7, 2], k: 3 } },
    { label: "k = 1", input: { nums: [8, 4, 6, 2, 9], k: 1 } },
    { label: "Duplicates", input: { nums: [4, 4, 1, 4, 2, 1], k: 3 } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const heap: number[] = [];
    const out: number[] = [];
    const r = recorder();

    const views = (i: number | undefined, tones: Record<number, CellTone> = {}, outTones: Record<number, CellTone> = {}) => ({
      trees: [heapTree(`max-heap (at most k = ${k})`, heap, { tones })],
      arrays: [
        { name: "nums", values: nums, tones: i === undefined ? {} : { ...Object.fromEntries(nums.slice(0, i).map((_, j) => [j, "done" as CellTone])), [i]: "primary" as CellTone }, pointers: pointersAt(nums.length, { x: i }) },
        { name: "heap", values: heap, tones },
        ...(out.length ? [{ name: "out", values: out, tones: outTones }] : []),
      ],
    });

    r.step(L.heap, `An empty **max-heap**. It will hold the ${k} smallest values seen so far, with the **largest** of them on top — the next one to throw out.`, {
      ...views(undefined),
      vars: { k, size: 0 },
    });

    nums.forEach((x, i) => {
      const at = push(heap, x);
      r.step(L.push, `x = ${x}: push it.${at === 0 && heap.length > 1 ? ` It's the largest kept value, so it rises to the top.` : ""} The heap holds ${heap.length} value${heap.length > 1 ? "s" : ""}.`, {
        ...views(i, { [at]: "write" }),
        vars: { x, k, size: heap.length },
      });
      if (heap.length > k) {
        const top = heap[0];
        r.step(L.drop, `size ${heap.length} > k = ${k}: the top, **${top}**, is the largest kept value — it can't be among the ${k} smallest. Pop it.`, {
          ...views(i, { 0: "primary" }),
          vars: { x, k, size: heap.length },
        });
        pop(heap);
        r.step(L.drop, `Dropped ${top}. The heap is back to ${k} values, with ${heap[0]} on top.`, {
          ...views(i, { 0: "tertiary" }),
          vars: { x, k, dropped: top, size: heap.length },
        });
      }
    });

    r.step(L.drain, `Every value has passed through. The heap holds the **${Math.min(k, nums.length)} smallest**: ${[...heap].sort((a, b) => a - b).join(", ")}. Pop them all out — largest first.`, {
      ...views(undefined, Object.fromEntries(heap.map((_, j) => [j, "success" as CellTone]))),
      vars: { k, size: heap.length },
    });
    while (heap.length) {
      out.push(pop(heap));
    }
    r.step(L.drain, `Popped in order: ${out.join(", ")} — a max-heap hands out its largest first.`, {
      ...views(undefined, {}, Object.fromEntries(out.map((_, j) => [j, "done" as CellTone]))),
      vars: { k, size: 0 },
    });
    out.reverse();
    r.step(L.ret, `Reverse to put the smallest first: **[${out.join(", ")}]**. Time O(n log k): the heap never held more than k + 1 values.`, {
      ...views(undefined, {}, Object.fromEntries(out.map((_, j) => [j, "success" as CellTone]))),
      vars: { k, returned: `[${out.join(", ")}]` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
