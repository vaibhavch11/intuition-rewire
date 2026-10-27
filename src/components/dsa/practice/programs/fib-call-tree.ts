import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function fib(n) {
  if (n <= 1) return n;                  // base cases: fib(0) = 0, fib(1) = 1
  return fib(n - 1) + fib(n - 2);        // two calls: the call tree branches
}`;

const program: Program = {
  title: "fib(n): the call tree",
  code,
  fields: [{ key: "n", label: "n", kind: "number", min: 0, max: 6 }],
  examples: [
    { label: "fib(4)", input: { n: 4 } },
    { label: "fib(5)", input: { n: 5 } },
    { label: "fib(2)", input: { n: 2 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const tree = callTree("call tree: each node k is a call to fib(k)");
    const done: Record<number, CellTone> = {};
    const captions: Record<number, string> = {};
    const seen = new Map<number, number>();
    let calls = 0;
    const view = (id: number) => ({
      graphs: [tree.view({ tones: { ...done, ...stackTones(tree.pathTo(id)) }, captions: { ...captions } })],
    });

    const fib = (k: number, parent: number | null): number => {
      const id = tree.add(parent, k);
      calls++;
      seen.set(k, (seen.get(k) ?? 0) + 1);
      const again = (seen.get(k) ?? 0) > 1 && k > 1;
      if (k <= 1) {
        done[id] = "success";
        captions[id] = `=${k}`;
        r.step(lineOf(code, "if (n <= 1) return n;"), `**fib(${k})** is a base case: it returns ${k} straight away.`, { ...view(id), vars: { n: k, calls, depth: tree.pathTo(id).length } });
        return k;
      }
      r.step(lineOf(code, "return fib(n - 1) + fib(n - 2);"), `**fib(${k})** isn't a base case, so it calls fib(${k - 1}) first and waits.${again ? ` fib(${k}) has been solved before — this is repeated work.` : ""}`, {
        ...view(id),
        vars: { n: k, calls, depth: tree.pathTo(id).length },
      });
      const a = fib(k - 1, id);
      r.step(lineOf(code, "return fib(n - 1) + fib(n - 2);"), `Back in fib(${k}): fib(${k - 1}) = ${a}. Now it calls fib(${k - 2}).`, { ...view(id), vars: { n: k, calls, depth: tree.pathTo(id).length } });
      const b = fib(k - 2, id);
      const v = a + b;
      done[id] = again ? "tertiary" : "done";
      captions[id] = `=${v}`;
      r.step(lineOf(code, "return fib(n - 1) + fib(n - 2);"), `fib(${k}) = ${a} + ${b} = **${v}**. Its frame pops and the value goes up to its caller.`, { ...view(id), vars: { n: k, calls, depth: tree.pathTo(id).length } });
      return v;
    };

    const answer = fib(n, null);
    const repeated = [...seen.entries()].filter(([k, c]) => c > 1 && k > 1).map(([k, c]) => `fib(${k}) ×${c}`);
    r.step(lineOf(code, "return fib(n - 1) + fib(n - 2);"), `fib(${n}) = **${answer}**, after **${calls}** calls${repeated.length ? `, including repeats: ${repeated.join(", ")}` : ""}. The calls grow exponentially (about 1.6ⁿ), but at most ${n || 1} frame${n > 1 ? "s are" : " is"} on the stack at once: space O(n). Caching each fib(k) the first time — dynamic programming — cuts it to O(n) calls.`, {
      graphs: [tree.view({ tones: { ...done }, captions: { ...captions } })],
      vars: { answer, calls },
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
