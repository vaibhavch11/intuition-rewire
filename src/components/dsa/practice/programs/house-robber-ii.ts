import { lineOf } from "../graphs";
import { recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function rob(nums) {
  const n = nums.length;
  if (n === 1) return nums[0];
  const straight = (lo, hi) => {                 // House Robber on nums[lo..hi]
    let twoBack = 0, oneBack = 0;
    for (let i = lo; i <= hi; i++) {
      [twoBack, oneBack] = [oneBack, Math.max(oneBack, twoBack + nums[i])];
    }
    return oneBack;
  };
  return Math.max(straight(0, n - 2), straight(1, n - 1));   // skip the last, or skip the first
}`;

const program: Program = {
  title: "House robber II: two straight streets",
  code,
  fields: [{ key: "nums", label: "nums (houses in a circle)", kind: "array", maxLength: 10, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [2, 3, 2] } },
    { label: "Four houses", input: { nums: [1, 2, 3, 1] } },
    { label: "Big ends", input: { nums: [9, 1, 1, 9] } },
  ],
  check: (input) => ((input.nums as number[]).length ? null : "Add at least one house."),
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    if (n === 1) {
      r.step(lineOf(code, "if (n === 1) return nums[0];"), `One house: rob it — **${nums[0]}**.`, { arrays: [{ name: "nums", values: nums, tones: { 0: "success" } }], done: true });
      return r.frames;
    }
    const straight = (lo: number, hi: number, label: string) => {
      let twoBack = 0;
      let oneBack = 0;
      const out = lo === 0 ? n - 1 : 0;                // the house this street leaves out
      r.step(lineOf(code, "const straight = (lo, hi) => {"), `${label}: house ${out} is left out, so houses ${lo}..${hi} form a straight street. Run House Robber on it.`, {
        arrays: [{ name: "nums", values: nums, tones: { ...toneRange(lo, hi, "primary"), [out]: "muted" } }],
        vars: { twoBack, oneBack },
      });
      for (let i = lo; i <= hi; i++) {
        const robIt = twoBack + nums[i] > oneBack;
        [twoBack, oneBack] = [oneBack, Math.max(oneBack, twoBack + nums[i])];
        r.step(lineOf(code, "[twoBack, oneBack] = [oneBack, Math.max(oneBack, twoBack + nums[i])];"), `House ${i} (${nums[i]}): ${robIt ? "rob it" : "skip it"} — the best so far on this street is **${oneBack}**.`, {
          arrays: [{ name: "nums", values: nums, tones: { ...toneRange(lo, hi, "primary"), [out]: "muted", [i]: robIt ? "success" : "write" } as Record<number, CellTone> }],
          vars: { twoBack, oneBack },
        });
      }
      return oneBack;
    };
    const a = straight(0, n - 2, "Street 1 (skip the last house)");
    const b = straight(1, n - 1, "Street 2 (skip the first house)");
    r.step(lineOf(code, "return Math.max(straight(0, n - 2), straight(1, n - 1));"), `Without the last house: ${a}. Without the first: ${b}. The first and last can never both be robbed, so the answer is **${Math.max(a, b)}**. Two O(n) passes, O(1) space.`, {
      arrays: [{ name: "nums", values: nums }],
      vars: { "skip last": a, "skip first": b },
      done: true,
    });
    return r.frames;
  },
};

export default program;
