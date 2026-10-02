import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}`;

const program: Program = {
  title: "Remove duplicates from a sorted array",
  code,
  fields: [{ key: "nums", label: "nums (sorted)", kind: "array", maxLength: 10 }],
  examples: [
    { label: "Example", input: { nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] } },
    { label: "Short", input: { nums: [1, 1, 2] } },
    { label: "All unique", input: { nums: [2, 4, 6] } },
  ],
  check(input) {
    const nums = input.nums as number[];
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] < nums[i - 1]) return "nums must be sorted in ascending order (duplicates next to each other).";
    }
    return null;
  },
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    let write = 1;

    const view = (read: number | undefined, tones: Record<number, CellTone>) => ({
      name: "nums",
      values: nums,
      tones: { ...toneRange(0, write - 1, "done"), ...tones },
      pointers: pointersAt(n, { write, read }, { write: "tertiary" }),
    });

    r.step(
      3,
      `The first value is always kept. \`write = 1\` is where the next **new** value will go; \`nums[write - 1]\` is the last value kept.`,
      { arrays: [view(undefined, {})], vars: { write } }
    );

    for (let read = 1; read < n; read++) {
      const x = nums[read];
      const last = nums[write - 1];
      if (x !== last) {
        nums[write] = x;
        r.step(
          6,
          `**${x}** differs from the last kept value (${last}) — it is new. Copy it to index ${write}.`,
          { arrays: [view(read, { [write]: "write", [read]: "primary" })], vars: { read, write, "last kept": last } }
        );
        write++;
      } else {
        r.step(
          5,
          `**${x}** equals the last kept value — a duplicate. Skip it; \`write\` does not move.`,
          { arrays: [view(read, { [read]: "muted", [write - 1]: "tertiary" })], vars: { read, write, "last kept": last } }
        );
      }
    }

    r.step(
      10,
      `Return **k = ${write}**. The first ${write} slots hold each distinct value once, in order; whatever sits after them doesn't matter. O(n) time, O(1) space.`,
      {
        arrays: [
          {
            name: "nums",
            values: nums,
            tones: { ...toneRange(0, write - 1, "success"), ...toneRange(write, n - 1, "muted") },
          },
        ],
        vars: { k: write },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
