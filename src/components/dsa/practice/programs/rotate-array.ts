import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function rotate(nums, k) {
  k = k % nums.length;
  reverse(nums, 0, nums.length - 1);
  reverse(nums, 0, k - 1);
  reverse(nums, k, nums.length - 1);
  return nums;
}

function reverse(nums, left, right) {
  while (left < right) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
    left++;
    right--;
  }
}`;

const program: Program = {
  title: "Rotate an array by k steps",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10 },
    { key: "k", label: "k", kind: "number", min: 0, max: 99 },
  ],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3, 4, 5, 6, 7], k: 3 } },
    { label: "k larger than n", input: { nums: [-1, -100, 3, 99], k: 6 } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const original = [...nums];
    const r = recorder();
    const k = (input.k as number) % n;

    r.step(
      2,
      `Rotating by n steps changes nothing, so only \`k % n = ${input.k as number} % ${n} = ${k}\` steps matter. The last ${k} element${k === 1 ? "" : "s"} must move to the front.`,
      {
        arrays: [{ name: "nums", values: nums, tones: k > 0 ? toneRange(n - k, n - 1, "tertiary") : {} }],
        vars: { k },
      }
    );

    if (k === 0) {
      r.step(6, `\`k\` is 0 after the modulo — the array is already in its rotated order.`, {
        arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "success") }],
        vars: { nums },
        done: true,
      });
      return r.frames;
    }

    const phases: [number, number, number, string][] = [
      [3, 0, n - 1, "Reverse the **whole** array. The last k elements land at the front — but backwards."],
      [4, 0, k - 1, `Reverse the **first k = ${k}** elements to put them back in order.`],
      [5, k, n - 1, `Reverse the **remaining ${n - k}** elements to put them back in order too.`],
    ];

    for (const [line, from, to, intro] of phases) {
      const segment = () => toneRange(from, to, "tertiary");
      r.step(line, intro, {
        arrays: [{ name: "nums", values: nums, tones: segment(), pointers: pointersAt(n, { left: from, right: to }, { right: "tertiary" }) }],
        vars: { from, to },
      });
      let left = from;
      let right = to;
      if (left >= right) {
        r.step(10, `A segment of one element is already reversed — nothing to swap.`, {
          arrays: [{ name: "nums", values: nums, tones: segment() }],
          vars: { left, right },
        });
      }
      while (left < right) {
        const a = nums[left];
        const b = nums[right];
        [nums[left], nums[right]] = [nums[right], nums[left]];
        const tones: Record<number, CellTone> = { ...segment(), [left]: "write", [right]: "write" };
        r.step(11, `Swap **${a}** and **${b}**, then move both pointers inward.`, {
          arrays: [{ name: "nums", values: nums, tones, pointers: pointersAt(n, { left, right }, { right: "tertiary" }) }],
          vars: { left, right },
        });
        left++;
        right--;
      }
    }

    r.step(
      6,
      `Three reversals, each O(n), and no extra array: **O(n) time, O(1) space**. [${original.join(", ")}] rotated right by ${k} is [${nums.join(", ")}].`,
      {
        arrays: [
          {
            name: "nums",
            values: nums,
            tones: { ...toneRange(0, k - 1, "success"), ...toneRange(k, n - 1, "done") },
          },
        ],
        vars: { nums },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
