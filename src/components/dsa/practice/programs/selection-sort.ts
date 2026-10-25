import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function selectionSort(nums) {
  const n = nums.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (nums[j] < nums[min]) min = j;            // remember the smallest so far
    }
    [nums[i], nums[min]] = [nums[min], nums[i]];   // put it at the front of the unsorted part
  }
  return nums;
}`;

const program: Program = {
  title: "Selection sort",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [64, 25, 12, 22, 11] } },
    { label: "Duplicates", input: { nums: [3, 1, 3, 2, 1] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();

    const view = (sorted: number, tones: Record<number, CellTone> = {}, marks: Record<string, number> = {}) => ({
      arrays: [{ name: "nums", values: [...nums], chart: true, tones: { ...toneRange(0, sorted - 1, "done"), ...tones }, pointers: pointersAt(n, marks, { min: "tertiary" }) }],
    });

    r.step(lineOf(code, "const n = nums.length;"), `Selection sort grows a **sorted part** at the front. Each round it scans the unsorted part for the **smallest** value and swaps it into the next place.`, view(0));
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      r.step(lineOf(code, "let min = i;"), `Round ${i + 1}: assume the first unsorted value, ${nums[i]} at index ${i}, is the smallest.`, { ...view(i, { [i]: "tertiary" }, { i, min }), vars: { i, min } });
      for (let j = i + 1; j < n; j++) {
        if (nums[j] < nums[min]) {
          min = j;
          r.step(lineOf(code, "if (nums[j] < nums[min]) min = j"), `${nums[j]} is smaller than the smallest so far: **min** moves to index ${j}.`, { ...view(i, { [min]: "tertiary", [j]: "write" }, { i, j, min }), vars: { i, min } });
        } else {
          r.step(lineOf(code, "if (nums[j] < nums[min]) min = j"), `${nums[j]} isn't smaller than ${nums[min]}.`, { ...view(i, { [min]: "tertiary", [j]: "primary" }, { i, j, min }), vars: { i, min } });
        }
      }
      [nums[i], nums[min]] = [nums[min], nums[i]];
      r.step(
        lineOf(code, "[nums[i], nums[min]] = [nums[min], nums[i]]"),
        min === i ? `${nums[i]} was already the smallest: it stays at index ${i}. The sorted part grows by one.` : `Swap the smallest, ${nums[i]}, into index ${i}. The sorted part grows by one.`,
        { ...view(i + 1, { [i]: "success", ...(min !== i ? { [min]: "write" } : {}) }), vars: { i, min } }
      );
    }
    r.step(lineOf(code, "return nums;"), `Sorted: **[${nums.join(", ")}]**. Every round scans the whole unsorted part, so it's always **O(n²)** comparisons — even on sorted input — but only **n − 1 swaps**, with **O(1)** extra space.`, { ...view(n), done: true });
    return r.frames;
  },
};

export default program;
