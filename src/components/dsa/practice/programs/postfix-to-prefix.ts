import { checkExpression, runConversion } from "../expressions";
import type { Program } from "../types";

const code = `function postfixToPrefix(s) {
  const stack = [];
  for (const c of s) {                           // read left to right
    if ("+-*/^".includes(c)) {
      const right = stack.pop();                 // the right operand is on top
      const left = stack.pop();
      stack.push(c + left + right);              // the operator goes first
    } else {
      stack.push(c);                             // an operand
    }
  }
  return stack.pop();
}`;

const program: Program = {
  title: "Postfix to prefix",
  code,
  fields: [{ key: "s", label: "postfix", kind: "text", maxLength: 15, hint: "AB+CD-*" }],
  examples: [
    { label: "AB+CD-*", input: { s: "AB+CD-*" } },
    { label: "ABC/-AK/L-*", input: { s: "ABC/-AK/L-*" } },
    { label: "ABC*+DE/-", input: { s: "ABC*+DE/-" } },
  ],
  check: (input) => checkExpression(input.s as string, "postfix"),
  run: (input) =>
    runConversion(input.s as string, {
      from: "postfix",
      join: (op, left, right) => `${op}${left}${right}`,
      lines: { start: 2, operand: 9, operator: 7, done: 12 },
      target: "prefix",
      rule: "as op left right",
    }),
};

export default program;
