import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function singleNonDuplicate(nums) {
  let low = 0;
  let high = nums.length - 1;
  while (low < high) {
    let mid = low + Math.floor((high - low) / 2);
    if (mid % 2 === 1) mid--;                        // look at the start of a pair: an even index
    if (nums[mid] === nums[mid + 1]) low = mid + 2;  // pair intact: the single one is further right
    else high = mid;                                 // pair broken: the single one is at mid or before
  }
  return nums[low];
}`;

const program: Program = {
  title: "Single element in a sorted array (binary search on pairs)",
  code,
  fields: [{ key: "nums", label: "nums (sorted; every value twice but one)", kind: "array", maxLength: 13, min: -99, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [1, 1, 2, 3, 3, 4, 4, 8, 8] } },
    { label: "Near the end", input: { nums: [3, 3, 7, 7, 10, 11, 11] } },
    { label: "First", input: { nums: [1, 2, 2, 5, 5] } },
  ],
  check(input) {
    const nums = input.nums as number[];
    if (nums.length % 2 === 0) return "nums must have an odd length: pairs plus one single value.";
    for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return "nums must be sorted.";
    const counts = new Map<number, number>();
    for (const v of nums) counts.set(v, (counts.get(v) ?? 0) + 1);
    const ones = [...counts.values()].filter((c) => c === 1).length;
    return ones === 1 && [...counts.values()].every((c) => c <= 2) ? null : "Every value must appear exactly twice, except one value that appears once.";
  },
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [{ name: "nums", values: nums, tones: { ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted"), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
    });

    r.step(lineOf(code, "let high = nums.length - 1;"), `Before the single value, pairs start at **even** indexes; after it, at **odd** ones. So checking whether the pair starting at an even index is intact tells which side the single value is on.`, {
      ...view({}, { low, high }),
      vars: { low, high },
    });
    while (low < high) {
      const middle = low + Math.floor((high - low) / 2);
      let mid = middle;
      if (mid % 2 === 1) {
        mid--;
        r.step(lineOf(code, "if (mid % 2 === 1) mid--;"), `The middle of ${low}..${high} is ${middle}, an odd index. Step back to **${mid}** so mid sits at the start of a pair.`, {
          ...view({ [mid]: "primary" }, { low, mid, high }),
          vars: { low, mid, high },
        });
      } else {
        r.step(lineOf(code, "let mid = low + "), `The middle of ${low}..${high} is **${mid}**, already even: the start of a pair.`, {
          ...view({ [mid]: "primary" }, { low, mid, high }),
          vars: { low, mid, high },
        });
      }
      if (nums[mid] === nums[mid + 1]) {
        low = mid + 2;
        r.step(lineOf(code, "if (nums[mid] === nums[mid + 1]) low = mid + 2;"), `nums[${mid}] = nums[${mid + 1}] = ${nums[mid]}: this pair is intact, so the pairs are still in step — the single value is after it. \`low = ${low}\`.`, {
          ...view({ [mid]: "done", [mid + 1]: "done" }, { low, high }),
          vars: { low, high },
        });
      } else {
        high = mid;
        r.step(lineOf(code, "else high = mid;"), `nums[${mid}] = ${nums[mid]} but nums[${mid + 1}] = ${nums[mid + 1]}: the pair is broken, so the shift already happened. The single value is at ${mid} or before. \`high = ${high}\`.`, {
          ...view({ [mid]: "tertiary", [mid + 1]: "tertiary" }, { low, high }),
          vars: { low, high },
        });
      }
    }
    r.step(lineOf(code, "return nums[low];"), `One index left: the single value is nums[${low}] = **${nums[low]}**. Each step halved the range: **O(log n)** time, **O(1)** space.`, {
      arrays: [{ name: "nums", values: nums, tones: { [low]: "success" }, pointers: pointersAt(n, { low }) }],
      vars: { low, answer: nums[low] },
      done: true,
    });
    return r.frames;
  },
};

export default program;
