import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function findDuplicates(nums) {
  const result = [];
  for (let i = 0; i < nums.length; i++) {
    const home = Math.abs(nums[i]) - 1;
    if (nums[home] < 0) {
      result.push(home + 1);
    } else {
      nums[home] = -nums[home];
    }
  }
  return result;
}`;

const program: Program = {
  title: "Find all duplicates (marking by sign)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10, min: 1, max: 10 }],
  examples: [
    { label: "Example", input: { nums: [4, 3, 2, 7, 8, 2, 3, 1] } },
    { label: "One pair", input: { nums: [1, 1, 2] } },
    { label: "No duplicates", input: { nums: [3, 1, 2] } },
  ],
  check(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    if (nums.some((x) => x < 1 || x > n)) return `Every value must be between 1 and n (here n = ${n}), so it can point at an index.`;
    const counts = new Map<number, number>();
    for (const x of nums) counts.set(x, (counts.get(x) ?? 0) + 1);
    if ([...counts.values()].some((c) => c > 2)) return "Each value may appear at most twice.";
    return null;
  },
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    const result: number[] = [];

    // A negative slot means "the value slot + 1 has been seen".
    const marked = (): Record<number, CellTone> => {
      const out: Record<number, CellTone> = {};
      nums.forEach((x, k) => {
        if (x < 0) out[k] = "tertiary";
      });
      return out;
    };

    r.step(
      2,
      `Every value is between 1 and ${n}, so value **v** can point at index **v − 1** — its "home". We'll mark a home by making the number stored there **negative**. No extra memory needed.`,
      { arrays: [{ name: "nums", values: nums }, { name: "result", values: result }], vars: {} }
    );

    for (let i = 0; i < n; i++) {
      const value = Math.abs(nums[i]);
      const home = value - 1;
      const base = { ...marked(), [i]: "primary" as CellTone };
      if (nums[home] < 0) {
        result.push(value);
        r.step(
          6,
          `Value ${value} (read as |nums[${i}]|) points home to index ${home}, which is **already negative** — we've seen a ${value} before. It's a duplicate: add ${value} to the result.`,
          {
            arrays: [
              { name: "nums", values: nums, tones: { ...base, [home]: "success" }, pointers: pointersAt(n, { i, home }, { home: "secondary" }) },
              { name: "result", values: result, tones: { [result.length - 1]: "write" } },
            ],
            vars: { i, value, home },
          }
        );
      } else {
        nums[home] = -nums[home];
        r.step(
          8,
          `Value ${value} points home to index ${home}. It's positive, so this is the **first** ${value}: flip nums[${home}] to **${nums[home]}** to remember it. (The sign is the mark; |nums[${home}]| still holds the original value.)`,
          {
            arrays: [
              { name: "nums", values: nums, tones: { ...marked(), [i]: "primary", [home]: "write" }, pointers: pointersAt(n, { i, home }, { home: "secondary" }) },
              { name: "result", values: result },
            ],
            vars: { i, value, home },
          }
        );
      }
    }

    r.step(
      11,
      result.length
        ? `Done: **[${result.join(", ")}]** appear twice. One pass, and the only memory used was the signs inside nums: **O(n) time, O(1) extra space**.`
        : `Done: no value was seen twice, so the result is empty. **O(n) time, O(1) extra space**.`,
      {
        arrays: [
          { name: "nums", values: nums, tones: marked() },
          { name: "result", values: result, tones: Object.fromEntries(result.map((_, k) => [k, "success" as CellTone])) },
        ],
        vars: { result },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
