import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (t === "+" || t === "-" || t === "*" || t === "/") {
      const b = stack.pop();       // the right operand comes off first
      const a = stack.pop();
      if (t === "+") stack.push(a + b);
      else if (t === "-") stack.push(a - b);
      else if (t === "*") stack.push(a * b);
      else stack.push(Math.trunc(a / b));
    } else {
      stack.push(Number(t));
    }
  }
  return stack.pop();
}`;

const OPS = ["+", "-", "*", "/"];
const tokensOf = (text: string) => text.trim().split(/\s+/).filter(Boolean);
const apply = (op: string, a: number, b: number) =>
  op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : Math.trunc(a / b);
const LINE: Record<string, number> = { "+": 7, "-": 8, "*": 9, "/": 10 };

const program: Program = {
  title: "Evaluate a postfix expression",
  code,
  fields: [{ key: "expr", label: "postfix tokens", kind: "text", maxLength: 60, hint: "2 1 + 3 *" }],
  examples: [
    { label: "(2 + 1) × 3", input: { expr: "2 1 + 3 *" } },
    { label: "4 + 13 / 5", input: { expr: "4 13 5 / +" } },
    { label: "5 + (1 + 2) × 4 − 3", input: { expr: "5 1 2 + 4 * + 3 -" } },
  ],
  check(input) {
    const tokens = tokensOf(input.expr as string);
    if (tokens.length > 13) return "Use at most 13 tokens so every step stays readable.";
    let depth = 0;
    const values: number[] = [];
    for (const t of tokens) {
      if (OPS.includes(t)) {
        if (depth < 2) return `"${t}" needs two numbers before it. In postfix the operator comes after both of its operands.`;
        const b = values.pop()!;
        const a = values.pop()!;
        if (t === "/" && b === 0) return "That expression divides by zero.";
        values.push(apply(t, a, b));
        depth--;
      } else if (/^-?\d{1,3}$/.test(t)) {
        values.push(Number(t));
        depth++;
      } else {
        return `"${t}" isn't a number or one of + - * /. Separate tokens with spaces, like 2 1 + 3 *.`;
      }
    }
    if (depth !== 1) return `That leaves ${depth} numbers on the stack — a valid postfix expression leaves exactly one.`;
    return null;
  },
  run(input) {
    const tokens = tokensOf(input.expr as string);
    const r = recorder();
    const stack: number[] = [];

    const view = (i: number | undefined, tones: Record<number, CellTone> = {}, stackTones: Record<number, CellTone> = {}) => ({
      arrays: [
        {
          name: "tokens",
          values: tokens,
          tones: { ...Object.fromEntries(tokens.map((_, k) => [k, (i !== undefined && k < i ? "done" : "idle") as CellTone])), ...tones },
          pointers: pointersAt(tokens.length, { t: i }),
        },
      ],
      stacks: [{ name: "stack", values: stack, tones: stackTones }],
    });

    r.step(2, `Scan the tokens left to right. Numbers wait on the stack until an operator needs them.`, { ...view(undefined), vars: {} });

    tokens.forEach((t, i) => {
      if (OPS.includes(t)) {
        const b = stack.pop()!;
        const a = stack.pop()!;
        const value = apply(t, a, b);
        stack.push(value);
        r.step(
          LINE[t],
          `**${t}** pops its two operands: b = ${b} (the top) and a = ${a}. It pushes a ${t} b = **${value}**${t === "/" ? " (division drops the fraction)" : ""}.`,
          { ...view(i, { [i]: "tertiary" }, { [stack.length - 1]: "write" }), vars: { a, b, result: value } }
        );
      } else {
        stack.push(Number(t));
        r.step(12, `**${t}** is a number: push it.`, {
          ...view(i, { [i]: "primary" }, { [stack.length - 1]: "write" }),
          vars: {},
        });
      }
    });

    r.step(15, `No tokens left. The one value on the stack is the answer: **${stack[0]}**. No brackets, no precedence rules — the order of the tokens already says what to do.`, {
      ...view(tokens.length, {}, { 0: "success" }),
      vars: { result: stack[0] },
      done: true,
    });
    return r.frames;
  },
};

export default program;
