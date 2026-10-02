import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function reverse(nums) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
    left++;
    right--;
  }
  return nums;
}`;

const program: Program = {
  title: "Reverse an array in place",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Even length", input: { nums: [1, 2, 3, 4, 5, 6] } },
    { label: "Odd length", input: { nums: [10, 20, 30, 40, 50] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    let left = 0;
    let right = n - 1;

    const settled = () => ({
      ...toneRange(0, left - 1, "done"),
      ...toneRange(right + 1, n - 1, "done"),
    });
    const view = (tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones,
      pointers: pointersAt(n, left < right ? { left, right } : {}, { right: "tertiary" }),
    });

    r.step(3, `Put \`left\` on the first index and \`right\` on the last. They will walk toward each other.`, {
      arrays: [view({ [left]: "primary", [right]: "primary" })],
      vars: { left, right },
    });

    while (left < right) {
      const a = nums[left];
      const b = nums[right];
      [nums[left], nums[right]] = [nums[right], nums[left]];
      r.step(5, `\`left < right\`, so swap **${a}** and **${b}**. Both ends are now in their final places.`, {
        arrays: [view({ ...settled(), [left]: "write", [right]: "write" })],
        vars: { left, right },
      });
      left++;
      right--;
      r.step(
        7,
        left < right
          ? `Move both pointers one step inward: \`left = ${left}\`, \`right = ${right}\`.`
          : left === right
            ? `The pointers meet on the middle element, which is already in place.`
            : `The pointers have crossed — every pair has been swapped.`,
        { arrays: [view(settled())], vars: { left, right } }
      );
    }

    r.step(9, `Done in about n/2 swaps, using no extra array: **O(n) time, O(1) space**.`, {
      arrays: [view(toneRange(0, n - 1, "success"))],
      vars: { nums },
      done: true,
    });
    return r.frames;
  },
};

export default program;
