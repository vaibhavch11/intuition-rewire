import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type EdgeTone, type Program } from "../types";

const code = `function combinationSum(candidates, target) {
  const sorted = [...candidates].sort((a, b) => a - b);
  const result = [];
  const path = [];
  const build = (start, left) => {
    if (left === 0) {                          // exactly the target: one answer
      result.push([...path]);
      return;
    }
    for (let i = start; i < sorted.length; i++) {
      if (sorted[i] > left) break;             // too big, and so is everything after it
      path.push(sorted[i]);
      build(i, left - sorted[i]);              // i, not i + 1: it may be used again
      path.pop();
    }
  };
  build(0, target);
  return result;
}`;

const show = (p: number[]) => `[${p.join(",")}]`;

const program: Program = {
  title: "Combination sum: reuse allowed, sorted with break",
  code,
  fields: [
    { key: "candidates", label: "candidates (distinct)", kind: "array", maxLength: 4, min: 1, max: 9 },
    { key: "target", label: "target", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "Example", input: { candidates: [2, 3, 6, 7], target: 7 } },
    { label: "Target 8", input: { candidates: [2, 3, 5], target: 8 } },
    { label: "No answer", input: { candidates: [4, 6], target: 5 } },
  ],
  check: (input) => (new Set(input.candidates as number[]).size === (input.candidates as number[]).length && (input.candidates as number[]).length > 0 ? null : "Use distinct candidates."),
  run(input) {
    const sorted = [...(input.candidates as number[])].sort((a, b) => a - b);
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
        { name: "sorted", values: sorted, tones: i !== null && i < sorted.length ? { [i]: "primary" as CellTone } : {} },
        { name: "result", values: [...result] },
      ],
      stacks: [{ name: "path", values: [...path] }],
    });

    const build = (start: number, left: number, at: number) => {
      if (left === 0) {
        result.push(show(path));
        tones[at] = "success";
        r.step(lineOf(code, "result.push([...path]);"), `Nothing left to make: **${show(path)}** adds up to ${target}. Record it.`, view(at, null));
        return;
      }
      for (let i = start; i < sorted.length; i++) {
        if (sorted[i] > left) {
          const cut = tree.add(at, left - sorted[i], `+${sorted[i]}`);
          tones[cut] = "muted";
          edgeTones[cut] = "muted";
          r.step(lineOf(code, "if (sorted[i] > left) break;"), `${sorted[i]} is more than the ${left} still needed — and every candidate after it is bigger still. **Break**: none of them is tried.`, view(at, i));
          break;
        }
        path.push(sorted[i]);
        const child = tree.add(at, left - sorted[i], `+${sorted[i]}`);
        r.step(lineOf(code, "path.push(sorted[i]);"), `Take **${sorted[i]}**: path ${show(path)}, ${left - sorted[i]} still needed. It may be taken again, so the next level starts at ${sorted[i]} too.`, view(child, i));
        build(i, left - sorted[i], child);
        if (tones[child] !== "success") tones[child] = "done";
        path.pop();
      }
    };
    const root = tree.add(null, target);
    r.step(lineOf(code, "const sorted = "), `Sorted candidates: [${sorted.join(", ")}]. Each node shows how much is still needed, starting from ${target}; reaching **0** means the path is an answer.`, view(root, null));
    build(0, target, root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), result.length ? `Done: **${result.length}** combination${result.length === 1 ? "" : "s"}, ${result.join(" ")}.` : `Done: **0** combinations — ${target} can't be made from these candidates.`, {
      graphs: [tree.view({ tones: { ...tones }, edgeTones })],
      arrays: [{ name: "sorted", values: sorted }, { name: "result", values: [...result] }],
      stacks: [{ name: "path", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
