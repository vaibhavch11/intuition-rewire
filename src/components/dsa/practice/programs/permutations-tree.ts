import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function permute(nums) {
  const result = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  const build = () => {
    if (path.length === nums.length) {      // every number placed: one permutation
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;                 // already in the path
      used[i] = true;                        // choose
      path.push(nums[i]);
      build();                               // explore
      path.pop();                            // un-choose
      used[i] = false;
    }
  };
  build();
  return result;
}`;

const show = (p: number[]) => `[${p.join(",")}]`;

const program: Program = {
  title: "Permutations: any number not used yet",
  code,
  fields: [{ key: "nums", label: "nums (distinct digits)", kind: "array", maxLength: 4, min: 0, max: 9 }],
  examples: [
    { label: "Example", input: { nums: [1, 2, 3] } },
    { label: "Two numbers", input: { nums: [0, 1] } },
    { label: "Four numbers", input: { nums: [1, 2, 3, 4] } },
  ],
  check: (input) => (new Set(input.nums as number[]).size === (input.nums as number[]).length && (input.nums as number[]).length > 0 ? null : "Use distinct numbers (Permutations II handles repeats)."),
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    const tree = callTree("decision tree: each node is the permutation so far");
    const tones: Record<number, CellTone> = {};
    const result: string[] = [];
    const path: number[] = [];
    const used = new Array(n).fill(false);
    const view = (at: number, i: number | null) => {
      const t: Record<number, CellTone> = {};
      used.forEach((u, j) => {
        if (u) t[j] = "done";
      });
      if (i !== null) t[i] = "primary";
      return {
        graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) } })],
        arrays: [{ name: "nums (green = used)", values: nums, tones: t }, { name: "result", values: [...result] }],
        stacks: [{ name: "path", values: [...path] }],
      };
    };

    const build = (at: number) => {
      if (path.length === n) {
        result.push(show(path));
        tones[at] = "success";
        r.step(lineOf(code, "result.push([...path]);"), `Every number is placed: **${show(path)}**. Record it.`, view(at, null));
        return;
      }
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.push(nums[i]);
        const child = tree.add(at, path.join(""), `+${nums[i]}`);
        r.step(lineOf(code, "used[i] = true;"), `Position ${path.length}: **${nums[i]}** isn't used yet — place it. Path ${show(path)}.`, view(child, i));
        build(child);
        if (tones[child] !== "success") tones[child] = "done";
        path.pop();
        used[i] = false;
        r.step(lineOf(code, "used[i] = false;"), `Take ${nums[i]} back out and mark it free again, so the next branch can use it.`, view(at, i));
      }
    };
    const root = tree.add(null, "{}");
    r.step(lineOf(code, "const used = "), `Order matters: each position may take **any** number not used yet. ${n} choices, then ${n - 1}, …: ${[...Array(n)].map((_, k) => n - k).join(" × ")} leaves.`, view(root, null));
    build(root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), `All **${result.length}** permutations: ${result.join(" ")}. O(n · n!) time, O(n) space besides the output.`, {
      graphs: [tree.view({ tones: { ...tones } })],
      arrays: [{ name: "nums (green = used)", values: nums }, { name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
