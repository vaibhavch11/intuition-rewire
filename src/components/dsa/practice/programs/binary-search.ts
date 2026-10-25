import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function binarySearch(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;   // the target is to the right
    else high = mid - 1;                     // the target is to the left
  }
  return -1;
}`;

const program: Program = {
  title: "Binary search",
  code,
  fields: [
    { key: "nums", label: "nums (sorted)", kind: "array", maxLength: 12, min: -99, max: 99 },
    { key: "target", label: "target", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Found", input: { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 } },
    { label: "Not there", input: { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 40 } },
    { label: "Problem example", input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 } },
  ],
  check(input) {
    const nums = input.nums as number[];
    for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return "nums must be sorted from smallest to largest.";
    return null;
  },
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;
    const outside = (): Record<number, CellTone> => ({ ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted") });
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [{ name: "nums", values: nums, tones: { ...outside(), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
    });

    r.step(lineOf(code, "let high = nums.length - 1;"), `The target, if it's here, is somewhere in **nums[${low}..${high}]** — the whole array to start with.`, {
      ...view({}, { low, high }),
      vars: { target, low, high },
    });
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      r.step(lineOf(code, "const mid = low + "), `${high - low + 1} value${high > low ? "s" : ""} still in play. Check the middle one: index **${mid}**, holding ${nums[mid]}.`, {
        ...view({ [mid]: "primary" }, { low, mid, high }),
        vars: { target, low, mid, high },
      });
      if (nums[mid] === target) {
        r.step(lineOf(code, "if (nums[mid] === target) return mid;"), `${nums[mid]} is the target: return **${mid}**. Each check halved the search space, so this takes at most about log₂ n checks — **O(log n)**.`, {
          ...view({ [mid]: "success" }, { mid }),
          vars: { target, low, mid, high },
          done: true,
        });
        return r.frames;
      }
      if (nums[mid] < target) {
        low = mid + 1;
        r.step(lineOf(code, "if (nums[mid] < target) low = mid + 1;"), `${nums[mid]} < ${target}: everything up to index ${mid} is too small. Throw that half away — \`low = ${low}\`.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      } else {
        high = mid - 1;
        r.step(lineOf(code, "else high = mid - 1;"), `${nums[mid]} > ${target}: everything from index ${mid} on is too big. Throw that half away — \`high = ${high}\`.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      }
    }
    r.step(lineOf(code, "return -1;"), `\`low > high\`: nothing is left in play, so ${target} isn't in the array. Return **-1**.`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }],
      vars: { target, low, high },
      done: true,
    });
    return r.frames;
  },
};

export default program;
