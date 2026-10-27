import { callTree, lineNth, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function subsets(nums) {
  const result = [];
  const path = [];
  const decide = (i) => {
    if (i === nums.length) {                 // every number decided: one subset
      result.push([...path]);
      return;
    }
    path.push(nums[i]);                      // take nums[i]
    decide(i + 1);
    path.pop();                              // un-take it ...
    decide(i + 1);                           // ... and skip it
  };
  decide(0);
  return result;
}`;

const show = (p: number[]) => `[${p.join(",")}]`;
const label = (p: number[]) => (p.length ? p.join("") : "{}");

const program: Program = {
  title: "Subsets: take or skip each number",
  code,
  fields: [{ key: "nums", label: "nums (distinct digits)", kind: "array", maxLength: 4, min: 0, max: 9 }],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3] } },
    { label: "Two numbers", input: { nums: [4, 7] } },
    { label: "Four numbers", input: { nums: [1, 2, 3, 4] } },
  ],
  check: (input) => (new Set(input.nums as number[]).size === (input.nums as number[]).length ? null : "Use distinct numbers (Subsets II handles repeats)."),
  run(input) {
    const nums = input.nums as number[];
    const r = recorder();
    const tree = callTree("decision tree: each node is the subset so far");
    const tones: Record<number, CellTone> = {};
    const result: string[] = [];
    const path: number[] = [];
    const view = (at: number, i: number) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) } })],
      arrays: [
        { name: "nums", values: nums, tones: i < nums.length ? { [i]: "primary" as CellTone } : {} },
        { name: "result", values: [...result] },
      ],
      stacks: [{ name: "path", values: [...path] }],
    });

    const root = tree.add(null, "{}");
    r.step(lineOf(code, "const path = [];"), `Decide the numbers one at a time: for each, **take it** or **skip it**. ${nums.length} decisions, two choices each: ${2 ** nums.length} leaves.`, view(root, 0));
    const decide = (i: number, at: number) => {
      if (i === nums.length) {
        result.push(show(path));
        tones[at] = "success";
        r.step(lineOf(code, "result.push([...path]);"), `Every number is decided: **${show(path)}** is a subset. Record a copy.`, view(at, i));
        return;
      }
      path.push(nums[i]);
      const take = tree.add(at, label(path), `+${nums[i]}`);
      r.step(lineOf(code, "path.push(nums[i]);"), `**Take ${nums[i]}**: the path is ${show(path)}. Decide the rest.`, view(take, i));
      decide(i + 1, take);
      if (tones[take] !== "success") tones[take] = "done";
      path.pop();
      const skip = tree.add(at, label(path), "skip");
      r.step(lineNth(code, "decide(i + 1);", 2), `**Skip ${nums[i]}**: take it back off (path ${show(path)}) and decide the rest without it.`, view(skip, i));
      decide(i + 1, skip);
      if (tones[skip] !== "success") tones[skip] = "done";
    };
    decide(0, root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), `All **${result.length}** subsets: ${result.join(" ")}. O(n · 2ⁿ) time; the path and the call stack hold at most ${nums.length} numbers: O(n) space.`, {
      graphs: [tree.view({ tones: { ...tones } })],
      arrays: [{ name: "nums", values: nums }, { name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
