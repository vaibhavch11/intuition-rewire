import { lineOf } from "../graphs";
import { recorder, type ArrayView, type CellTone, type Program } from "../types";

const code = `function kthGrammar(n, k) {
  if (n === 1) return 0;                           // row 1 is just "0"
  const parent = kthGrammar(n - 1, Math.ceil(k / 2));
  return k % 2 === 1 ? parent : 1 - parent;        // left child copies, right child flips
}`;

/** Row n of the table, built only for small n (it doubles every row). */
function row(n: number) {
  let s = "0";
  for (let i = 1; i < n; i++) s = [...s].map((c) => (c === "0" ? "01" : "10")).join("");
  return s;
}

const program: Program = {
  title: "K-th symbol in grammar: recurse to the parent",
  code,
  fields: [
    { key: "n", label: "n (row)", kind: "number", min: 1, max: 30 },
    { key: "k", label: "k (position, from 1)", kind: "number", min: 1, max: 536870912 },
  ],
  examples: [
    { label: "Row 4, k = 6", input: { n: 4, k: 6 } },
    { label: "Row 5, k = 11", input: { n: 5, k: 11 } },
    { label: "Row 30", input: { n: 30, k: 434991989 } },
  ],
  check: (input) => ((input.k as number) <= 2 ** ((input.n as number) - 1) ? null : `Row ${input.n} has only ${2 ** ((input.n as number) - 1)} symbols.`),
  run(input) {
    const n0 = input.n as number;
    const k0 = input.k as number;
    const r = recorder();
    const frames: string[] = [];
    const rowView = (n: number, k: number, tone: CellTone): ArrayView[] =>
      n <= 5 ? [{ name: `row ${n}`, values: [...row(n)], tones: { [k - 1]: tone } }] : [];
    const stack = (tone: CellTone = "primary") => ({ name: "call stack", values: [...frames], tones: { [frames.length - 1]: tone } });

    const solve = (n: number, k: number): number => {
      frames.push(`kthGrammar(${n}, ${k})`);
      if (n === 1) {
        r.step(lineOf(code, "if (n === 1) return 0;"), `**kthGrammar(1, 1)**: row 1 is just "0" — the base case returns 0.`, { arrays: rowView(1, 1, "success"), stacks: [stack("success")], vars: { n, k } });
        frames.pop();
        return 0;
      }
      const p = Math.ceil(k / 2);
      r.step(lineOf(code, "const parent = kthGrammar(n - 1, Math.ceil(k / 2));"), `**kthGrammar(${n}, ${k})**: position ${k} of row ${n} was made by position ⌈${k} / 2⌉ = ${p} of row ${n - 1} — its parent. Ask about the parent first.`, {
        arrays: rowView(n, k, "primary"),
        stacks: [stack()],
        vars: { n, k, "parent k": p },
      });
      const parent = solve(n - 1, p);
      const v = k % 2 === 1 ? parent : 1 - parent;
      r.step(lineOf(code, "return k % 2 === 1 ? parent : 1 - parent;"), `The parent is ${parent}. Position ${k} is the ${k % 2 === 1 ? "left (odd) child, which **copies** it" : "right (even) child, which **flips** it"}: **${v}**.`, {
        arrays: rowView(n, k, "success"),
        stacks: [stack("success")],
        vars: { n, k, parent, answer: v },
      });
      frames.pop();
      return v;
    };

    const answer = solve(n0, k0);
    r.step(lineOf(code, "return k % 2 === 1 ? parent : 1 - parent;"), `Symbol ${k0} of row ${n0} is **${answer}** — found with ${n0} calls instead of building a row of ${2 ** (n0 - 1)} symbols. O(n) time and stack.`, {
      arrays: rowView(n0, k0, "success"),
      stacks: [{ name: "call stack", values: [] }],
      vars: { n: n0, k: k0, answer },
      done: true,
    });
    return r.frames;
  },
};

export default program;
