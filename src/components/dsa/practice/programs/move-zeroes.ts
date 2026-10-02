import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
  return nums;
}`;

const program: Program = {
  title: "Move zeroes to the end",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Example", input: { nums: [0, 1, 0, 3, 12] } },
    { label: "Zeroes at the front", input: { nums: [0, 0, 4, 5] } },
    { label: "No zeroes", input: { nums: [3, 1, 2] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    let write = 0;

    const view = (read: number | undefined, tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones: { ...toneRange(0, write - 1, "done"), ...tones },
      pointers: pointersAt(n, { write, read }, { write: "tertiary" }),
    });

    r.step(
      2,
      `\`write\` marks where the next non-zero belongs. Everything to its left will be finished, non-zero values in their original order.`,
      { arrays: [view(undefined, {})], vars: { write } }
    );

    for (let read = 0; read < n; read++) {
      const x = nums[read];
      if (x !== 0) {
        const same = read === write;
        [nums[write], nums[read]] = [nums[read], nums[write]];
        r.step(
          5,
          same
            ? `**${x}** is non-zero and already sits at \`write\` — the swap leaves it where it is.`
            : `**${x}** is non-zero, so swap it back to index ${write}. The zero that was there moves forward to index ${read}.`,
          { arrays: [view(read, { [write]: "write", [read]: same ? "write" : "muted" })], vars: { read, write } }
        );
        write++;
        r.step(6, `Advance \`write\` to ${write}. Indexes 0–${write - 1} are finished.`, {
          arrays: [view(read, {})],
          vars: { read, write },
        });
      } else {
        r.step(
          4,
          `\`nums[${read}]\` is **0** — skip it. \`write\` stays put, holding the spot for the next non-zero.`,
          { arrays: [view(read, { [read]: "muted" })], vars: { read, write } }
        );
      }
    }

    r.step(
      9,
      `All ${write} non-zero values kept their order and every zero is at the end. One pass, no extra array: **O(n) time, O(1) space**.`,
      {
        arrays: [
          {
            name: "nums",
            values: nums,
            tones: { ...toneRange(0, write - 1, "success"), ...toneRange(write, n - 1, "muted") },
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
