import { callTree, lineNth, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type EdgeTone, type Program } from "../types";

const code = `function noAdjacentOnes(n) {
  const result = [];
  const path = [];
  const build = () => {
    if (path.length === n) {
      result.push(path.join(""));
      return;
    }
    path.push("0");                              // a 0 is always allowed
    build();
    path.pop();
    if (path[path.length - 1] !== "1") {         // prune: a 1 right after a 1 can never work
      path.push("1");
      build();
      path.pop();
    }
  };
  build();
  return result;
}`;

const program: Program = {
  title: "Pruning: binary strings with no two adjacent 1s",
  code,
  fields: [{ key: "n", label: "n (length)", kind: "number", min: 1, max: 4 }],
  examples: [
    { label: "Length 3", input: { n: 3 } },
    { label: "Length 4", input: { n: 4 } },
    { label: "Length 2", input: { n: 2 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const tree = callTree("decision tree");
    const result: string[] = [];
    const path: string[] = [];
    const tones: Record<number, CellTone> = {};
    const edgeTones: Record<number, EdgeTone> = {};
    let pruned = 0;
    const view = (at: number) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) }, edgeTones })],
      stacks: [{ name: "path", values: [...path] }],
      arrays: [{ name: "result", values: [...result] }],
    });

    const root = tree.add(null, "·");
    r.step(lineOf(code, "const path = [];"), `Build strings of length ${n} bit by bit, but **never put a 1 right after a 1** — that branch could never become a valid string, so it isn't explored at all.`, view(root));
    const build = (at: number) => {
      if (path.length === n) {
        result.push(path.join(""));
        tones[at] = "success";
        r.step(lineOf(code, "result.push(path.join(\"\"));"), `**"${path.join("")}"** is complete and valid. Record it.`, view(at));
        return;
      }
      path.push("0");
      const zero = tree.add(at, path.join(""));
      r.step(lineOf(code, "path.push(\"0\");"), `A 0 is always allowed: path "${path.join("")}".`, view(zero));
      build(zero);
      path.pop();
      if (tones[zero] !== "success") tones[zero] = "done";
      if (path[path.length - 1] !== "1") {
        path.push("1");
        const one = tree.add(at, path.join(""));
        r.step(lineOf(code, "path.push(\"1\");"), `The last bit isn't 1, so a 1 is allowed: path "${path.join("")}".`, view(one));
        build(one);
        path.pop();
        if (tones[one] !== "success") tones[one] = "done";
        r.step(lineNth(code, "path.pop();", 2), `Un-choose the 1: back to "${path.join("")}".`, view(at));
      } else {
        pruned++;
        const cut = tree.add(at, `${path.join("")}1`);
        tones[cut] = "muted";
        edgeTones[cut] = "muted";
        r.step(lineOf(code, "if (path[path.length - 1] !== \"1\") {"), `**Prune**: "${path.join("")}" ends in 1, so "${path.join("")}1" would break the rule. That whole branch is skipped${n - path.length - 1 > 0 ? ` — along with the ${2 ** (n - path.length - 1)} strings below it` : ""}.`, view(at));
      }
    };
    build(root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), `Done: **${result.length}** valid strings (${result.join(", ")}). ${pruned} branch${pruned === 1 ? " was" : "es were"} cut instead of the ${2 ** n - result.length} invalid strings being built and thrown away.`, {
      graphs: [tree.view({ tones: { ...tones }, edgeTones })],
      stacks: [{ name: "path", values: [] }],
      arrays: [{ name: "result", values: [...result] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
