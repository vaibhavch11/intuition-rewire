import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function lengthOfLIS(nums) {
  const n = nums.length;
  const dp = new Array(n).fill(1);               // dp[i]: longest increasing subsequence ending at nums[i]
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);   // put nums[i] after the one ending at j
    }
  }
  return Math.max(...dp);                        // it can end anywhere
}`;

const program: Program = {
  title: "Longest increasing subsequence: the best ending at each index",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 10, min: -99, max: 999 }],
  examples: [
    { label: "Example", input: { nums: [10, 9, 2, 5, 3, 7, 101, 18] } },
    { label: "Ends early", input: { nums: [1, 3, 5, 2] } },
    { label: "All equal", input: { nums: [7, 7, 7, 7] } },
    { label: "Zigzag", input: { nums: [0, 1, 0, 3, 2, 3] } },
  ],
  check: (input) => ((input.nums as number[]).length ? null : "Add at least one number."),
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    const dp: number[] = new Array(n).fill(1);
    const from: number[] = new Array(n).fill(-1);
    const view = (dt: Record<number, CellTone> = {}, nt: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "nums", values: nums, tones: nt },
        { name: "dp (longest ending here)", values: [...dp], tones: dt },
      ],
    });

    r.step(lineOf(code, "const dp = "), `dp[i] = the longest increasing subsequence that **ends at nums[i]**. On its own, every number is a subsequence of length 1.`, view());
    for (let i = 1; i < n; i++) {
      const smaller: number[] = [];
      for (let j = 0; j < i; j++) {
        if (nums[j] < nums[i]) {
          smaller.push(j);
          if (dp[j] + 1 > dp[i]) {
            dp[i] = dp[j] + 1;
            from[i] = j;
          }
        }
      }
      const nt: Record<number, CellTone> = { [i]: "write" };
      const dt: Record<number, CellTone> = { [i]: "write" };
      for (const j of smaller) {
        nt[j] = "primary";
        dt[j] = "primary";
      }
      if (from[i] >= 0) dt[from[i]] = "success";
      const note = smaller.length
        ? `nums[${i}] = ${nums[i]}. Smaller numbers before it: ${smaller.map((j) => `${nums[j]} (dp ${dp[j]})`).join(", ")}. Extend the longest: dp[${i}] = ${dp[from[i]]} + 1 = **${dp[i]}**.`
        : `nums[${i}] = ${nums[i]}. Nothing before it is smaller, so it starts a new subsequence: dp[${i}] = **1**.`;
      r.step(lineOf(code, "if (nums[j] < nums[i]) dp[i] = Math.max("), note, view(dt, nt));
    }
    const best = Math.max(...dp);
    let end = dp.indexOf(best);
    const chain: number[] = [];
    while (end >= 0) {
      chain.push(end);
      end = from[end];
    }
    chain.reverse();
    const picked = Object.fromEntries(chain.map((k) => [k, "success"])) as Record<number, CellTone>;
    r.step(lineOf(code, "return Math.max(...dp);"), `The longest ends wherever dp is largest: **${best}** — for example ${chain.map((k) => nums[k]).join(", ")}. O(n²) time, O(n) space.`, { ...view({ [chain[chain.length - 1]]: "success" }, picked), done: true });
    return r.frames;
  },
};

export default program;
