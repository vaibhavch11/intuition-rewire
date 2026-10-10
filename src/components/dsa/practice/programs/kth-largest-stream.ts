import { SimHeap, heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = new Heap();                  // a min-heap of the k largest so far
    for (const x of nums) this.add(x);
  }
  add(val) {
    this.heap.push(val);
    if (this.heap.size() > this.k) this.heap.pop();   // drop the smallest: it left the top k
    return this.heap.peek();                 // the smallest of the k largest = the kth largest
  }
}`;

const L = {
  heap: lineOf(code, "this.heap = new Heap();"),
  init: lineOf(code, "for (const x of nums) this.add(x);"),
  push: lineOf(code, "this.heap.push(val);"),
  drop: lineOf(code, "if (this.heap.size() > this.k) this.heap.pop();"),
  peek: lineOf(code, "return this.heap.peek();"),
};

const program: Program = {
  title: "Kth largest in a stream (a min-heap of size k)",
  code,
  fields: [
    { key: "k", label: "k", kind: "number", min: 1, max: 6 },
    { key: "nums", label: "nums (constructor)", kind: "array", maxLength: 6, min: -99, max: 999 },
    { key: "adds", label: "values to add", kind: "array", maxLength: 6, min: -99, max: 999 },
  ],
  examples: [
    { label: "The lesson's example", input: { k: 3, nums: [4, 5, 8, 2], adds: [3, 5, 10, 9, 4] } },
    { label: "k = 1: the maximum", input: { k: 1, nums: [], adds: [-3, -2, -4, 0, 4] } },
    { label: "Duplicates", input: { k: 2, nums: [0], adds: [-1, 1, -2, -4, 3] } },
  ],
  check(input) {
    const k = input.k as number;
    const n = (input.nums as number[]).length;
    if ((input.adds as number[]).length === 0) return "Add at least one value.";
    return n < k - 1 ? `With k = ${k}, start with at least ${k - 1} values, so the first add has k values to choose from.` : null;
  },
  run(input) {
    const k = input.k as number;
    const nums = input.nums as number[];
    const adds = input.adds as number[];
    const heap = new SimHeap((a: number, b: number) => a - b);
    const answers: number[] = [];
    const r = recorder();

    const views = (tones: Record<number, CellTone> = {}, stream: { name: string; values: number[]; i?: number }) => ({
      trees: [heapTree(`min-heap: the ${k} largest so far`, heap.items, { tones })],
      arrays: [
        {
          name: stream.name,
          values: stream.values,
          tones: stream.i === undefined ? {} : { ...Object.fromEntries(stream.values.slice(0, stream.i).map((_, j) => [j, "done" as CellTone])), [stream.i]: "primary" as CellTone },
          pointers: pointersAt(stream.values.length, { val: stream.i }),
        },
        { name: "heap", values: heap.items, tones },
        ...(answers.length ? [{ name: "add() returned", values: answers, tones: { [answers.length - 1]: "write" as CellTone } }] : []),
      ],
    });

    r.step(L.heap, `k = ${k}. Start an empty **min-heap**: it will keep only the ${k} largest values, with the smallest of them — the kth largest — on top.`, {
      ...views({}, { name: "nums", values: nums }),
      vars: { k, size: 0 },
    });

    const add = (val: number, stream: { name: string; values: number[]; i: number }, inCtor: boolean) => {
      const at = heap.push(val);
      r.step(L.push, `${inCtor ? "Constructor: " : ""}**add(${val})** — push it.${at === 0 && heap.size() > 1 ? ` It's the smallest kept value, so it rises to the top.` : ""}`, {
        ...views({ [at]: "write" }, stream),
        vars: { k, val, size: heap.size() },
      });
      if (heap.size() > k) {
        const dropped = heap.peek()!;
        heap.pop();
        r.step(L.drop, `${k + 1} values > k: pop the smallest, **${dropped}**${dropped === val ? " — the new value itself, which isn't in the top k" : ""}. It can never be the kth largest again.`, {
          ...views(heap.size() ? { 0: "tertiary" } : {}, stream),
          vars: { k, val, dropped, size: heap.size() },
        });
      }
      if (!inCtor) {
        const top = heap.peek()!;
        answers.push(top);
        r.step(L.peek, `Return the top, **${top}**: the smallest of the ${k} largest, so the **${k === 1 ? "largest" : `${k}${k === 2 ? "nd" : k === 3 ? "rd" : "th"} largest`}** value so far.`, {
          ...views({ 0: "success" }, stream),
          vars: { k, val, returned: top, size: heap.size() },
        });
      }
    };

    nums.forEach((x, i) => add(x, { name: "nums", values: nums, i }, true));
    if (nums.length) {
      r.step(L.init, `The constructor is done: the heap holds the ${heap.size() < k ? `${heap.size()} values so far` : `${k} largest of nums`}${heap.size() ? `, ${heap.peek()} on top` : ""}.`, {
        ...views({}, { name: "nums", values: nums }),
        vars: { k, size: heap.size() },
      });
    }
    adds.forEach((v, i) => add(v, { name: "adds", values: adds, i }, false));

    r.step(L.peek, `Done. Each add cost O(log k), and the heap never held more than ${k + 1} values — however long the stream gets.`, {
      ...views({}, { name: "adds", values: adds }),
      vars: { k, size: heap.size() },
      done: true,
    });
    return r.frames;
  },
};

export default program;
