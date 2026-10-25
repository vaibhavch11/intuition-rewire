import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function sortArrayByParity(nums) {
  let i = 0, j = nums.length - 1;
  while (i < j) {
    if (nums[i] % 2 === 0) i++;                     // already an even at the front
    else if (nums[j] % 2 === 1) j--;                // already an odd at the back
    else {
      [nums[i], nums[j]] = [nums[j], nums[i]];      // odd at the front, even at the back: swap
      i++;
      j--;
    }
  }
  return nums;
}`;

const program: Program = {
  title: "Sort array by parity (two-pointer partition)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [3, 1, 2, 4] } },
    { label: "Mixed", input: { nums: [1, 8, 3, 6, 5, 4, 7, 2] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    let i = 0;
    let j = n - 1;
    const view = (tones: Record<number, CellTone> = {}) => ({
      arrays: [{ name: "nums", values: [...nums], tones: { ...toneRange(0, i - 1, "success"), ...toneRange(j + 1, n - 1, "tertiary"), ...tones }, pointers: i <= j ? pointersAt(n, { i, j }, { j: "tertiary" }) : {} }],
    });

    r.step(lineOf(code, "let i = 0, j = nums.length - 1;"), `Partition, like quick sort's: **i** walks from the front past evens, **j** from the back past odds. When i stops on an odd and j on an even, they're both in the wrong half — swap them.`, view());
    while (i < j) {
      if (nums[i] % 2 === 0) {
        i++;
        r.step(lineOf(code, "if (nums[i] % 2 === 0) i++;"), `${nums[i - 1]} is even and already at the front: move i on.`, view());
      } else if (nums[j] % 2 === 1) {
        j--;
        r.step(lineOf(code, "else if (nums[j] % 2 === 1) j--;"), `${nums[j + 1]} is odd and already at the back: move j in.`, view());
      } else {
        const [a, b] = [i, j];
        [nums[i], nums[j]] = [nums[j], nums[i]];
        i++;
        j--;
        r.step(lineOf(code, "[nums[i], nums[j]] = [nums[j], nums[i]];"), `Odd ${nums[b]} at the front, even ${nums[a]} at the back: **swap** them, and move both pointers.`, view({ [a]: "write", [b]: "write" }));
      }
    }
    r.step(lineOf(code, "return nums;"), `The pointers met: every even is before every odd: **[${nums.join(", ")}]**. One pass, each value looked at once: **O(n)** time, **O(1)** space.`, { arrays: [{ name: "nums", values: [...nums], tones: Object.fromEntries(nums.map((v, k) => [k, v % 2 === 0 ? ("success" as const) : ("tertiary" as const)])) }], done: true });
    return r.frames;
  },
};

export default program;
