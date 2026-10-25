import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function bubbleSort(nums) {
  const n = nums.length;
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - pass; j++) {      // the last pass values are already in place
      if (nums[j] > nums[j + 1]) {
        [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];   // swap the out-of-order neighbours
        swapped = true;
      }
    }
    if (!swapped) break;                           // a pass with no swaps: sorted
  }
  return nums;
}`;

const program: Program = {
  title: "Bubble sort",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [5, 1, 4, 2, 8] } },
    { label: "Already sorted", input: { nums: [1, 2, 3, 4, 5] } },
    { label: "Reversed", input: { nums: [6, 5, 4, 3, 2, 1] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    let sortedFrom = n; // nums[sortedFrom..] are in their final places

    const view = (tones: Record<number, CellTone> = {}, marks: Record<string, number> = {}) => ({
      arrays: [{ name: "nums", values: [...nums], chart: true, tones: { ...toneRange(sortedFrom, n - 1, "done"), ...tones }, pointers: pointersAt(n, marks) }],
    });

    r.step(lineOf(code, "const n = nums.length;"), `Bubble sort walks the array comparing **neighbours**. Whenever two are out of order it swaps them, so the largest value bubbles to the end of each pass.`, view());
    for (let pass = 0; pass < n - 1; pass++) {
      let swapped = false;
      for (let j = 0; j < n - 1 - pass; j++) {
        if (nums[j] > nums[j + 1]) {
          [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];
          swapped = true;
          r.step(lineOf(code, "[nums[j], nums[j + 1]] = [nums[j + 1], nums[j]]"), `${nums[j + 1]} > ${nums[j]}: out of order, so **swap** them.`, { ...view({ [j]: "write", [j + 1]: "write" }, { j }), vars: { pass, swapped: "true" } });
        } else {
          r.step(lineOf(code, "if (nums[j] > nums[j + 1])"), `${nums[j]} ≤ ${nums[j + 1]}: already in order, leave them.`, { ...view({ [j]: "primary", [j + 1]: "primary" }, { j }), vars: { pass, swapped: String(swapped) } });
        }
      }
      sortedFrom = n - 1 - pass;
      if (!swapped) {
        sortedFrom = 0;
        r.step(lineOf(code, "if (!swapped) break;"), `A whole pass with **no swaps** means every neighbour is in order: the array is sorted, so stop early.`, { ...view(), vars: { pass, swapped: "false" } });
        break;
      }
      r.step(lineOf(code, "for (let pass = 0; pass < n - 1; pass++)"), `End of pass ${pass + 1}: ${nums[sortedFrom]} has bubbled to index ${sortedFrom}, its final place. The next pass can stop one step earlier.`, { ...view({ [sortedFrom]: "success" }), vars: { pass, swapped: "true" } });
    }
    sortedFrom = 0;
    r.step(lineOf(code, "return nums;"), `Sorted: **[${nums.join(", ")}]**. Up to n − 1 passes of up to n − 1 comparisons: **O(n²)** time, **O(1)** extra space — and **O(n)** when the array is already sorted, thanks to the early stop.`, { ...view(), done: true });
    return r.frames;
  },
};

export default program;
