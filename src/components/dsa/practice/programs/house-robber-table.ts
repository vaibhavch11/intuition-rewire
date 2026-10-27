import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function rob(nums) {
  const n = nums.length;
  const best = new Array(n).fill(0);             // best[i]: the most from houses 0..i
  for (let i = 0; i < n; i++) {
    const skip = i >= 1 ? best[i - 1] : 0;       // leave house i alone
    const take = nums[i] + (i >= 2 ? best[i - 2] : 0);   // rob it: house i - 1 must be skipped
    best[i] = Math.max(skip, take);
  }
  return best[n - 1];
}`;

const program: Program = {
  title: "House robber: rob it or skip it",
  code,
  fields: [{ key: "nums", label: "nums (money per house)", kind: "array", maxLength: 10, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [2, 7, 9, 3, 1] } },
    { label: "Skip two", input: { nums: [2, 1, 1, 2] } },
    { label: "Four houses", input: { nums: [1, 2, 3, 1] } },
  ],
  check: (input) => ((input.nums as number[]).length ? null : "Add at least one house."),
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    const best: Scalar[] = new Array(n).fill("");
    const view = (bt: Record<number, CellTone> = {}, nt: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "nums", values: nums, tones: nt },
        { name: "best (most from houses 0..i)", values: [...best], tones: bt },
      ],
    });

    r.step(lineOf(code, "const best = "), `best[i] = the most you can rob from houses 0..i. At each house: **skip** it (keep best[i − 1]) or **rob** it (nums[i] + best[i − 2], since its neighbour is skipped).`, view());
    for (let i = 0; i < n; i++) {
      const skip = i >= 1 ? (best[i - 1] as number) : 0;
      const take = nums[i] + (i >= 2 ? (best[i - 2] as number) : 0);
      best[i] = Math.max(skip, take);
      const tones: Record<number, CellTone> = { [i]: "write" };
      if (i >= 1) tones[i - 1] = take >= skip ? "primary" : "success";
      if (i >= 2) tones[i - 2] = take >= skip ? "success" : "primary";
      r.step(lineOf(code, "best[i] = Math.max(skip, take);"), `House ${i} (${nums[i]}): skip → ${skip}; rob → ${nums[i]} + ${i >= 2 ? best[i - 2] : 0} = ${take}. best[${i}] = **${best[i]}** (${take >= skip ? "rob it" : "skip it"}).`, view(tones, { [i]: take >= skip ? "success" : "muted" }));
    }
    // Walk back: a house was robbed exactly when skipping it would have given less.
    const chosen: number[] = [];
    for (let i = n - 1; i >= 0; ) {
      const skip = i >= 1 ? (best[i - 1] as number) : 0;
      if ((best[i] as number) === skip) i -= 1;
      else {
        chosen.push(i);
        i -= 2;
      }
    }
    r.step(lineOf(code, "return best[n - 1];"), `The most you can rob: **${best[n - 1]}** — houses ${chosen.length ? chosen.reverse().join(", ") : "none"}. O(n) time; only two earlier values are read, so two variables would do.`, { ...view({ [n - 1]: "success" }, Object.fromEntries(chosen.map((c) => [c, "success"])) as Record<number, CellTone>), done: true });
    return r.frames;
  },
};

export default program;
