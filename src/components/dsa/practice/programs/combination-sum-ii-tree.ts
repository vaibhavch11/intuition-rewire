import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type EdgeTone, type Program } from "../types";

const code = `function combinationSum2(candidates, target) {
  const nums = [...candidates].sort((a, b) => a - b);
  const result = [];
  const path = [];
  const build = (start, left) => {
    if (left === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;   // same value at the same level: a repeat
      if (nums[i] > left) break;                            // too big, and so is everything after it
      path.push(nums[i]);
      build(i + 1, left - nums[i]);                         // i + 1: each number once
      path.pop();
    }
  };
  build(0, target);
  return result;
}`;

const show = (p: number[]) => `[${p.join(",")}]`;

const program: Program = {
  title: "Combination sum II: each number once, no repeated answers",
  code,
  fields: [
    { key: "candidates", label: "candidates (repeats allowed)", kind: "array", maxLength: 7, min: 1, max: 9 },
    { key: "target", label: "target", kind: "number", min: 1, max: 12 },
  ],
  examples: [
    { label: "Example", input: { candidates: [1, 1, 2, 5, 6, 7], target: 8 } },
    { label: "Many twos", input: { candidates: [2, 5, 2, 1, 2], target: 5 } },
    { label: "All equal", input: { candidates: [1, 1, 1, 1], target: 2 } },
  ],
  check: (input) => ((input.candidates as number[]).length ? null : "Add at least one candidate."),
  run(input) {
    const nums = [...(input.candidates as number[])].sort((a, b) => a - b);
    const target = input.target as number;
    const r = recorder();
    const tree = callTree("decision tree: each node is the amount still needed");
    const tones: Record<number, CellTone> = {};
    const edgeTones: Record<number, EdgeTone> = {};
    const result: string[] = [];
    const path: number[] = [];
    const view = (at: number, i: number | null) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) }, edgeTones })],
      arrays: [
        { name: "sorted", values: nums, tones: i !== null && i < nums.length ? { [i]: "primary" as CellTone } : {} },
        { name: "result", values: [...result] },
      ],
      stacks: [{ name: "path", values: [...path] }],
    });
    const cutNode = (at: number, left: number, v: number) => {
      const id = tree.add(at, left - v, `+${v}`);
      tones[id] = "muted";
      edgeTones[id] = "muted";
    };

    const build = (start: number, left: number, at: number) => {
      if (left === 0) {
        result.push(show(path));
        tones[at] = "success";
        r.step(lineOf(code, "result.push([...path]);"), `**${show(path)}** adds up to ${target}. Record it.`, view(at, null));
        return;
      }
      for (let i = start; i < nums.length; i++) {
        if (i > start && nums[i] === nums[i - 1]) {
          cutNode(at, left, nums[i]);
          r.step(lineOf(code, "if (i > start && nums[i] === nums[i - 1]) continue;"), `nums[${i}] = ${nums[i]} equals the value just tried at this level — the same answers again. **Skip** it.`, view(at, i));
          continue;
        }
        if (nums[i] > left) {
          cutNode(at, left, nums[i]);
          r.step(lineOf(code, "if (nums[i] > left) break;"), `${nums[i]} is more than the ${left} still needed, and so is every value after it. **Break**.`, view(at, i));
          break;
        }
        path.push(nums[i]);
        const child = tree.add(at, left - nums[i], `+${nums[i]}`);
        r.step(lineOf(code, "path.push(nums[i]);"), `Take nums[${i}] = **${nums[i]}**: path ${show(path)}, ${left - nums[i]} still needed. Each number is used once, so continue from index ${i + 1}.`, view(child, i));
        build(i + 1, left - nums[i], child);
        if (tones[child] !== "success") tones[child] = "done";
        path.pop();
      }
    };
    const root = tree.add(null, target);
    r.step(lineOf(code, "const nums = "), `Sorted: [${nums.join(", ")}] — equal values sit together, and bigger values come last. Each node shows how much is still needed.`, view(root, null));
    build(0, target, root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), result.length ? `Done: **${result.length}** combination${result.length === 1 ? "" : "s"}, ${result.join(" ")} — none repeated.` : `Done: **0** combinations add up to ${target}.`, {
      graphs: [tree.view({ tones: { ...tones }, edgeTones })],
      arrays: [{ name: "sorted", values: nums }, { name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
