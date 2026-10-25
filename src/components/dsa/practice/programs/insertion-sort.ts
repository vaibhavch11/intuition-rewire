import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function insertionSort(nums) {
  for (let i = 1; i < nums.length; i++) {
    const key = nums[i];                          // the next value to place
    let j = i - 1;
    while (j >= 0 && nums[j] > key) {
      nums[j + 1] = nums[j];                      // shift bigger values one step right
      j--;
    }
    nums[j + 1] = key;                            // drop the value into the gap
  }
  return nums;
}`;

const program: Program = {
  title: "Insertion sort",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [12, 11, 13, 5, 6] } },
    { label: "Nearly sorted", input: { nums: [1, 2, 4, 3, 5, 6] } },
  ],
  run(input) {
    const nums: Scalar[] = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();

    const view = (sorted: number, tones: Record<number, CellTone> = {}, marks: Record<string, number> = {}, key: Scalar = null) => ({
      arrays: [{ name: "nums", values: [...nums], chart: true, tones: { ...toneRange(0, sorted - 1, "done"), ...tones }, pointers: pointersAt(n, marks) }],
      vars: key === null ? {} : { key },
    });

    r.step(lineOf(code, "for (let i = 1; i < nums.length; i++)"), `Insertion sort keeps a **sorted prefix** — at first just the first value — and inserts the next value into it, like sorting a hand of cards.`, view(1));
    for (let i = 1; i < n; i++) {
      const key = nums[i] as number;
      r.step(lineOf(code, "const key = nums[i];"), `Take out **${key}** (index ${i}) to insert it into the sorted part on its left.`, view(i, { [i]: "primary" }, { i }, key));
      let j = i - 1;
      while (j >= 0 && (nums[j] as number) > key) {
        nums[j + 1] = nums[j];
        r.step(lineOf(code, "nums[j + 1] = nums[j];"), `${nums[j]} > ${key}: shift ${nums[j]} one step right to make room.`, view(i + 1, { [j + 1]: "write", [j]: "tertiary" }, { j }, key));
        j--;
      }
      nums[j + 1] = key;
      r.step(
        lineOf(code, "nums[j + 1] = key;"),
        j + 1 === i ? `${j >= 0 ? `${nums[j]} ≤ ${key}, so ` : ""}${key} is already in place: no shifts needed.` : `${j >= 0 ? `${nums[j]} ≤ ${key}, so stop: ` : "Reached the front: "}drop ${key} into the gap at index ${j + 1}.`,
        view(i + 1, { [j + 1]: "success" }, {}, key)
      );
    }
    r.step(lineOf(code, "return nums;"), `Sorted: **[${nums.join(", ")}]**. In the worst case (reversed input) each value shifts past all before it: **O(n²)**. On nearly sorted input there are few shifts: close to **O(n)**. **O(1)** extra space, and **stable**.`, { ...view(n), done: true });
    return r.frames;
  },
};

export default program;
