import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function searchInsert(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return low;                           // left of low: all smaller; right of high: all bigger
}`;

const program: Program = {
  title: "Search insert position (classic binary search, then return low)",
  code,
  fields: [
    { key: "nums", label: "nums (sorted, distinct)", kind: "array", maxLength: 12, min: -99, max: 99 },
    { key: "target", label: "target", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Between two values", input: { nums: [1, 3, 5, 6], target: 2 } },
    { label: "Found", input: { nums: [1, 3, 5, 6], target: 5 } },
    { label: "After everything", input: { nums: [1, 3, 5, 6], target: 7 } },
  ],
  check(input) {
    const nums = input.nums as number[];
    for (let i = 1; i < nums.length; i++) if (nums[i] <= nums[i - 1]) return "nums must be sorted with no repeated values.";
    return null;
  },
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;
    // Ruled-out values: smaller ones on the left, bigger ones on the right.
    const sides = (): Record<number, CellTone> => ({ ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted") });
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [{ name: "nums", values: nums, tones: { ...sides(), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
    });

    r.step(lineOf(code, "let high = nums.length - 1;"), `Plain binary search for ${target}. Keep an eye on what the loop learns: everything **left of low** is smaller than ${target}, everything **right of high** is bigger.`, {
      ...view({}, { low, high }),
      vars: { target, low, high },
    });
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      r.step(lineOf(code, "const mid = low + "), `Check the middle of ${low}..${high}: index **${mid}**, holding ${nums[mid]}.`, {
        ...view({ [mid]: "primary" }, { low, mid, high }),
        vars: { target, low, mid, high },
      });
      if (nums[mid] === target) {
        r.step(lineOf(code, "if (nums[mid] === target) return mid;"), `${target} is already in the array, at index **${mid}**: return it. **O(log n)**.`, {
          ...view({ [mid]: "success" }, { mid }),
          vars: { target, mid },
          done: true,
        });
        return r.frames;
      }
      if (nums[mid] < target) {
        low = mid + 1;
        r.step(lineOf(code, "if (nums[mid] < target) low = mid + 1;"), `${nums[mid]} < ${target}: it and everything left of it are smaller. \`low = ${low}\`.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      } else {
        high = mid - 1;
        r.step(lineOf(code, "else high = mid - 1;"), `${nums[mid]} > ${target}: it and everything right of it are bigger. \`high = ${high}\`.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      }
    }
    const where = low === 0 ? "before every value" : low === n ? "after every value" : `between ${nums[low - 1]} and ${nums[low]}`;
    r.step(lineOf(code, "return low;"), `The range is empty (\`low = high + 1\`). Everything left of low is smaller and everything from low on is bigger, so ${target} belongs at index **${low}**, ${where}. **O(log n)**.`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted"), pointers: pointersAt(n, { low }) }],
      vars: { target, low, high },
      done: true,
    });
    return r.frames;
  },
};

export default program;
