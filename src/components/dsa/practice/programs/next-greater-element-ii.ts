import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function nextGreaterElements(nums) {
  const n = nums.length;
  const ans = new Array(n).fill(-1);
  const stack = [];                        // indexes still waiting for something bigger
  for (let i = 0; i < 2 * n; i++) {
    const x = nums[i % n];                 // the second lap wraps around
    while (stack.length > 0 && nums[stack[stack.length - 1]] < x) {
      ans[stack.pop()] = x;
    }
    if (i < n) stack.push(i);              // second lap: answer only, never wait
  }
  return ans;
}`;

const program: Program = {
  title: "Next greater element II (circular)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 7, min: -99, max: 99 }],
  examples: [
    { label: "Example 1", input: { nums: [1, 2, 1] } },
    { label: "Example 2", input: { nums: [1, 2, 3, 4, 3] } },
    { label: "Decreasing", input: { nums: [5, 4, 3, 2, 1] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    const ans: (number | null)[] = new Array(n).fill(null);
    const stack: number[] = [];
    const entry = (idx: number) => `${nums[idx]} (#${idx})`;

    const view = (i: number | undefined, tones: Record<number, CellTone> = {}, ansTones: Record<number, CellTone> = {}, stackTones: Record<number, CellTone> = {}) => ({
      arrays: [
        // A short tag: a wide one would push the cells apart.
        { name: "nums", values: nums, tones, pointers: pointersAt(n, { [i !== undefined && i >= n ? "i%n" : "i"]: i === undefined ? undefined : i % n }) },
        { name: "ans", values: ans, tones: ansTones },
      ],
      stacks: [{ name: "stack (value, #index)", values: stack.map(entry), tones: stackTones }],
    });

    r.step(4, `The array is **circular**: after the last number, the search continues from the start. Walk it **twice** (i from 0 to ${2 * n - 1}) and use \`i % n\` so the second lap revisits the same numbers.`, {
      ...view(undefined),
      vars: { n },
    });

    for (let i = 0; i < 2 * n; i++) {
      const k = i % n;
      const x = nums[k];
      while (stack.length > 0 && nums[stack[stack.length - 1]] < x) {
        const j = stack.pop()!;
        ans[j] = x;
        r.step(8, `${x} > ${nums[j]} (index ${j}): ${x} is the first bigger number after it${i >= n ? ", found by wrapping round" : ""}. **ans[${j}] = ${x}**.`, {
          ...view(i, { [k]: "primary" }, { [j]: "write" }),
          vars: { lap: i < n ? 1 : 2, i, "i % n": k, x },
        });
      }
      if (i < n) {
        stack.push(k);
        r.step(10, `Push index ${k} (value ${x}) — it waits for a bigger number, which might only appear on the second lap.`, {
          ...view(i, { [k]: "primary" }, {}, { [stack.length - 1]: "write" }),
          vars: { lap: 1, i, x },
        });
      } else if (i === n) {
        r.step(10, `**Lap 2** begins. Nothing new is pushed now: these numbers already have their place in the stack. They only **answer** the indexes still waiting.`, {
          ...view(i, { [k]: "primary" }),
          vars: { lap: 2, i, "i % n": k, x },
        });
      }
    }

    const final = ans.map((v) => v ?? -1);
    r.step(12, `${stack.length ? `Still waiting: ${stack.map((j) => nums[j]).join(", ")} — nothing in the whole circle is bigger, so -1. ` : ""}Answer: **[${final.join(", ")}]**. Two laps, each index pushed once and popped at most once: **O(n)**.`, {
      arrays: [
        { name: "nums", values: nums },
        { name: "ans", values: final, tones: Object.fromEntries(final.map((_, j) => [j, "success" as CellTone])) },
      ],
      stacks: [{ name: "stack (value, #index)", values: stack.map(entry) }],
      vars: {},
      done: true,
    });
    return r.frames;
  },
};

export default program;
