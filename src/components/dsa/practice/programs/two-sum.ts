import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`;

const program: Program = {
  title: "Two Sum (one-pass hash map)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10, min: -50, max: 50 },
    { key: "target", label: "target", kind: "number", min: -100, max: 100 },
  ],
  examples: [
    { label: "Example", input: { nums: [2, 7, 11, 15], target: 9 } },
    { label: "Pair at the end", input: { nums: [3, 2, 4], target: 6 } },
    { label: "Same value twice", input: { nums: [3, 3], target: 6 } },
    { label: "Negatives", input: { nums: [-3, 4, 3, 90], target: 0 } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    const seen = new Map<number, number>();
    const seenView = () => ({ name: "seen (value → index)", values: [...seen].map(([v, i]) => `${v} → ${i}`) });

    r.step(2, `Start with an empty map. It will remember every value we walk past, and **where** we saw it.`, {
      arrays: [{ name: "nums", values: nums }, seenView()],
      vars: { target },
    });

    for (let i = 0; i < n; i++) {
      const need = target - nums[i];
      const numsView = {
        name: "nums",
        values: nums,
        tones: { ...toneRange(0, i - 1, "done"), [i]: "primary" as const },
        pointers: pointersAt(n, { i }),
      };
      r.step(4, `\`nums[${i}] = ${nums[i]}\` needs a partner of ${target} − ${nums[i]} = **${need}**. Have we already walked past a ${need}?`, {
        arrays: [numsView, seenView()],
        vars: { i, "nums[i]": nums[i], need },
      });

      if (seen.has(need)) {
        const j = seen.get(need)!;
        const mapIndex = [...seen.keys()].indexOf(need);
        r.step(
          6,
          `Yes — the map says ${need} was at index **${j}**. ${nums[j]} + ${nums[i]} = ${target}, so the answer is **[${j}, ${i}]**. One pass, one lookup per element: **O(n) time**, at most n map entries: **O(n) space**.`,
          {
            arrays: [
              { name: "nums", values: nums, tones: { ...toneRange(0, n - 1, "muted"), [j]: "success", [i]: "success" }, pointers: pointersAt(n, { j, i }, { j: "tertiary" }) },
              { ...seenView(), tones: { [mapIndex]: "success" } },
            ],
            vars: { answer: [j, i] },
            done: true,
          }
        );
        return r.frames;
      }

      seen.set(nums[i], i);
      r.step(8, `No ${need} yet. Remember this value instead: \`seen.set(${nums[i]}, ${i})\`. A later number may need it as its partner.`, {
        arrays: [numsView, { ...seenView(), tones: { [[...seen.keys()].indexOf(nums[i])]: "write" } }],
        vars: { i, "nums[i]": nums[i], need },
      });
    }

    r.step(10, `The loop ended without a match, so no two numbers add up to ${target}. (LeetCode guarantees one answer exists, so this line never runs there.)`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }, seenView()],
      vars: { answer: [] },
      done: true,
    });
    return r.frames;
  },
};

export default program;
