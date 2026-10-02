import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function sortColors(nums) {
  let low = 0, mid = 0;
  let high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
  return nums;
}`;

const program: Program = {
  title: "Sort colors (Dutch national flag)",
  code,
  fields: [{ key: "nums", label: "nums (0, 1 or 2)", kind: "array", maxLength: 12, min: 0, max: 2 }],
  examples: [
    { label: "Example", input: { nums: [2, 0, 2, 1, 1, 0] } },
    { label: "Mixed", input: { nums: [1, 2, 0, 2, 1, 0, 0, 2] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let mid = 0;
    let high = n - 1;

    // [0, low) holds 0s, [low, mid) 1s, (high, n) 2s; [mid, high] is unsorted.
    const view = (tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones: { ...toneRange(0, low - 1, "done"), ...toneRange(high + 1, n - 1, "done"), ...tones },
      pointers: pointersAt(n, { low, mid, high }, { low: "secondary", high: "tertiary" }),
    });

    r.step(
      3,
      `Three pointers split the array into four zones: 0s before \`low\`, 1s between \`low\` and \`mid\`, **unknown** from \`mid\` to \`high\`, and 2s after \`high\`. At the start everything is unknown.`,
      { arrays: [view({})], vars: { low, mid, high } }
    );

    while (mid <= high) {
      const x = nums[mid];
      if (x === 0) {
        const lowWas = low;
        const midWas = mid;
        [nums[low], nums[mid]] = [nums[mid], nums[low]];
        low++;
        mid++;
        r.step(
          7,
          `\`nums[mid]\` is **0** — it belongs at the front. Swap it with index ${lowWas} and grow both the 0s zone and the checked zone.`,
          { arrays: [view({ [lowWas]: "write", [midWas]: "write" })], vars: { low, mid, high } }
        );
      } else if (x === 1) {
        mid++;
        r.step(9, `\`nums[mid]\` is **1** — already in the middle zone. Just move \`mid\` on.`, {
          arrays: [view({ [mid - 1]: "primary" })],
          vars: { low, mid, high },
        });
      } else {
        const highWas = high;
        [nums[mid], nums[high]] = [nums[high], nums[mid]];
        high--;
        r.step(
          12,
          `\`nums[mid]\` is **2** — send it to the back by swapping with index ${highWas}. \`mid\` stays: the value swapped in hasn't been checked yet.`,
          { arrays: [view({ [mid]: "write", [highWas]: "write" })], vars: { low, mid, high } }
        );
      }
    }

    r.step(
      15,
      `\`mid\` passed \`high\`, so no unknown values remain. Sorted in **one pass** with swaps only: O(n) time, O(1) space.`,
      { arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "success") }], vars: { nums }, done: true }
    );
    return r.frames;
  },
};

export default program;
