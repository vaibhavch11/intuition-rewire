import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function findPeakElement(nums) {
  let low = 0;
  let high = nums.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] > nums[mid + 1]) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}`;

const program: Program = {
  title: "Find a peak element",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3, 1] } },
    { label: "Two peaks", input: { nums: [1, 2, 1, 3, 5, 6, 4] } },
    { label: "Always rising", input: { nums: [10, 20, 30, 40, 50] } },
  ],
  check(input) {
    const nums = input.nums as number[];
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === nums[i - 1]) return "Neighbours must differ — the problem guarantees nums[i] ≠ nums[i + 1].";
    }
    return null;
  },
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;

    const outside = (): Record<number, CellTone> => ({
      ...toneRange(0, low - 1, "muted"),
      ...toneRange(high + 1, n - 1, "muted"),
    });

    r.step(
      3,
      `Anything outside the edges counts as **-∞**, so some peak always exists. Search the whole range: \`low = 0\`, \`high = ${high}\`.`,
      {
        arrays: [{ name: "nums", values: nums, chart: true, pointers: pointersAt(n, { low, high }, { high: "tertiary" }) }],
        vars: { low, high },
      }
    );

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const pointers = pointersAt(n, { low, mid, high }, { high: "tertiary", mid: "secondary" });
      r.step(5, `Look at the middle of the range, index **${mid}** (${nums[mid]}), and its right neighbour (${nums[mid + 1]}).`, {
        arrays: [{ name: "nums", values: nums, chart: true, tones: { ...outside(), [mid]: "primary", [mid + 1]: "tertiary" }, pointers }],
        vars: { low, mid, high },
      });

      if (nums[mid] > nums[mid + 1]) {
        high = mid;
        r.step(
          7,
          `${nums[mid]} > ${nums[mid + 1]}: the line is going **downhill** here, so a peak exists at mid or to its left. Keep the left half: \`high = ${high}\`.`,
          {
            arrays: [{ name: "nums", values: nums, chart: true, tones: outside(), pointers: pointersAt(n, { low, high }, { high: "tertiary" }) }],
            vars: { low, high },
          }
        );
      } else {
        low = mid + 1;
        r.step(
          9,
          `${nums[mid]} < ${nums[mid + 1]}: the line is going **uphill**, so climbing right must reach a peak. Keep the right half: \`low = ${low}\`.`,
          {
            arrays: [{ name: "nums", values: nums, chart: true, tones: outside(), pointers: pointersAt(n, { low, high }, { high: "tertiary" }) }],
            vars: { low, high },
          }
        );
      }
    }

    r.step(
      12,
      `\`low\` and \`high\` meet at index **${low}** (${nums[low]}), which is bigger than both neighbours. The range halved every step: **O(log n) time, O(1) space**.`,
      {
        arrays: [{ name: "nums", values: nums, chart: true, tones: { ...toneRange(0, n - 1, "muted"), [low]: "success" }, pointers: pointersAt(n, { peak: low }, { peak: "secondary" }) }],
        vars: { peak: low },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
