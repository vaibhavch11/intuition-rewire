import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function search(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[low] <= nums[mid]) {                                      // the left half low..mid is sorted
      if (nums[low] <= target && target < nums[mid]) high = mid - 1;   // the target is inside it
      else low = mid + 1;
    } else {                                                           // the right half mid..high is sorted
      if (nums[mid] < target && target <= nums[high]) low = mid + 1;   // the target is inside it
      else high = mid - 1;
    }
  }
  return -1;
}`;

function isRotatedDistinct(a: number[]) {
  let drops = 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i] === a[i - 1]) return false;
    if (a[i] < a[i - 1]) drops++;
  }
  return drops === 0 || (drops === 1 && a[a.length - 1] < a[0]);
}

const program: Program = {
  title: "Search in rotated sorted array (one pass)",
  code,
  fields: [
    { key: "nums", label: "nums (a rotated sorted array, distinct)", kind: "array", maxLength: 12, min: -99, max: 99 },
    { key: "target", label: "target", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Example", input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 } },
    { label: "Not there", input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 } },
    { label: "In the first run", input: { nums: [15, 18, 22, 30, 2, 5, 9, 12], target: 18 } },
  ],
  check: (input) => ((input.nums as number[]).length && isRotatedDistinct(input.nums as number[]) ? null : "nums must be a sorted array of distinct values, rotated (e.g. 4 5 6 7 0 1 2)."),
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;
    const outside = () => ({ ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted") });
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [{ name: "nums", values: nums, tones: { ...outside(), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
    });

    r.step(lineOf(code, "let high = nums.length - 1;"), `Search for ${target}. The array is two sorted runs, but cut anywhere and **one side of the cut is a normal sorted run** — that side is easy to check.`, {
      ...view({}, { low, high }),
      vars: { target, low, high },
    });
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      r.step(lineOf(code, "const mid = low + "), `mid = ${mid}, holding ${nums[mid]}.`, {
        ...view({ [mid]: "primary" }, { low, mid, high }),
        vars: { target, low, mid, high },
      });
      if (nums[mid] === target) {
        r.step(lineOf(code, "if (nums[mid] === target) return mid;"), `Found ${target} at index **${mid}**. **O(log n)**.`, {
          ...view({ [mid]: "success" }, { mid }),
          vars: { target, mid },
          done: true,
        });
        return r.frames;
      }
      if (nums[low] <= nums[mid]) {
        const inside = nums[low] <= target && target < nums[mid];
        const [lo, hi] = [nums[low], nums[mid]];
        r.step(lineOf(code, "if (nums[low] <= nums[mid]) {"), `nums[low] = ${nums[low]} <= nums[mid] = ${nums[mid]}: the **left half** ${low}..${mid} is sorted, covering ${nums[low]}..${nums[mid]}.`, {
          ...view({ ...toneRange(low, mid, "done"), [mid]: "primary" }, { low, mid, high }),
          vars: { target, low, mid, high },
        });
        if (inside) {
          high = mid - 1;
          r.step(lineOf(code, "if (nums[low] <= target && target < nums[mid]) high = mid - 1;"), `${target} is between ${lo} and ${hi}, so it can only be in that sorted half. \`high = ${high}\`.`, { ...view({}, { low, high }), vars: { target, low, high } });
        } else {
          low = mid + 1;
          r.step(lineOf(code, "      else low = mid + 1;"), `${target} isn't between ${lo} and ${hi}, so it's not in the sorted half — search the other side. \`low = ${low}\`.`, { ...view({}, { low, high }), vars: { target, low, high } });
        }
      } else {
        const inside = nums[mid] < target && target <= nums[high];
        const [lo, hi] = [nums[mid], nums[high]];
        r.step(lineOf(code, "} else {"), `nums[low] = ${nums[low]} > nums[mid] = ${nums[mid]}: the seam is on the left, so the **right half** ${mid}..${high} is sorted, covering ${nums[mid]}..${nums[high]}.`, {
          ...view({ ...toneRange(mid, high, "done"), [mid]: "primary" }, { low, mid, high }),
          vars: { target, low, mid, high },
        });
        if (inside) {
          low = mid + 1;
          r.step(lineOf(code, "if (nums[mid] < target && target <= nums[high]) low = mid + 1;"), `${target} is between ${lo} and ${hi}, so it can only be in that sorted half. \`low = ${low}\`.`, { ...view({}, { low, high }), vars: { target, low, high } });
        } else {
          high = mid - 1;
          r.step(lineOf(code, "      else high = mid - 1;"), `${target} isn't between ${lo} and ${hi}, so search the other side. \`high = ${high}\`.`, { ...view({}, { low, high }), vars: { target, low, high } });
        }
      }
    }
    r.step(lineOf(code, "return -1;"), `Nothing left in play: ${target} isn't in the array. Return **-1**.`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }],
      vars: { target },
      done: true,
    });
    return r.frames;
  },
};

export default program;
