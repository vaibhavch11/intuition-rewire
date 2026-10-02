import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function maxSubArray(nums) {
  let currSum = nums[0];
  let maxSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currSum = Math.max(nums[i], currSum + nums[i]);
    maxSum = Math.max(maxSum, currSum);
  }
  return maxSum;
}`;

const program: Program = {
  title: "Maximum subarray sum (Kadane's algorithm)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Classic", input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] } },
    { label: "Short", input: { nums: [-2, 3, -1, 2] } },
    { label: "All negative", input: { nums: [-3, -1, -2] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let currSum = nums[0];
    let maxSum = nums[0];
    let start = 0;
    let bestStart = 0;
    let bestEnd = 0;

    // The run being grown is tinted; the best run found so far is marked.
    const view = (i: number, tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones: { ...toneRange(start, i, "tertiary"), ...tones },
      pointers: pointersAt(n, { start, i }, { start: "tertiary" }),
    });

    r.step(
      3,
      `A subarray has to start somewhere. Begin with just \`nums[0] = ${nums[0]}\`: it is both the current run and the best run so far.`,
      { arrays: [view(0, { 0: "primary" })], vars: { currSum, maxSum } }
    );

    for (let i = 1; i < n; i++) {
      const x = nums[i];
      const extended = currSum + x;
      const restart = x > extended;
      const before = currSum;
      currSum = Math.max(x, extended);
      if (restart) start = i;
      r.step(
        5,
        restart
          ? `Extend or restart? Extending gives ${before} + ${x} = ${extended}; starting fresh at ${x} is better. The run so far (${before}) only **drags us down**, so drop it.`
          : `Extend or restart? Extending gives ${before} + ${x} = **${extended}**, which beats starting fresh at ${x}. Keep the run going.`,
        { arrays: [view(i, { [i]: "primary" })], vars: { i, "nums[i]": x, currSum, maxSum } }
      );

      if (currSum > maxSum) {
        maxSum = currSum;
        bestStart = start;
        bestEnd = i;
        r.step(6, `\`currSum = ${currSum}\` beats the best so far, so \`maxSum = ${maxSum}\` (indexes ${bestStart}–${bestEnd}).`, {
          arrays: [view(i, { ...toneRange(bestStart, bestEnd, "success") })],
          vars: { i, currSum, maxSum },
        });
      } else {
        r.step(6, `\`currSum = ${currSum}\` doesn't beat \`maxSum = ${maxSum}\`, so the best stays the same.`, {
          arrays: [view(i, { [i]: "primary" })],
          vars: { i, currSum, maxSum },
        });
      }
    }

    r.step(
      8,
      `The largest sum is **${maxSum}**, from index ${bestStart} to ${bestEnd}. Each element was decided once — **O(n) time, O(1) space**.`,
      {
        arrays: [{ name: "nums", values: nums, tones: toneRange(bestStart, bestEnd, "success") }],
        vars: { maxSum },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
