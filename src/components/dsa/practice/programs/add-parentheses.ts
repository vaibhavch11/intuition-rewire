import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function diffWaysToCompute(expression) {
  const results = [];
  for (let i = 0; i < expression.length; i++) {
    const op = expression[i];
    if (op !== "+" && op !== "-" && op !== "*") continue;
    const left = diffWaysToCompute(expression.slice(0, i));    // every result of the left side
    const right = diffWaysToCompute(expression.slice(i + 1));  // every result of the right side
    for (const a of left) {
      for (const b of right) results.push(op === "+" ? a + b : op === "-" ? a - b : a * b);
    }
  }
  if (results.length === 0) results.push(Number(expression));  // no operator: just a number
  return results;
}`;

const program: Program = {
  title: "Different ways to add parentheses (divide and conquer)",
  code,
  fields: [{ key: "expression", label: "expression", kind: "text", maxLength: 11, hint: "numbers joined by + - *, like 2*3-4*5" }],
  examples: [
    { label: "Example", input: { expression: "2-1-1" } },
    { label: "Three operators", input: { expression: "2*3-4*5" } },
    { label: "One number", input: { expression: "11" } },
  ],
  check(input) {
    const e = input.expression as string;
    if (!/^\d+([+\-*]\d+)*$/.test(e)) return "Use numbers joined by +, - or *, like 2*3-4*5.";
    return (e.match(/[+\-*]/g) ?? []).length <= 4 ? null : "Use at most 4 operators — the number of ways grows fast.";
  },
  run(input) {
    const expr = input.expression as string;
    const r = recorder();
    const calls: string[] = [];
    const stack = (tone: CellTone = "primary") => ({ name: "call stack", values: [...calls], tones: { [calls.length - 1]: tone } });

    const solve = (e: string): number[] => {
      calls.push(e);
      const results: number[] = [];
      for (let i = 0; i < e.length; i++) {
        const op = e[i];
        if (op !== "+" && op !== "-" && op !== "*") continue;
        r.step(lineOf(code, "const left = diffWaysToCompute(expression.slice(0, i));"), `In **${e}**: make the '${op}' at position ${i} the **last** operation. Solve the left side, **${e.slice(0, i)}**, and the right side, **${e.slice(i + 1)}**, on their own.`, {
          stacks: [stack()],
          arrays: [{ name: `results of ${e} so far`, values: [...results] }],
        });
        const left = solve(e.slice(0, i));
        const right = solve(e.slice(i + 1));
        const made: number[] = [];
        for (const a of left) for (const b of right) made.push(op === "+" ? a + b : op === "-" ? a - b : a * b);
        results.push(...made);
        r.step(lineOf(code, "for (const b of right) results.push("), `Back in **${e}**: combine every left result with every right result using '${op}': ${made.length} new result${made.length === 1 ? "" : "s"}.`, {
          stacks: [stack()],
          arrays: [
            { name: `left: ${e.slice(0, i)}`, values: left },
            { name: `right: ${e.slice(i + 1)}`, values: right },
            { name: `results of ${e} so far`, values: [...results], tones: Object.fromEntries(made.map((_, j) => [results.length - made.length + j, "write"])) as Record<number, CellTone> },
          ],
        });
      }
      if (results.length === 0) {
        results.push(Number(e));
        r.step(lineOf(code, "if (results.length === 0) results.push(Number(expression));"), `**${e}** has no operator: it's just the number ${e}. Base case.`, {
          stacks: [stack("success")],
          arrays: [{ name: `results of ${e}`, values: [...results], tones: { 0: "success" } }],
        });
      }
      calls.pop();
      return results;
    };

    const answer = solve(expr);
    r.step(lineOf(code, "return results;"), `Every way to parenthesise ${expr}: **[${answer.join(", ")}]**. The count follows the Catalan numbers (1, 2, 5, 14, …) — memoizing each sub-expression avoids solving pieces like the same side twice.`, {
      stacks: [{ name: "call stack", values: [] }],
      arrays: [{ name: `results of ${expr}`, values: answer, tones: Object.fromEntries(answer.map((_, j) => [j, "success"])) as Record<number, CellTone> }],
      done: true,
    });
    return r.frames;
  },
};

export default program;
