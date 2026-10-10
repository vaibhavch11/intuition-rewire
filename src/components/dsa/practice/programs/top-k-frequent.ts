import { SimHeap, heapTree, lineOf } from "../heap";
import { mapView } from "../structures";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function topKFrequent(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) ?? 0) + 1);
  const heap = new Heap((a, b) => a[1] - b[1]);       // [value, count]: the least frequent on top
  for (const entry of count) {
    heap.push(entry);
    if (heap.size() > k) heap.pop();                  // drop the least frequent: not in the top k
  }
  return heap.items.map(([value]) => value);
}`;

const L = {
  map: lineOf(code, "const count = new Map();"),
  count: lineOf(code, "for (const x of nums) count.set("),
  heap: lineOf(code, "const heap = new Heap("),
  push: lineOf(code, "heap.push(entry);"),
  drop: lineOf(code, "if (heap.size() > k) heap.pop();"),
  ret: lineOf(code, "return heap.items.map("),
};

type Entry = [number, number];

const program: Program = {
  title: "Top k frequent elements (a min-heap by count)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 12, min: -99, max: 999 },
    { key: "k", label: "k", kind: "number", min: 1, max: 6 },
  ],
  examples: [
    { label: "The lesson's example", input: { nums: [1, 1, 1, 2, 2, 3], k: 2 } },
    { label: "Negatives", input: { nums: [4, 1, -1, 2, -1, 2, 3], k: 2 } },
    { label: "Four values", input: { nums: [5, 7, 5, 9, 7, 5, 8, 9, 5, 7], k: 3 } },
  ],
  check(input) {
    const distinct = new Set(input.nums as number[]).size;
    if (distinct === 0) return "Enter at least one value.";
    return (input.k as number) > distinct ? `k can be at most ${distinct}, the number of distinct values.` : null;
  },
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const count = new Map<number, number>();
    const heap = new SimHeap((a: Entry, b: Entry) => a[1] - b[1]);
    const r = recorder();

    const views = (opts: { i?: number; key?: number; heapTones?: Record<number, CellTone>; showHeap?: boolean } = {}) => ({
      trees: opts.showHeap
        ? [heapTree("min-heap by count: count in the node, value under it", heap.items.map(([, c]) => c), {
            tones: opts.heapTones ?? {},
            captions: Object.fromEntries(heap.items.map(([v], j) => [j, `value ${v}`])),
          })]
        : [],
      arrays: [
        {
          name: "nums",
          values: nums,
          tones: opts.i === undefined ? {} : { ...Object.fromEntries(nums.slice(0, opts.i).map((_, j) => [j, "done" as CellTone])), [opts.i]: "primary" as CellTone },
          pointers: pointersAt(nums.length, { x: opts.i }),
        },
        ...(opts.showHeap ? [{ name: "heap: value", values: heap.items.map(([v]) => v), tones: opts.heapTones ?? {} }] : []),
      ],
      maps: [mapView("count", count, { keyLabel: "value", valueLabel: "count", marks: opts.key === undefined ? [] : [[opts.key, "write"]] })],
    });

    r.step(L.map, `First count every value with a hash map.`, { ...views(), vars: { k } });
    nums.forEach((x, i) => {
      count.set(x, (count.get(x) ?? 0) + 1);
      r.step(L.count, `x = ${x}: its count becomes **${count.get(x)}**.`, { ...views({ i, key: x }), vars: { x, k } });
    });

    r.step(L.heap, `${count.size} distinct values. Now a **min-heap ordered by count**: it keeps the ${k} most frequent so far, with the **least** frequent of them on top.`, {
      ...views({ showHeap: true }),
      vars: { k, size: 0 },
    });
    for (const entry of count) {
      const at = heap.push(entry);
      r.step(L.push, `Push value ${entry[0]} (count **${entry[1]}**)${at === 0 && heap.size() > 1 ? " — the least frequent kept, so it rises to the top" : ""}.`, {
        ...views({ key: entry[0], showHeap: true, heapTones: { [at]: "write" } }),
        vars: { k, size: heap.size() },
      });
      if (heap.size() > k) {
        const [v, c] = heap.pop()!;
        r.step(L.drop, `${heap.size() + 1} entries > k = ${k}: pop the least frequent, **value ${v}** (count ${c}). ${k} values are more frequent.`, {
          ...views({ showHeap: true, heapTones: { 0: "tertiary" } }),
          vars: { k, dropped: v, size: heap.size() },
        });
      }
    }

    const answer = heap.items.map(([v]) => v);
    r.step(L.ret, `The heap holds the **${k} most frequent** values: [${answer.join(", ")}] (any order is accepted).`, {
      ...views({ showHeap: true, heapTones: Object.fromEntries(heap.items.map((_, j) => [j, "success" as CellTone])) }),
      vars: { k, returned: `[${answer.join(", ")}]` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
