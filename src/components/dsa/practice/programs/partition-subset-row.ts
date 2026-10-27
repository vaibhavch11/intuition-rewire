import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 === 1) return false;
  const target = total / 2;
  const can = new Array(target + 1).fill(false); // can[s]: some subset so far sums to s
  can[0] = true;                                 // the empty subset
  for (const x of nums) {
    for (let s = target; s >= x; s--) {          // backwards: each number is used once
      if (can[s - x]) can[s] = true;
    }
  }
  return can[target];
}`;

const program: Program = {
  title: "Partition equal subset sum: one row of booleans",
  code,
  fields: [{ key: "nums", label: "nums (positive)", kind: "array", maxLength: 8, min: 1, max: 30 }],
  examples: [
    { label: "Example", input: { nums: [1, 5, 11, 5] } },
    { label: "No subset", input: { nums: [1, 2, 5] } },
    { label: "Odd total", input: { nums: [1, 2, 3, 5] } },
    { label: "Six numbers", input: { nums: [3, 1, 4, 2, 2, 6] } },
  ],
  check: (input) => {
    const nums = input.nums as number[];
    if (!nums.length) return "Add at least one number.";
    return nums.reduce((a, b) => a + b, 0) > 60 ? "Keep the total at 60 or less so the row fits." : null;
  },
  run(input) {
    const nums = input.nums as number[];
    const r = recorder();
    const total = nums.reduce((a, b) => a + b, 0);
    const numsView = (tones: Record<number, CellTone> = {}) => ({ name: "nums", values: nums, tones });

    r.step(lineOf(code, "const total = "), `The numbers add up to **${total}**. Two equal halves would each be ${total} / 2.`, { arrays: [numsView()], vars: { total } });
    if (total % 2 === 1) {
      r.step(lineOf(code, "if (total % 2 === 1) return false;"), `${total} is odd, so it can't be split into two equal whole halves: **false**.`, { arrays: [numsView()], vars: { total }, done: true });
      return r.frames;
    }
    const target = total / 2;
    const can: boolean[] = new Array(target + 1).fill(false);
    can[0] = true;
    const view = (ct: Record<number, CellTone> = {}, nt: Record<number, CellTone> = {}, x?: number) => {
      const tones: Record<number, CellTone> = {};
      can.forEach((on, s) => {
        if (on) tones[s] = "done";
      });
      return {
        arrays: [numsView(nt), { name: `can[s] (s = 0..${target})`, values: can.map((on) => (on ? "T" : "F")), tones: { ...tones, ...ct } }],
        vars: x === undefined ? { total, target } : { total, target, x },
      };
    };

    r.step(lineOf(code, "can[0] = true;"), `The question is now: can some subset make exactly **${target}**? can[s] records which sums are reachable. At first only the empty subset exists, so only can[0] is true.`, view({ 0: "write" }));
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      const nt: Record<number, CellTone> = {};
      for (let j = 0; j < i; j++) nt[j] = "done";
      nt[i] = "primary";
      r.step(lineOf(code, "for (let s = target; s >= x; s--) {"), x > target ? `Add ${x}: it's bigger than ${target}, so it can't be in either half. Nothing changes.` : `Add **${x}**. Scan s from ${target} down to ${x}: every reachable sum s − ${x} makes s reachable too.`, view({}, nt, x));
      for (let s = target; s >= x; s--) {
        if (!can[s - x] || can[s]) continue;
        can[s] = true;
        r.step(lineOf(code, "if (can[s - x]) can[s] = true;"), `can[${s - x}] is true, so ${s - x} + ${x} = **${s}** is reachable.${s === target ? " That's the target!" : ""}`, view({ [s - x]: "primary", [s]: "write" }, nt, x));
      }
    }
    const reached = can[target];
    r.step(lineOf(code, "return can[target];"), reached ? `can[${target}] is true: some subset sums to ${target}, and the rest sums to ${target} too. **true**. O(n · target) time, O(target) space.` : `can[${target}] is still false: no subset reaches ${target}. **false**.`, { ...view({ [target]: reached ? "success" : "tertiary" }), done: true });
    return r.frames;
  },
};

export default program;
