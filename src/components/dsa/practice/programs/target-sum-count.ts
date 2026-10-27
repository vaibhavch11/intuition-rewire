import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function findTargetSumWays(nums, target) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > total || (total + target) % 2 !== 0) return 0;   // no split works
  const plus = (total + target) / 2;             // the + numbers must sum to this
  const ways = new Array(plus + 1).fill(0);      // ways[s]: subsets so far that sum to s
  ways[0] = 1;                                   // the empty subset
  for (const x of nums) {
    for (let s = plus; s >= x; s--) ways[s] += ways[s - x];   // backwards: x is used once
  }
  return ways[plus];
}`;

const program: Program = {
  title: "Target sum: count subsets that sum to P",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 6, min: 0, max: 9 },
    { key: "target", label: "target", kind: "number", min: -40, max: 40 },
  ],
  examples: [
    { label: "Example", input: { nums: [1, 1, 1, 1, 1], target: 3 } },
    { label: "Mixed", input: { nums: [2, 3, 1, 4], target: 2 } },
    { label: "With a zero", input: { nums: [0, 1, 2], target: 1 } },
    { label: "Unreachable", input: { nums: [1, 2, 3], target: 7 } },
  ],
  check: (input) => {
    const nums = input.nums as number[];
    if (!nums.length) return "Add at least one number.";
    const total = nums.reduce((a, b) => a + b, 0);
    const target = input.target as number;
    return (total + target) / 2 > 20 ? "Keep (total + target) / 2 at 20 or less so the row fits." : null;
  },
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const r = recorder();
    const total = nums.reduce((a, b) => a + b, 0);
    const numsView = (tones: Record<number, CellTone> = {}) => ({ name: "nums", values: nums, tones });

    r.step(lineOf(code, "const total = "), `Split the numbers into a + group (sum P) and a − group (sum N). P + N = total = **${total}** and P − N = target = ${target}.`, { arrays: [numsView()], vars: { total, target } });
    if (Math.abs(target) > total || (total + target) % 2 !== 0) {
      const why = Math.abs(target) > total ? `|${target}| is more than the total ${total}: even all + (or all −) can't reach it` : `total + target = ${total + target} is odd, so P = (total + target) / 2 isn't a whole number`;
      r.step(lineOf(code, "if (Math.abs(target) > total"), `${why}. **0** expressions.`, { arrays: [numsView()], vars: { total, target }, done: true });
      return r.frames;
    }
    const plus = (total + target) / 2;
    const ways: number[] = new Array(plus + 1).fill(0);
    ways[0] = 1;
    const view = (wt: Record<number, CellTone> = {}, nt: Record<number, CellTone> = {}, x?: number) => ({
      arrays: [numsView(nt), { name: `ways[s] (s = 0..${plus})`, values: [...ways], tones: wt }],
      vars: x === undefined ? { total, target, P: plus } : { total, target, P: plus, x },
    });

    r.step(lineOf(code, "const plus = "), `Adding the two equations: P = (${total} + ${target}) / 2 = **${plus}**. Every expression is a choice of + numbers summing to ${plus}, so count those subsets.`, view());
    r.step(lineOf(code, "ways[0] = 1;"), `ways[s] = how many subsets of the numbers seen so far sum to s. Before any number, only the empty subset exists: ways[0] = 1.`, view({ 0: "write" }));
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      const nt: Record<number, CellTone> = {};
      for (let j = 0; j < i; j++) nt[j] = "done";
      nt[i] = "primary";
      const before = [...ways];
      let changed = false;
      for (let s = plus; s >= x; s--) {
        if (before[s - x] === 0) continue;
        const old = ways[s];
        ways[s] += ways[s - x];
        changed = true;
        r.step(lineOf(code, "for (let s = plus; s >= x; s--) ways[s] += ways[s - x];"), x === 0 ? `x = 0: +0 and −0 are different expressions, so every count doubles. ways[${s}] = ${old} + ${old} = **${ways[s]}**.` : `x = ${x}: the ${before[s - x]} subset${before[s - x] === 1 ? "" : "s"} summing to ${s - x} can take ${x} to reach ${s}. ways[${s}] = ${old} + ${before[s - x]} = **${ways[s]}**.`, view({ [s - x]: "primary", [s]: "write" }, nt, x));
      }
      if (!changed) r.step(lineOf(code, "for (const x of nums) {"), `x = ${x} is bigger than ${plus}: it must get a − sign. No count changes.`, view({}, nt, x));
    }
    r.step(lineOf(code, "return ways[plus];"), `**${ways[plus]}** subset${ways[plus] === 1 ? "" : "s"} sum to ${plus}, so ${ways[plus]} expression${ways[plus] === 1 ? "" : "s"} reach ${target}. O(n · P) time, O(P) space.`, { ...view({ [plus]: ways[plus] ? "success" : "tertiary" }), done: true });
    return r.frames;
  },
};

export default program;
