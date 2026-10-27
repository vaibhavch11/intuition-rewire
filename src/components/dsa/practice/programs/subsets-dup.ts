import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type EdgeTone, type Program } from "../types";

const code = `function subsetsWithDup(nums) {
  const a = [...nums].sort((x, y) => x - y);   // equal values next to each other
  const result = [];
  const path = [];
  const build = (start) => {
    result.push([...path]);                    // every node is a subset
    for (let i = start; i < a.length; i++) {
      if (i > start && a[i] === a[i - 1]) continue;   // same value at the same level: a repeat
      path.push(a[i]);
      build(i + 1);
      path.pop();
    }
  };
  build(0);
  return result;
}`;

const show = (p: number[]) => `[${p.join(",")}]`;
const label = (p: number[]) => (p.length ? p.join("") : "{}");

const program: Program = {
  title: "Subsets II: skip repeats at the same level",
  code,
  fields: [{ key: "nums", label: "nums (digits, repeats allowed)", kind: "array", maxLength: 5, min: 0, max: 9 }],
  examples: [
    { label: "Example", input: { nums: [1, 2, 2] } },
    { label: "All equal", input: { nums: [2, 2, 2] } },
    { label: "Unsorted", input: { nums: [4, 4, 1, 4] } },
  ],
  run(input) {
    const a = [...(input.nums as number[])].sort((x, y) => x - y);
    const r = recorder();
    const tree = callTree("tree: every node is a subset");
    const tones: Record<number, CellTone> = {};
    const edgeTones: Record<number, EdgeTone> = {};
    const result: string[] = [];
    const path: number[] = [];
    let skipped = 0;
    const view = (at: number, i: number | null) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) }, edgeTones })],
      arrays: [
        { name: "sorted", values: a, tones: i !== null && i < a.length ? { [i]: "primary" as CellTone } : {} },
        { name: "result", values: [...result] },
      ],
      stacks: [{ name: "path", values: [...path] }],
    });

    const build = (start: number, at: number) => {
      result.push(show(path));
      tones[at] = "success";
      r.step(lineOf(code, "result.push([...path]);"), `${show(path)} is a subset — every node counts. Now try adding each value from index ${start} on.`, view(at, start));
      for (let i = start; i < a.length; i++) {
        if (i > start && a[i] === a[i - 1]) {
          skipped++;
          const cut = tree.add(at, label([...path, a[i]]), `+${a[i]}`);
          tones[cut] = "muted";
          edgeTones[cut] = "muted";
          r.step(lineOf(code, "if (i > start && a[i] === a[i - 1]) continue;"), `a[${i}] = ${a[i]} equals the value just tried at this level: adding it here would rebuild the same subtree. **Skip**.`, view(at, i));
          continue;
        }
        path.push(a[i]);
        const child = tree.add(at, label(path), `+${a[i]}`);
        r.step(lineOf(code, "path.push(a[i]);"), `Add a[${i}] = ${a[i]}: path ${show(path)}. Its children may only use values after index ${i}.`, view(child, i));
        build(i + 1, child);
        path.pop();
      }
    };
    const root = tree.add(null, "{}");
    r.step(lineOf(code, "const a = [...nums].sort"), `Sorted: [${a.join(", ")}] — equal values now sit together, so a repeat is always the value right before it.`, view(root, null));
    build(0, root);
    r.step(lineOf(code, "return result;"), `**${result.length}** subsets, none repeated: ${result.join(" ")}. ${skipped} repeat branch${skipped === 1 ? " was" : "es were"} never explored.`, {
      graphs: [tree.view({ tones: { ...tones }, edgeTones })],
      arrays: [{ name: "sorted", values: a }, { name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
