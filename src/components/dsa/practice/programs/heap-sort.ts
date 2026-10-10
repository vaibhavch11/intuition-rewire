import { heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function heapSort(nums) {
  const n = nums.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(nums, i, n);   // 1. build a max-heap
  for (let end = n - 1; end > 0; end--) {
    [nums[0], nums[end]] = [nums[end], nums[0]];   // 2. the largest goes to the end...
    siftDown(nums, 0, end);                        //    ...and the heap shrinks to nums[0..end-1]
  }
  return nums;
}

function siftDown(heap, i, n) {                   // max-heap: sink below the larger child
  while (true) {
    const left = 2 * i + 1, right = 2 * i + 2;
    let largest = i;
    if (left < n && heap[left] > heap[largest]) largest = left;
    if (right < n && heap[right] > heap[largest]) largest = right;
    if (largest === i) return;
    [heap[i], heap[largest]] = [heap[largest], heap[i]];
    i = largest;
  }
}`;

const L = {
  n: lineOf(code, "const n = nums.length;"),
  build: lineOf(code, "// 1. build a max-heap"),
  toEnd: lineOf(code, "[nums[0], nums[end]] = [nums[end], nums[0]];"),
  shrink: lineOf(code, "siftDown(nums, 0, end);"),
  ret: lineOf(code, "return nums;"),
  pick: lineOf(code, "if (right < n && heap[right] > heap[largest])"),
  stop: lineOf(code, "if (largest === i) return;"),
  swap: lineOf(code, "[heap[i], heap[largest]] = [heap[largest], heap[i]];"),
};

const program: Program = {
  title: "Heap sort (in place)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10, min: -99, max: 999 }],
  examples: [
    { label: "The lesson's example", input: { nums: [5, 2, 9, 1, 6, 3] } },
    { label: "Duplicates", input: { nums: [4, 1, 4, 2, 1] } },
    { label: "Already sorted", input: { nums: [1, 2, 3, 4, 5] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    let heapSize = n;

    const views = (tones: Record<number, CellTone> = {}, marks: Record<string, number | undefined> = {}) => {
      const all: Record<number, CellTone> = {};
      for (let i = heapSize; i < n; i++) all[i] = "done";
      Object.assign(all, tones);
      const pointers = pointersAt(n, marks, { largest: "tertiary", end: "secondary" });
      return {
        trees: [heapTree(`max-heap: nums[0..${Math.max(heapSize - 1, 0)}]`, nums, { size: heapSize, tones: all, pointers })],
        arrays: [{ name: "nums (green: sorted)", values: nums, tones: all, pointers }],
      };
    };

    // Sifts nums[i] down within nums[0..size-1], recording every comparison and swap.
    const siftDown = (start: number, size: number) => {
      let i = start;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let largest = i;
        if (left < size && nums[left] > nums[largest]) largest = left;
        if (right < size && nums[right] > nums[largest]) largest = right;
        const kids = [left, right].filter((k) => k < size);
        if (largest === i) {
          r.step(
            L.stop,
            kids.length === 0 ? `${nums[i]} is at a leaf of the heap. Stop.` : `${nums[i]} ≥ ${kids.map((k) => nums[k]).join(" and ")}: no child is larger. Stop.`,
            { ...views({ [i]: "success" }, { i }), vars: { n, i, size } }
          );
          return;
        }
        r.step(L.pick, kids.length === 2 ? `Children ${nums[left]} and ${nums[right]}: the larger is **${nums[largest]}**.` : `Only child: ${nums[left]}.`, {
          ...views({ [i]: "primary", [largest]: "tertiary" }, { i, largest }),
          vars: { n, i, largest, size },
        });
        [nums[i], nums[largest]] = [nums[largest], nums[i]];
        r.step(L.swap, `${nums[largest]} < ${nums[i]}: **swap** — ${nums[largest]} sinks to index ${largest}.`, {
          ...views({ [largest]: "write", [i]: "tertiary" }, { i: largest }),
          vars: { n, i: largest, size },
        });
        i = largest;
      }
    };

    r.step(L.n, n < 2 ? `n = ${n}: already sorted.` : `n = ${n}. **Phase 1**: turn the array into a **max-heap**, sifting each parent down from index ${Math.floor(n / 2) - 1} back to the root.`, {
      ...views(),
      vars: { n },
    });
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      r.step(L.build, `Sift ${nums[i]} (index ${i}) down.`, { ...views({ [i]: "primary" }, { i }), vars: { n, i, size: n } });
      siftDown(i, n);
    }
    if (n >= 2) {
      r.step(L.build, `A max-heap: the largest value, **${nums[0]}**, is at index 0. **Phase 2**: move it to the end, again and again.`, {
        ...views({ 0: "success" }),
        vars: { n, size: n },
      });
    }

    for (let end = n - 1; end > 0; end--) {
      const big = nums[0];
      [nums[0], nums[end]] = [nums[end], nums[0]];
      heapSize = end;
      r.step(L.toEnd, `Swap the top, **${big}**, with nums[${end}]. ${big} is now in its final place; the heap shrinks to indexes 0..${end - 1}.`, {
        ...views({ [end]: "success", 0: "write" }, { end }),
        vars: { n, end, size: heapSize },
      });
      r.step(L.shrink, `${nums[0]} landed on top of the smaller heap: sift it down.`, { ...views({ 0: "primary" }, { i: 0, end }), vars: { n, end, size: heapSize } });
      siftDown(0, heapSize);
    }
    heapSize = 0;

    r.step(L.ret, `The heap is empty and the whole array is sorted: **[${nums.join(", ")}]**. In place, O(n log n).`, {
      ...views(),
      vars: { n, returned: `[${nums.join(", ")}]` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
