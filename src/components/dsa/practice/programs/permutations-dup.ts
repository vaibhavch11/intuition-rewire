import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type EdgeTone, type Program } from "../types";

const code = `function permuteUnique(nums) {
  const a = [...nums].sort((x, y) => x - y);   // equal values next to each other
  const result = [];
  const path = [];
  const used = new Array(a.length).fill(false);
  const build = () => {
    if (path.length === a.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < a.length; i++) {
      if (used[i]) continue;
      if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) continue;   // equal values go in order
      used[i] = true;
      path.push(a[i]);
      build();
      path.pop();
      used[i] = false;
    }
  };
  build();
  return result;
}`;

const show = (p: number[]) => `[${p.join(",")}]`;

const program: Program = {
  title: "Permutations II: equal values go in order",
  code,
  fields: [{ key: "nums", label: "nums (digits, repeats allowed)", kind: "array", maxLength: 4, min: 0, max: 9 }],
  examples: [
    { label: "Example", input: { nums: [1, 1, 2] } },
    { label: "Two pairs", input: { nums: [2, 1, 2, 1] } },
    { label: "All equal", input: { nums: [3, 3, 3] } },
  ],
  check: (input) => ((input.nums as number[]).length ? null : "Add at least one number."),
  run(input) {
    const a = [...(input.nums as number[])].sort((x, y) => x - y);
    const n = a.length;
    const r = recorder();
    const tree = callTree("decision tree: each node is the permutation so far");
    const tones: Record<number, CellTone> = {};
    const edgeTones: Record<number, EdgeTone> = {};
    const result: string[] = [];
    const path: number[] = [];
    const used = new Array(n).fill(false);
    let skipped = 0;
    const view = (at: number, i: number | null) => {
      const t: Record<number, CellTone> = {};
      used.forEach((u, j) => {
        if (u) t[j] = "done";
      });
      if (i !== null) t[i] = "primary";
      return {
        graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) }, edgeTones })],
        arrays: [{ name: "sorted (green = used)", values: a, tones: t }, { name: "result", values: [...result] }],
        stacks: [{ name: "path", values: [...path] }],
      };
    };

    const build = (at: number) => {
      if (path.length === n) {
        result.push(show(path));
        tones[at] = "success";
        r.step(lineOf(code, "result.push([...path]);"), `**${show(path)}** is complete. Record it.`, view(at, null));
        return;
      }
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) {
          skipped++;
          const cut = tree.add(at, [...path, a[i]].join(""), `+${a[i]}`);
          tones[cut] = "muted";
          edgeTones[cut] = "muted";
          r.step(lineOf(code, "if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) continue;"), `a[${i}] = ${a[i]} equals a[${i - 1}], which isn't placed yet. Placing this copy first would only repeat what the earlier copy builds. **Skip**.`, view(at, i));
          continue;
        }
        used[i] = true;
        path.push(a[i]);
        const child = tree.add(at, path.join(""), `+${a[i]}`);
        r.step(lineOf(code, "path.push(a[i]);"), `Place a[${i}] = **${a[i]}**: path ${show(path)}.`, view(child, i));
        build(child);
        if (tones[child] !== "success") tones[child] = "done";
        path.pop();
        used[i] = false;
      }
    };
    const root = tree.add(null, "{}");
    r.step(lineOf(code, "const a = [...nums].sort"), `Sorted: [${a.join(", ")}]. Among equal values, always place the leftmost unused copy first — then each distinct order is built once.`, view(root, null));
    build(root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), `**${result.length}** unique permutations: ${result.join(" ")}. ${skipped} repeat branch${skipped === 1 ? " was" : "es were"} never explored.`, {
      graphs: [tree.view({ tones: { ...tones }, edgeTones })],
      arrays: [{ name: "sorted (green = used)", values: a }, { name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
