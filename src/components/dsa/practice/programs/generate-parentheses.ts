import { lineOf } from "../graphs";
import { recorder, type Program } from "../types";

const code = `function generateParenthesis(n) {
  const result = [];
  const path = [];
  const build = (open, close) => {            // how many '(' and ')' are used so far
    if (path.length === 2 * n) {
      result.push(path.join(""));
      return;
    }
    if (open < n) {                           // a '(' is allowed while some are left
      path.push("(");
      build(open + 1, close);
      path.pop();
    }
    if (close < open) {                       // a ')' only if it closes something
      path.push(")");
      build(open, close + 1);
      path.pop();
    }
  };
  build(0, 0);
  return result;
}`;

const program: Program = {
  title: "Generate parentheses (backtracking with counts)",
  code,
  fields: [{ key: "n", label: "n (pairs)", kind: "number", min: 1, max: 4 }],
  examples: [
    { label: "Example", input: { n: 3 } },
    { label: "Two pairs", input: { n: 2 } },
    { label: "One pair", input: { n: 1 } },
  ],
  run(input) {
    const n = input.n as number;
    const result: string[] = [];
    const path: string[] = [];
    const r = recorder();

    const frame = (open: number, close: number) => ({
      arrays: [
        { name: "path", values: [...path], tones: Object.fromEntries(path.map((c, i) => [i, c === "(" ? ("primary" as const) : ("tertiary" as const)])) },
        { name: "result", values: [...result] },
      ],
      vars: { open, close, "( left": n - open },
    });

    r.step(lineOf(code, "build(0, 0)"), `Build the string one bracket at a time, using two rules that keep it valid **as it grows**: add '(' while fewer than ${n} are used, and add ')' only while it has an open '(' to close. Then every string that reaches length ${2 * n} is valid — no checking needed.`, frame(0, 0));
    const build = (open: number, close: number) => {
      if (path.length === 2 * n) {
        result.push(path.join(""));
        r.step(lineOf(code, "result.push(path.join"), `Length ${2 * n}: **"${path.join("")}"** is a valid combination. Record it and go back.`, frame(open, close));
        return;
      }
      if (open < n) {
        path.push("(");
        r.step(lineOf(code, `path.push("(")`), `${n - open} '(' left to use: add one.`, frame(open + 1, close));
        build(open + 1, close);
        path.pop();
      }
      if (close < open) {
        path.push(")");
        r.step(lineOf(code, `path.push(")")`), `${open - close} '(' still open: close one with ')'.`, frame(open, close + 1));
        build(open, close + 1);
        path.pop();
      }
    };
    build(0, 0);
    r.step(lineOf(code, "return result"), `All **${result.length}** valid combinations of ${n} pair${n === 1 ? "" : "s"}. The rules never build an invalid prefix, so the work is proportional to the answers — the Catalan number, about 4ⁿ / n^1.5.`, { ...frame(0, 0), done: true });
    return r.frames;
  },
};

export default program;
