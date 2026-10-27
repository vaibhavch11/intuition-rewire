import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function binaryStrings(n) {
  const result = [];
  const path = [];                         // the choices made so far
  const build = () => {
    if (path.length === n) {               // a full string: record it
      result.push(path.join(""));
      return;
    }
    for (const bit of ["0", "1"]) {
      path.push(bit);                      // choose
      build();                             // explore
      path.pop();                          // un-choose
    }
  };
  build();
  return result;
}`;

const program: Program = {
  title: "Binary strings: choose, explore, un-choose",
  code,
  fields: [{ key: "n", label: "n (length)", kind: "number", min: 1, max: 3 }],
  examples: [
    { label: "Length 2", input: { n: 2 } },
    { label: "Length 3", input: { n: 3 } },
    { label: "Length 1", input: { n: 1 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const tree = callTree("decision tree");
    const result: string[] = [];
    const path: string[] = [];
    const tones: Record<number, CellTone> = {};
    const view = (at: number) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) } })],
      stacks: [{ name: "path", values: [...path] }],
      arrays: [{ name: "result", values: [...result] }],
    });

    const root = tree.add(null, "·");
    r.step(lineOf(code, "const path = [];"), `Build each string one bit at a time. The **decision tree** starts empty; every path from the top to a leaf will be one string of length ${n}.`, view(root));
    const build = (at: number) => {
      if (path.length === n) {
        result.push(path.join(""));
        tones[at] = "success";
        r.step(lineOf(code, "result.push(path.join(\"\"));"), `The path has ${n} bit${n > 1 ? "s" : ""}: **"${path.join("")}"** is complete. Record a copy and return to the parent.`, view(at));
        return;
      }
      for (const bit of ["0", "1"]) {
        path.push(bit);
        const child = tree.add(at, path.join(""));
        r.step(lineOf(code, "path.push(bit);"), `**Choose ${bit}**: the path is now "${path.join("")}". Go one level deeper.`, view(child));
        build(child);
        path.pop();
        if (tones[child] !== "success") tones[child] = "done";
        r.step(lineOf(code, "path.pop();"), `**Un-choose ${bit}**: back to "${path.join("")}"${bit === "0" ? " — next, try 1 here" : " — both choices are done at this level"}.`, view(at));
      }
    };
    build(root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), `The whole tree has been walked depth-first: **${result.length}** strings, ${result.join(", ")}. Time O(2ⁿ · n); the path and the call stack never hold more than ${n} choices: space O(n).`, {
      graphs: [tree.view({ tones: { ...tones } })],
      stacks: [{ name: "path", values: [] }],
      arrays: [{ name: "result", values: [...result] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
