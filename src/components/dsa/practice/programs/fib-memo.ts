import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function fib(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);   // computed before: reuse it
  const value = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, value);
  return value;
}`;

const program: Program = {
  title: "fib(n) with memoization",
  code,
  fields: [{ key: "n", label: "n", kind: "number", min: 0, max: 10 }],
  examples: [
    { label: "fib(5)", input: { n: 5 } },
    { label: "fib(8)", input: { n: 8 } },
    { label: "fib(1)", input: { n: 1 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const tree = callTree("call tree: each node k is a call to fib(k)");
    const memo = new Map<number, number>();
    const tones: Record<number, CellTone> = {};
    const captions: Record<number, string> = {};
    let calls = 0;
    const view = (id: number) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(id)) }, captions: { ...captions } })],
      maps: [{ name: "memo", entries: [...memo.entries()].sort((a, b) => a[0] - b[0]) as [number, number][], keyLabel: "n", valueLabel: "fib(n)" }],
    });

    const fib = (k: number, parent: number | null): number => {
      const id = tree.add(parent, k);
      calls++;
      if (k <= 1) {
        tones[id] = "success";
        captions[id] = `${k}`;
        r.step(lineOf(code, "if (n <= 1) return n;"), `fib(${k}) is a base case: **${k}**.`, { ...view(id), vars: { n: k, calls } });
        return k;
      }
      if (memo.has(k)) {
        tones[id] = "tertiary";
        captions[id] = `${memo.get(k)}`;
        r.step(lineOf(code, "if (memo.has(n)) return memo.get(n);"), `fib(${k}) is **already in the memo** (${memo.get(k)}): return it at once — no calls below this one.`, { ...view(id), vars: { n: k, calls } });
        return memo.get(k) as number;
      }
      r.step(lineOf(code, "const value = fib(n - 1, memo) + fib(n - 2, memo);"), `fib(${k}) isn't in the memo yet: compute it from fib(${k - 1}) and fib(${k - 2}).`, { ...view(id), vars: { n: k, calls } });
      const value = fib(k - 1, id) + fib(k - 2, id);
      memo.set(k, value);
      tones[id] = "done";
      captions[id] = `${value}`;
      r.step(lineOf(code, "memo.set(n, value);"), `fib(${k}) = **${value}**. Store it, so any later call to fib(${k}) is a single lookup.`, { ...view(id), vars: { n: k, calls } });
      return value;
    };

    const answer = fib(n, null);
    r.step(lineOf(code, "return value;"), `fib(${n}) = **${answer}** after ${calls} call${calls === 1 ? "" : "s"} — about 2n instead of ~1.6ⁿ. Each fib(k) was computed once; every repeat was an orange lookup. O(n) time, O(n) memo and stack.`, {
      graphs: [tree.view({ tones: { ...tones }, captions: { ...captions } })],
      maps: [{ name: "memo", entries: [...memo.entries()].sort((a, b) => a[0] - b[0]) as [number, number][], keyLabel: "n", valueLabel: "fib(n)" }],
      vars: { answer, calls },
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
