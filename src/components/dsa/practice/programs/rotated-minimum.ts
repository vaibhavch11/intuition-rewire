import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function findMin(nums) {
  let low = 0;
  let high = nums.length - 1;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] > nums[high]) low = mid + 1;   // mid is in the first, higher run: the minimum is to the right
    else high = mid;                             // mid is in the second run: the minimum is mid or to its left
  }
  return nums[low];
}`;

/** Is the array a rotation of a strictly increasing one? */
function isRotatedDistinct(a: number[]) {
  let drops = 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i] === a[i - 1]) return false;
    if (a[i] < a[i - 1]) drops++;
  }
  return drops === 0 || (drops === 1 && a[a.length - 1] < a[0]);
}

const program: Program = {
  title: "Find minimum in rotated sorted array",
  code,
  fields: [{ key: "nums", label: "nums (a rotated sorted array, distinct)", kind: "array", maxLength: 12, min: -99, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [4, 5, 6, 7, 0, 1, 2] } },
    { label: "Small", input: { nums: [3, 4, 5, 1, 2] } },
    { label: "Not rotated", input: { nums: [11, 13, 15, 17] } },
  ],
  check: (input) => ((input.nums as number[]).length && isRotatedDistinct(input.nums as number[]) ? null : "nums must be a sorted array of distinct values, rotated (e.g. 4 5 6 7 0 1 2)."),
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [{ name: "nums", values: nums, tones: { ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted"), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
    });

    r.step(lineOf(code, "let high = nums.length - 1;"), `A rotated sorted array is two sorted runs; the minimum starts the second, lower run. Values in the first run are bigger than the last value, so comparing **nums[mid] with nums[high]** says which run mid is in.`, {
      ...view({}, { low, high }),
      vars: { low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      r.step(lineOf(code, "const mid = low + "), `mid = ${mid}: compare nums[${mid}] = ${nums[mid]} with nums[high] = ${nums[high]}.`, {
        ...view({ [mid]: "primary", [high]: "tertiary" }, { low, mid, high }),
        vars: { low, mid, high },
      });
      if (nums[mid] > nums[high]) {
        low = mid + 1;
        r.step(lineOf(code, "if (nums[mid] > nums[high]) low = mid + 1;"), `${nums[mid]} > ${nums[high]}: mid is in the **first, higher run**, so the seam — the minimum — is to its right. \`low = ${low}\`.`, {
          ...view({}, { low, high }),
          vars: { low, high },
        });
      } else {
        high = mid;
        r.step(lineOf(code, "else high = mid;"), `${nums[mid]} < ${nums[high]}: mid is in the **second, lower run**, so the minimum is mid or to its left. \`high = ${high}\`.`, {
          ...view({}, { low, high }),
          vars: { low, high },
        });
      }
    }
    r.step(lineOf(code, "return nums[low];"), `One index left: the minimum is nums[${low}] = **${nums[low]}**${low === 0 ? " (the array wasn't rotated)" : `, rotated ${low} place${low === 1 ? "" : "s"}`}. **O(log n)**.`, {
      arrays: [{ name: "nums", values: nums, tones: { ...toneRange(0, low - 1, "done"), ...toneRange(low + 1, n - 1, "done"), [low]: "success" }, pointers: pointersAt(n, { min: low }) }],
      vars: { answer: nums[low] },
      done: true,
    });
    return r.frames;
  },
};

export default program;
