import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function majorityElement(nums) {
  let candidate = null;
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    if (count === 0) candidate = nums[i];
    count += nums[i] === candidate ? 1 : -1;
  }
  return candidate;
}`;

const program: Program = {
  title: "Majority element (Boyer–Moore voting)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 11 }],
  examples: [
    { label: "Example", input: { nums: [2, 2, 1, 1, 1, 2, 2] } },
    { label: "Short", input: { nums: [3, 2, 3] } },
    { label: "Late majority", input: { nums: [1, 3, 3, 2, 3, 3, 3] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    let candidate: number | null = null;
    let count = 0;

    const view = (i: number | undefined, tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones: { ...(i === undefined ? {} : toneRange(0, i - 1, "done")), ...tones },
      pointers: pointersAt(n, { i }),
    });

    r.step(
      3,
      `Think of it as a vote. Each element either **supports** the current \`candidate\` (+1) or **cancels** one of its votes (−1).`,
      { arrays: [view(undefined, {})], vars: { candidate, count } }
    );

    for (let i = 0; i < n; i++) {
      const x = nums[i];
      const fresh = count === 0;
      if (fresh) candidate = x;
      const supports = x === candidate;
      count += supports ? 1 : -1;
      r.step(
        6,
        fresh
          ? `\`count\` is 0, so nobody is in the lead — **${x}** becomes the candidate with 1 vote.`
          : supports
            ? `**${x}** matches the candidate — one more vote, \`count = ${count}\`.`
            : `**${x}** is different — it cancels one of ${candidate}'s votes, \`count = ${count}\`.`,
        {
          arrays: [view(i, { [i]: supports ? "write" : "primary" })],
          vars: { i, "nums[i]": x, candidate, count },
        }
      );
    }

    const occurrences = nums.filter((x) => x === candidate).length;
    const isMajority = occurrences > n / 2;
    const tones: Record<number, CellTone> = {};
    nums.forEach((x, i) => {
      tones[i] = x === candidate ? (isMajority ? "success" : "tertiary") : "muted";
    });
    r.step(
      8,
      isMajority
        ? `**${candidate}** survives. It appears ${occurrences} times out of ${n} (more than n/2), so every other value together couldn't cancel it out. O(n) time, O(1) space.`
        : `The vote ends on **${candidate}**, but it appears only ${occurrences} of ${n} times. This input has **no** majority — the problem guarantees one, and if it didn't you would count the candidate in a second pass to confirm.`,
      { arrays: [{ name: "nums", values: nums, tones }], vars: { candidate, count, appears: occurrences }, done: true }
    );
    return r.frames;
  },
};

export default program;
