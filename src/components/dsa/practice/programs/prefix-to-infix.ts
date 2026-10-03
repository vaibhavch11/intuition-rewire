import { checkExpression, runConversion } from "../expressions";
import type { Program } from "../types";

const code = `function prefixToInfix(s) {
  const stack = [];
  for (let i = s.length - 1; i >= 0; i--) {     // read right to left
    const c = s[i];
    if ("+-*/^".includes(c)) {
      const left = stack.pop();
      const right = stack.pop();
      stack.push("(" + left + c + right + ")");
    } else {
      stack.push(c);                              // an operand
    }
  }
  return stack.pop();
}`;

const program: Program = {
  title: "Prefix to infix",
  code,
  fields: [{ key: "s", label: "prefix", kind: "text", maxLength: 15, hint: "*+AB-CD" }],
  examples: [
    { label: "*+AB-CD", input: { s: "*+AB-CD" } },
    { label: "*-A/BC-/AKL", input: { s: "*-A/BC-/AKL" } },
    { label: "-+A*BC/DE", input: { s: "-+A*BC/DE" } },
  ],
  check: (input) => checkExpression(input.s as string, "prefix"),
  run: (input) =>
    runConversion(input.s as string, {
      from: "prefix",
      join: (op, left, right) => `(${left}${op}${right})`,
      lines: { start: 2, operand: 10, operator: 8, done: 13 },
      target: "infix",
      rule: "as ( left op right )",
    }),
};

export default program;
