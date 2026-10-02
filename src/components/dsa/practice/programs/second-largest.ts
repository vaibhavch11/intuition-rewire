import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function secondLargest(nums) {
  let largest = -Infinity;
  let second = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > largest) {
      second = largest;
      largest = nums[i];
    } else if (nums[i] < largest && nums[i] > second) {
      second = nums[i];
    }
  }
  return second === -Infinity ? -1 : second;
}`;

const program: Program = {
  title: "Second largest element",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Example", input: { nums: [12, 35, 1, 10, 34, 1] } },
    { label: "Repeated largest", input: { nums: [10, 5, 10] } },
    { label: "All equal", input: { nums: [7, 7, 7] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let largest = -Infinity;
    let second = -Infinity;
    let largestAt: number | undefined;
    let secondAt: number | undefined;

    const view = (i: number | undefined, tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones,
      pointers: pointersAt(
        n,
        { i, "1st": largestAt, "2nd": secondAt },
        { "1st": "secondary", "2nd": "tertiary" }
      ),
    });
    const marks = (i: number): Record<number, CellTone> => ({
      ...toneRange(0, i - 1, "done"),
      ...(largestAt !== undefined ? { [largestAt]: "success" as CellTone } : {}),
      ...(secondAt !== undefined ? { [secondAt]: "tertiary" as CellTone } : {}),
    });

    r.step(3, `Start both trackers at \`-∞\`, so the very first element is guaranteed to beat them.`, {
      arrays: [view(undefined, {})],
      vars: { largest, second },
    });

    for (let i = 0; i < n; i++) {
      const x = nums[i];
      if (x > largest) {
        const old = largest;
        second = largest;
        secondAt = largestAt;
        largest = x;
        largestAt = i;
        r.step(
          7,
          `**${x}** beats the largest (${old === -Infinity ? "-∞" : old}). The old largest slides down to become \`second\`, and ${x} takes the top spot.`,
          { arrays: [view(i, { ...marks(i), [i]: "write" })], vars: { i, "nums[i]": x, largest, second } }
        );
      } else if (x < largest && x > second) {
        second = x;
        secondAt = i;
        r.step(
          9,
          `**${x}** is smaller than the largest (${largest}) but bigger than \`second\`, so it becomes the new second largest.`,
          { arrays: [view(i, { ...marks(i), [i]: "write" })], vars: { i, "nums[i]": x, largest, second } }
        );
      } else {
        r.step(
          8,
          x === largest
            ? `**${x}** equals the largest. A duplicate of the largest is **not** a second largest, so skip it.`
            : `**${x}** is not bigger than \`second\` (${second === -Infinity ? "-∞" : second}), so nothing changes.`,
          { arrays: [view(i, { ...marks(i), [i]: "primary" })], vars: { i, "nums[i]": x, largest, second } }
        );
      }
    }

    const answer = second === -Infinity ? -1 : second;
    r.step(
      12,
      answer === -1
        ? `No value is strictly smaller than the largest (${largest}), so there is **no** second largest — return -1.`
        : `One pass, two variables. The second largest is **${answer}**. Time O(n), space O(1).`,
      {
        arrays: [view(undefined, marks(n))],
        vars: { largest, second: answer },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
