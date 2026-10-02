import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function productExceptSelf(nums) {
  const n = nums.length;
  const answer = new Array(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= suffix;
    suffix *= nums[i];
  }
  return answer;
}`;

const program: Program = {
  title: "Product of array except self",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: -9, max: 9 }],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3, 4] } },
    { label: "With a zero", input: { nums: [-1, 1, 0, -3, 3] } },
  ],
  check(input) {
    return (input.nums as number[]).length < 2 ? "Enter at least two numbers." : null;
  },
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    const answer: number[] = new Array(n).fill(1);
    let prefix = 1;

    r.step(
      4,
      `\`answer[i]\` must be (product of everything **left** of i) × (product of everything **right** of i). The first pass fills in the left part.`,
      {
        arrays: [
          { name: "nums", values: nums },
          { name: "answer", values: answer, tones: toneRange(0, n - 1, "muted") },
        ],
        vars: { prefix },
      }
    );

    for (let i = 0; i < n; i++) {
      answer[i] = prefix;
      const before = prefix;
      prefix *= nums[i];
      r.step(
        7,
        `Everything left of index ${i} multiplies to **${before}**, so \`answer[${i}] = ${before}\`. Then fold \`nums[${i}] = ${nums[i]}\` into \`prefix\` for the next index.`,
        {
          arrays: [
            { name: "nums", values: nums, tones: { ...toneRange(0, i - 1, "tertiary"), [i]: "primary" }, pointers: pointersAt(n, { i }) },
            { name: "answer", values: answer, tones: { ...toneRange(i + 1, n - 1, "muted"), [i]: "write" } },
          ],
          vars: { i, prefix },
        }
      );
    }

    let suffix = 1;
    r.step(9, `Left products are in place. Now walk **backwards**, multiplying in the product of everything to the right.`, {
      arrays: [
        { name: "nums", values: nums },
        { name: "answer", values: answer },
      ],
      vars: { suffix },
    });

    for (let i = n - 1; i >= 0; i--) {
      const before = suffix;
      const leftPart = answer[i];
      answer[i] *= suffix;
      suffix *= nums[i];
      r.step(
        12,
        `Everything right of index ${i} multiplies to **${before}**, so \`answer[${i}] = ${leftPart} × ${before} = ${answer[i]}\`. Then fold \`nums[${i}]\` into \`suffix\`.`,
        {
          arrays: [
            { name: "nums", values: nums, tones: { ...toneRange(i + 1, n - 1, "tertiary"), [i]: "primary" }, pointers: pointersAt(n, { i }) },
            { name: "answer", values: answer, tones: { ...toneRange(i + 1, n - 1, "done"), [i]: "write" } },
          ],
          vars: { i, suffix },
        }
      );
    }

    r.step(
      14,
      `Every product is ready without using division — so a 0 in the input causes no trouble. Two passes: **O(n) time**, and O(1) extra space besides the answer.`,
      {
        arrays: [
          { name: "nums", values: nums },
          { name: "answer", values: answer, tones: toneRange(0, n - 1, "success") },
        ],
        vars: { answer },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
