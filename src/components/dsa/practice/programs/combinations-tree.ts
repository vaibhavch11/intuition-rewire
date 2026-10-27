import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type EdgeTone, type Program } from "../types";

const code = `function combine(n, k) {
  const result = [];
  const path = [];
  const build = (start) => {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    const last = n - (k - path.length) + 1;    // beyond this, too few numbers are left
    for (let x = start; x <= last; x++) {
      path.push(x);
      build(x + 1);
      path.pop();
    }
  };
  build(1);
  return result;
}`;

const show = (p: number[]) => `[${p.join(",")}]`;

const program: Program = {
  title: "Combinations: start index and pruning",
  code,
  fields: [
    { key: "n", label: "n", kind: "number", min: 1, max: 5 },
    { key: "k", label: "k", kind: "number", min: 1, max: 5 },
  ],
  examples: [
    { label: "n = 4, k = 2", input: { n: 4, k: 2 } },
    { label: "n = 5, k = 3", input: { n: 5, k: 3 } },
    { label: "n = 3, k = 3", input: { n: 3, k: 3 } },
  ],
  check: (input) => ((input.k as number) <= (input.n as number) ? null : "k can't be bigger than n."),
  run(input) {
    const n = input.n as number;
    const k = input.k as number;
    const r = recorder();
    const tree = callTree("decision tree: each node is the combination so far");
    const tones: Record<number, CellTone> = {};
    const edgeTones: Record<number, EdgeTone> = {};
    const result: string[] = [];
    const path: number[] = [];
    let pruned = 0;
    const view = (at: number) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) }, edgeTones })],
      arrays: [{ name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [...path] }],
    });

    const build = (start: number, at: number) => {
      if (path.length === k) {
        result.push(show(path));
        tones[at] = "success";
        r.step(lineOf(code, "result.push([...path]);"), `${k} number${k === 1 ? "" : "s"} chosen: **${show(path)}**. Record it.`, view(at));
        return;
      }
      const last = n - (k - path.length) + 1;
      const cut: number[] = [];
      for (let x = Math.max(start, last + 1); x <= n; x++) cut.push(x);
      r.step(lineOf(code, "const last = n - (k - path.length) + 1;"), `Path ${show(path)} needs ${k - path.length} more, so the next number can be at most ${n} − ${k - path.length} + 1 = ${last}. Try ${start}..${last}.`, view(at));
      for (let x = start; x <= last; x++) {
        path.push(x);
        const child = tree.add(at, path.join(""), `+${x}`);
        r.step(lineOf(code, "path.push(x);"), `Choose **${x}**: path ${show(path)}. Next numbers must be bigger than ${x}.`, view(child));
        build(x + 1, child);
        if (tones[child] !== "success") tones[child] = "done";
        path.pop();
      }
      if (cut.length) {
        for (const x of cut) {
          const id = tree.add(at, [...path, x].join(""), `+${x}`);
          tones[id] = "muted";
          edgeTones[id] = "muted";
          pruned++;
        }
        r.step(lineOf(code, "for (let x = start; x <= last; x++) {"), `The loop stops at ${last}: ${cut.join(", ")} ${cut.length === 1 ? "is" : "are"} **pruned** — after ${cut.length === 1 ? "it" : "them"}, too few numbers are left to finish a combination.`, view(at));
      }
    };
    const root = tree.add(null, "{}");
    r.step(lineOf(code, "build(1);"), `Choose ${k} of the numbers 1..${n}, always in increasing order, so each combination is built exactly once.`, view(root));
    build(1, root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), `All **${result.length}** combinations: ${result.join(" ")}. ${pruned} branch${pruned === 1 ? " was" : "es were"} pruned before being explored. O(C(n, k) · k) time, O(k) space.`, {
      graphs: [tree.view({ tones: { ...tones }, edgeTones })],
      arrays: [{ name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
