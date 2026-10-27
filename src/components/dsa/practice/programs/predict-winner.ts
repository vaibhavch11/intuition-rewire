import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function predictTheWinner(nums) {
  const lead = (l, r) => {                       // best lead for whoever moves on nums[l..r]
    if (l === r) return nums[l];                 // one number left: take it
    const takeLeft = nums[l] - lead(l + 1, r);   // the opponent then leads by lead(l+1, r)
    const takeRight = nums[r] - lead(l, r - 1);
    return Math.max(takeLeft, takeRight);
  };
  return lead(0, nums.length - 1) >= 0;
}`;

const program: Program = {
  title: "Predict the winner: the game tree",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 5, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [1, 5, 2] } },
    { label: "Four numbers", input: { nums: [1, 5, 233, 7] } },
    { label: "Five numbers", input: { nums: [3, 9, 1, 2, 4] } },
  ],
  check: (input) => ((input.nums as number[]).length ? null : "Add at least one number."),
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    const tree = callTree("game tree: l-r is the range in play, the number below is its best lead");
    const tones: Record<number, CellTone> = {};
    const captions: Record<number, string> = {};
    const view = (id: number, l: number, rr: number) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(id)) }, captions: { ...captions } })],
      arrays: [{ name: "nums", values: nums, tones: { ...toneRange(0, l - 1, "muted"), ...toneRange(rr + 1, n - 1, "muted") } }],
    });

    const lead = (l: number, rr: number, parent: number | null): number => {
      const id = tree.add(parent, `${l}-${rr}`);
      if (l === rr) {
        tones[id] = "success";
        captions[id] = `${nums[l]}`;
        r.step(lineOf(code, "if (l === r) return nums[l];"), `Only nums[${l}] = ${nums[l]} is left: whoever moves takes it, leading by **${nums[l]}**.`, { ...view(id, l, rr), vars: { l, r: rr } });
        return nums[l];
      }
      r.step(lineOf(code, "const takeLeft = nums[l] - lead(l + 1, r);"), `Range ${l}..${rr}: the player to move tries **taking nums[${l}] = ${nums[l]}**. Then the opponent plays on ${l + 1}..${rr}.`, { ...view(id, l, rr), vars: { l, r: rr } });
      const a = lead(l + 1, rr, id);
      const takeLeft = nums[l] - a;
      r.step(lineOf(code, "const takeRight = nums[r] - lead(l, r - 1);"), `Taking the left end leads by ${nums[l]} − ${a} = ${takeLeft}. Now try **taking nums[${rr}] = ${nums[rr]}** instead.`, { ...view(id, l, rr), vars: { l, r: rr, takeLeft } });
      const b = lead(l, rr - 1, id);
      const takeRight = nums[rr] - b;
      const best = Math.max(takeLeft, takeRight);
      tones[id] = "done";
      captions[id] = `${best}`;
      r.step(lineOf(code, "return Math.max(takeLeft, takeRight);"), `Range ${l}..${rr}: left gives ${takeLeft}, right gives ${nums[rr]} − ${b} = ${takeRight}. Playing well, the mover takes the ${takeLeft >= takeRight ? "left" : "right"} end: lead **${best}**.`, {
        ...view(id, l, rr),
        vars: { l, r: rr, takeLeft, takeRight, lead: best },
      });
      return best;
    };

    const total = lead(0, n - 1, null);
    const wins = total >= 0;
    r.step(lineOf(code, "return lead(0, nums.length - 1) >= 0;"), `Player 1's best lead on the whole array is ${total}, so Player 1 ${wins ? (total === 0 ? "ties" : "wins") : "loses"}: **${wins}**. ${tree.size} calls for ${n} numbers — the tree doubles with every number, O(2ⁿ); remembering each range makes it O(n²).`, {
      graphs: [tree.view({ tones: { ...tones }, captions: { ...captions } })],
      arrays: [{ name: "nums", values: nums }],
      vars: { lead: total, answer: String(wins) },
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
