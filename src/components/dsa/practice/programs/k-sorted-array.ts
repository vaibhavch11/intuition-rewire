import { SimHeap, heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function sortKSorted(nums, k) {
  const heap = new Heap();                    // a min-heap of the next k + 1 candidates
  const out = [];
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) out.push(heap.pop()); // the smallest of k + 1 neighbours is next in order
  }
  while (heap.size() > 0) out.push(heap.pop());
  return out;
}`;

const L = {
  heap: lineOf(code, "const heap = new Heap();"),
  push: lineOf(code, "heap.push(x);"),
  pop: lineOf(code, "if (heap.size() > k) out.push(heap.pop());"),
  drain: lineOf(code, "while (heap.size() > 0) out.push(heap.pop());"),
  ret: lineOf(code, "return out;"),
};

/** True when every value of nums is at most k places from its index in sorted order. */
function isKSorted(nums: number[], k: number) {
  const order = nums.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return order.every(([, i], pos) => Math.abs(i - pos) <= k);
}

const program: Program = {
  title: "Sort a k-sorted array (a min-heap of size k + 1)",
  code,
  fields: [
    { key: "nums", label: "nums (each value at most k places from home)", kind: "array", maxLength: 10, min: -99, max: 999 },
    { key: "k", label: "k", kind: "number", min: 0, max: 9 },
  ],
  examples: [
    { label: "The lesson's example", input: { nums: [6, 5, 3, 2, 8, 10, 9], k: 3 } },
    { label: "k = 1", input: { nums: [2, 1, 4, 3, 6, 5], k: 1 } },
    { label: "Windows reversed", input: { nums: [3, 2, 1, 6, 5, 4], k: 2 } },
  ],
  check(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    if (nums.length === 0) return "Enter at least one value.";
    return isKSorted(nums, k) ? null : `Some value is more than k = ${k} places from where it belongs in sorted order. Raise k, or move values closer to home.`;
  },
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const heap = new SimHeap((a: number, b: number) => a - b);
    const out: number[] = [];
    const r = recorder();

    const views = (i: number | undefined, tones: Record<number, CellTone> = {}, fresh = false) => ({
      trees: [heapTree(`min-heap: at most k + 1 = ${k + 1} candidates`, heap.items, { tones })],
      arrays: [
        {
          name: "nums",
          values: nums,
          tones: i === undefined ? Object.fromEntries(nums.map((_, j) => [j, "done" as CellTone])) : { ...Object.fromEntries(nums.slice(0, i).map((_, j) => [j, "done" as CellTone])), [i]: "primary" as CellTone },
          pointers: pointersAt(nums.length, { x: i }),
        },
        { name: "heap", values: heap.items, tones },
        ...(out.length ? [{ name: "out", values: out, tones: fresh ? { [out.length - 1]: "write" as CellTone } : {} }] : []),
      ],
    });

    r.step(L.heap, `k = ${k}: every value is at most ${k} place${k === 1 ? "" : "s"} from home. So the next value in sorted order is always among the next **${k + 1}** — keep them in a **min-heap**.`, {
      ...views(undefined, {}),
      vars: { k, size: 0 },
    });

    nums.forEach((x, i) => {
      const at = heap.push(x);
      r.step(L.push, `x = ${x}: push it.${at === 0 && heap.size() > 1 ? " It's the smallest candidate, so it rises to the top." : ""}`, {
        ...views(i, { [at]: "write" }),
        vars: { x, k, size: heap.size() },
      });
      if (heap.size() > k) {
        const v = heap.pop()!;
        out.push(v);
        r.step(L.pop, `The heap holds ${k + 1} values — every candidate for the next position. The smallest, **${v}**, goes next in the output.`, {
          ...views(i, heap.size() ? { 0: "tertiary" } : {}, true),
          vars: { x, k, size: heap.size() },
        });
      }
    });

    while (heap.size() > 0) {
      const v = heap.pop()!;
      out.push(v);
      r.step(L.drain, `No values left to read: empty the heap, smallest first. **${v}** goes next.`, {
        ...views(undefined, heap.size() ? { 0: "tertiary" } : {}, true),
        vars: { k, size: heap.size() },
      });
    }

    r.step(L.ret, `Sorted: **[${out.join(", ")}]**. Every value was pushed and popped once, in a heap of at most ${k + 1}: O(n log k).`, {
      ...views(undefined, {}),
      vars: { k, returned: `[${out.join(", ")}]` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
