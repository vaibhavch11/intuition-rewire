import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);
  let prefix = 0, count = 0;
  for (const x of nums) {
    prefix += x;
    count += seen.get(prefix - k) ?? 0;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}`;

const program: Program = {
  title: "Subarray sum equals k (prefix sums + hash map)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 9, min: -20, max: 20 },
    { key: "k", label: "k", kind: "number", min: -50, max: 50 },
  ],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3], k: 3 } },
    { label: "Repeats", input: { nums: [1, 1, 1], k: 2 } },
    { label: "Negatives", input: { nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const n = nums.length;
    const r = recorder();
    const seen = new Map<number, number>([[0, 1]]);
    // prefixes[j] = sum of the first j numbers; prefixes[0] = 0 (the empty start).
    const prefixes = [0];
    let prefix = 0;
    let count = 0;

    const seenView = (tones: Record<number, CellTone> = {}) => ({
      name: "seen (prefix sum → times)",
      values: [...seen].map(([s, c]) => `${s} → ${c}`),
      tones,
    });
    const keyIndex = (key: number) => [...seen.keys()].indexOf(key);

    r.step(
      2,
      `Idea: the sum of nums[a..i] is **prefix(i) − prefix(before a)**. So a subarray ending here sums to k exactly when an **earlier prefix equals prefix − k**. The map starts with **0 → 1**: the empty prefix before index 0.`,
      { arrays: [{ name: "nums", values: nums }, seenView({ 0: "write" })], vars: { k, prefix, count } }
    );

    for (let i = 0; i < n; i++) {
      prefix += nums[i];
      prefixes.push(prefix);
      const want = prefix - k;
      const found = seen.get(want) ?? 0;

      // Every earlier start whose prefix equals `want` gives one subarray ending at i.
      const starts: number[] = [];
      for (let j = 0; j < prefixes.length - 1; j++) if (prefixes[j] === want) starts.push(j);
      const latest = starts[starts.length - 1];

      r.step(5, `Add nums[${i}] = ${nums[i]}: the running sum is now **prefix = ${prefix}**.`, {
        arrays: [
          { name: "nums", values: nums, tones: { ...toneRange(0, i - 1, "done"), [i]: "primary" }, pointers: pointersAt(n, { i }) },
          seenView(),
        ],
        vars: { i, "nums[i]": nums[i], prefix, count },
      });

      count += found;
      r.step(
        6,
        found
          ? `Look up prefix − k = ${prefix} − ${k} = **${want}**: seen **${found}** time${found === 1 ? "" : "s"}. So ${found} subarray${found === 1 ? "" : "s"} ending at index ${i} sum${found === 1 ? "s" : ""} to ${k}${starts.length ? ` (the shortest is nums[${latest}..${i}])` : ""}. count = **${count}**.`
          : `Look up prefix − k = ${prefix} − ${k} = **${want}**: never seen, so no subarray ending at index ${i} sums to ${k}.`,
        {
          arrays: [
            {
              name: "nums",
              values: nums,
              tones: found ? { ...toneRange(0, i, "done"), ...toneRange(latest, i, "success") } : { ...toneRange(0, i - 1, "done"), [i]: "primary" },
              pointers: pointersAt(n, { i }),
            },
            seenView(found ? { [keyIndex(want)]: "success" } : {}),
          ],
          vars: { i, prefix, "prefix − k": want, count },
        }
      );

      seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
      r.step(7, `Record this prefix so later positions can use it: seen[${prefix}] = ${seen.get(prefix)}.`, {
        arrays: [
          { name: "nums", values: nums, tones: { ...toneRange(0, i - 1, "done"), [i]: "primary" }, pointers: pointersAt(n, { i }) },
          seenView({ [keyIndex(prefix)]: "write" }),
        ],
        vars: { i, prefix, count },
      });
    }

    r.step(
      9,
      `**${count}** subarray${count === 1 ? "" : "s"} sum to ${k}. One pass with one map lookup per element: **O(n) time, O(n) space** — and it works with negative numbers, where a sliding window would fail.`,
      { arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }, seenView()], vars: { count }, done: true }
    );
    return r.frames;
  },
};

export default program;
