import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function increasingTriplet(nums) {
  let first = Infinity, second = Infinity;
  for (const x of nums) {
    if (x <= first) {
      first = x;
    } else if (x <= second) {
      second = x;
    } else {
      return true;
    }
  }
  return false;
}`;

const program: Program = {
  title: "Increasing triplet subsequence",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Example", input: { nums: [2, 1, 5, 0, 4, 6] } },
    { label: "Decreasing", input: { nums: [5, 4, 3, 2, 1] } },
    { label: "Tricky", input: { nums: [20, 100, 10, 12, 5, 13] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let first = Infinity;
    let second = Infinity;
    let firstAt: number | undefined;
    let secondAt: number | undefined;
    // The value `first` held when `second` was set: proof that a smaller number came before it.
    let secondsFirst: number | undefined;

    const view = (i: number, tones: Record<number, CellTone> = {}) => {
      const base: Record<number, CellTone> = { ...toneRange(0, i - 1, "done") };
      if (firstAt !== undefined) base[firstAt] = "primary";
      if (secondAt !== undefined) base[secondAt] = "tertiary";
      return {
        name: "nums",
        values: nums,
        tones: { ...base, ...tones },
        pointers: pointersAt(n, { first: firstAt, second: secondAt, x: i }, { first: "primary", second: "tertiary", x: "secondary" }),
      };
    };

    r.step(
      2,
      `Keep the two best "starters": **first** = the smallest value so far, **second** = the smallest value that has something smaller before it. Both start at ∞.`,
      { arrays: [{ name: "nums", values: nums }], vars: { first, second } }
    );

    for (let i = 0; i < n; i++) {
      const x = nums[i];
      if (x <= first) {
        first = x;
        firstAt = i;
        r.step(
          5,
          secondAt === undefined
            ? `${x} ≤ first, so it's the new smallest: **first = ${x}**. A lower start makes it easier to build a triplet later.`
            : `${x} ≤ first, so **first = ${x}**. Notice first now sits *after* second — that's fine: second = ${second} still remembers that ${secondsFirst} came before it.`,
          { arrays: [view(i, { [i]: "primary" })], vars: { x, first, second } }
        );
      } else if (x <= second) {
        second = x;
        secondAt = i;
        secondsFirst = first;
        r.step(
          7,
          `${x} is bigger than first (${first}) but ≤ second, so **second = ${x}**: we now have a pair ${first} < ${x}, with the smallest possible second element.`,
          { arrays: [view(i, { [i]: "tertiary" })], vars: { x, first, second } }
        );
      } else {
        r.step(
          9,
          `${x} is bigger than second (${second}), and second has a smaller value (${secondsFirst}) before it. That's an increasing triplet: **${secondsFirst} < ${second} < ${x}**. Return true. One pass, two variables: **O(n) time, O(1) space**.`,
          { arrays: [view(i, { [i]: "success", ...(secondAt !== undefined ? { [secondAt]: "success" } : {}) })], vars: { x, first, second, answer: "true" }, done: true }
        );
        return r.frames;
      }
    }

    r.step(
      12,
      `No value ever beat second, so no increasing triplet exists. Return **false**. **O(n) time, O(1) space**.`,
      { arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }], vars: { first, second, answer: "false" }, done: true }
    );
    return r.frames;
  },
};

export default program;
