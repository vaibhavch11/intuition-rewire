import { heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function buildMinHeap(nums) {
  const n = nums.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(nums, i, n);   // every parent, bottom up
  return nums;
}

function siftDown(heap, i, n) {
  while (true) {
    const left = 2 * i + 1, right = 2 * i + 2;
    let smallest = i;
    if (left < n && heap[left] < heap[smallest]) smallest = left;
    if (right < n && heap[right] < heap[smallest]) smallest = right;
    if (smallest === i) return;                     // both children are bigger or equal
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    i = smallest;
  }
}`;

const L = {
  n: lineOf(code, "const n = nums.length;"),
  loop: lineOf(code, "for (let i = Math.floor(n / 2) - 1"),
  ret: lineOf(code, "return nums;"),
  pick: lineOf(code, "if (right < n && heap[right]"),
  stop: lineOf(code, "if (smallest === i) return;"),
  swap: lineOf(code, "[heap[i], heap[smallest]] = [heap[smallest], heap[i]];"),
};

/** Every index in the subtree rooted at i. */
function subtree(i: number, n: number): number[] {
  if (i >= n) return [];
  return [i, ...subtree(2 * i + 1, n), ...subtree(2 * i + 2, n)];
}

const program: Program = {
  title: "Build a heap bottom up (heapify)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 12, min: -99, max: 999 }],
  examples: [
    { label: "The lesson's example", input: { nums: [9, 4, 7, 1, 8, 2] } },
    { label: "Reverse sorted", input: { nums: [7, 6, 5, 4, 3, 2, 1] } },
    { label: "Already a heap", input: { nums: [1, 2, 3, 4, 5] } },
    { label: "Twelve values", input: { nums: [12, 3, 9, 15, 1, 8, 6, 11, 2, 7, 4, 10] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    const finished = new Set<number>();
    for (let i = Math.floor(n / 2); i < n; i++) finished.add(i);
    let swaps = 0;

    const views = (tones: Record<number, CellTone> = {}, marks: Record<string, number | undefined> = {}) => {
      const all: Record<number, CellTone> = {};
      for (const i of finished) all[i] = "done";
      Object.assign(all, tones);
      const pointers = pointersAt(n, marks, { smallest: "tertiary" });
      return {
        trees: [heapTree("nums as a tree (green: already a heap)", nums, { tones: all, pointers })],
        arrays: [{ name: "nums", values: nums, tones: all, pointers }],
      };
    };

    const last = Math.floor(n / 2) - 1;
    r.step(
      L.n,
      n < 2
        ? `n = ${n}: a single value (or none) is already a heap.`
        : `n = ${n}. Indexes ${last + 1} to ${n - 1} are **leaves** — a leaf on its own is already a heap. The last parent is index ⌊${n}/2⌋ − 1 = **${last}**.`,
      { ...views(), vars: { n } }
    );

    for (let start = last; start >= 0; start--) {
      r.step(L.loop, `i = ${start}: both subtrees under index ${start} are already heaps. Sift **${nums[start]}** down to make the subtree at ${start} a heap too.`, {
        ...views({ [start]: "primary" }, { i: start }),
        vars: { n, i: start, swaps },
      });
      let i = start;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < n && nums[left] < nums[smallest]) smallest = left;
        if (right < n && nums[right] < nums[smallest]) smallest = right;
        const kids = [left, right].filter((k) => k < n);
        if (smallest === i) {
          r.step(
            L.stop,
            kids.length === 0
              ? `${nums[i]} reached a leaf (index ${i}). Stop.`
              : `${nums[i]} ≤ ${kids.map((k) => nums[k]).join(" and ")}: no child is smaller. Stop.`,
            { ...views({ [i]: "success" }, { i }), vars: { n, i, swaps } }
          );
          break;
        }
        r.step(L.pick, kids.length === 2 ? `Children ${nums[left]} and ${nums[right]}: the smaller is **${nums[smallest]}** (index ${smallest}).` : `Only child: ${nums[left]} (index ${left}).`, {
          ...views({ [i]: "primary", [smallest]: "tertiary" }, { i, smallest }),
          vars: { n, i, smallest, swaps },
        });
        [nums[i], nums[smallest]] = [nums[smallest], nums[i]];
        swaps++;
        r.step(L.swap, `${nums[smallest]} > ${nums[i]}: **swap**. ${nums[smallest]} sinks to index ${smallest}.`, {
          ...views({ [smallest]: "write", [i]: "tertiary" }, { i: smallest }),
          vars: { n, i: smallest, swaps },
        });
        i = smallest;
      }
      for (const k of subtree(start, n)) finished.add(k);
    }

    r.step(
      L.ret,
      n < 2
        ? `Return it unchanged.`
        : `Every parent has been sifted down: the whole array is a min-heap with **${nums[0]}** on top, after only **${swaps} swap${swaps === 1 ? "" : "s"}** for ${n} values.`,
      { ...views({ 0: "success" }), vars: { n, swaps, returned: `[${nums.join(", ")}]` }, done: true }
    );
    return r.frames;
  },
};

export default program;
