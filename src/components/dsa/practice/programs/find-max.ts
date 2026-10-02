import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function findMax(nums) {
  let max = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > max) {
      max = nums[i];
    }
  }
  return max;
}`;

const program: Program = {
  title: "Find the largest element",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Mixed", input: { nums: [4, 9, 2, 7, 11, 3] } },
    { label: "Largest first", input: { nums: [8, 5, 2, 1] } },
    { label: "Negatives", input: { nums: [-5, -2, -9, -1] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const r = recorder();
    let max = nums[0];
    let maxAt = 0;
    const view = (i: number | undefined, tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones,
      pointers: pointersAt(nums.length, { i, max: maxAt }, { max: "tertiary" }),
    });

    r.step(
      2,
      `Assume the first element, **${max}**, is the largest so far. Nothing has been compared yet.`,
      { arrays: [view(undefined, { 0: "tertiary" })], vars: { max } }
    );

    for (let i = 1; i < nums.length; i++) {
      const bigger = nums[i] > max;
      r.step(
        4,
        bigger
          ? `Compare \`nums[${i}] = ${nums[i]}\` with \`max = ${max}\`. It is **bigger**, so it becomes the new best.`
          : `Compare \`nums[${i}] = ${nums[i]}\` with \`max = ${max}\`. Not bigger — \`max\` stays ${max}.`,
        {
          arrays: [
            view(i, { ...toneRange(0, i - 1, "done"), [maxAt]: "tertiary", [i]: "primary" }),
          ],
          vars: { i, "nums[i]": nums[i], max },
        }
      );
      if (bigger) {
        max = nums[i];
        maxAt = i;
        r.step(5, `\`max = ${max}\`. Everything to the left is now known to be smaller.`, {
          arrays: [view(i, { ...toneRange(0, i - 1, "done"), [i]: "write" })],
          vars: { i, max },
        });
      }
    }

    r.step(
      8,
      `Every element was compared exactly once, so the answer is **${max}** (index ${maxAt}). That single pass is O(n).`,
      {
        arrays: [view(undefined, { ...toneRange(0, nums.length - 1, "done"), [maxAt]: "success" })],
        vars: { max },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
