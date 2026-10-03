import { pointersAt, recorder, type CellTone, type Frame } from "./types";

/** Operators the conversion lessons use; every other character is a one-letter operand. */
export const OPERATORS = "+-*/^";
export const isOperator = (c: string) => OPERATORS.includes(c);

/**
 * Checks a prefix or postfix expression of one-character operands: every
 * operator must find two operands, and exactly one result must be left.
 */
export function checkExpression(s: string, notation: "prefix" | "postfix"): string | null {
  if (!/^[A-Za-z0-9+\-*/^]+$/.test(s)) return "Use one-letter operands (A–Z, a–z, 0–9) and the operators + - * / ^, with no spaces.";
  let depth = 0;
  const chars = notation === "prefix" ? [...s].reverse() : [...s];
  for (const c of chars) {
    if (isOperator(c)) {
      if (depth < 2) return `That isn't a valid ${notation} expression: an operator is missing an operand.`;
      depth--;
    } else depth++;
  }
  return depth === 1 ? null : `That isn't a valid ${notation} expression: ${depth} pieces are left over instead of one.`;
}

export interface Conversion {
  /** Which way the scan goes: prefix is read right to left, postfix left to right. */
  from: "prefix" | "postfix";
  /** Glues an operator to its operands, e.g. "(" + left + op + right + ")". */
  join: (op: string, left: string, right: string) => string;
  /** Code lines the frames point at. */
  lines: { start: number; operand: number; operator: number; done: number };
  /** Words for the narration. */
  target: string;
  rule: string;
}

/** Steps through a stack-based conversion: operands are pushed, operators pop two pieces and push one. */
export function runConversion(s: string, conv: Conversion): Frame[] {
  const chars = [...s];
  const n = chars.length;
  const r = recorder();
  const stack: string[] = [];
  const order = conv.from === "prefix" ? chars.map((_, i) => n - 1 - i) : chars.map((_, i) => i);
  const read = new Set<number>();

  const view = (i: number | undefined, tones: Record<number, CellTone> = {}, stackTones: Record<number, CellTone> = {}) => ({
    arrays: [
      {
        name: conv.from,
        values: chars,
        tones: { ...Object.fromEntries([...read].map((k) => [k, "done" as CellTone])), ...tones },
        pointers: pointersAt(n, { i }),
      },
    ],
    stacks: [{ name: "stack", values: stack, tones: stackTones }],
  });

  r.step(
    conv.lines.start,
    conv.from === "prefix"
      ? `In prefix, each operator comes **before** its two operands, so read from the **right**: by the time we reach an operator, both of its operands are already on the stack.`
      : `In postfix, each operator comes **after** its two operands, so read from the **left**: by the time we reach an operator, both of its operands are already on the stack.`,
    { ...view(undefined), vars: {} }
  );

  for (const i of order) {
    const c = chars[i];
    if (isOperator(c)) {
      // Prefix is read backwards, so the left operand is on top; postfix puts the right one on top.
      const first = stack.pop()!;
      const second = stack.pop()!;
      const [left, right] = conv.from === "prefix" ? [first, second] : [second, first];
      const piece = conv.join(c, left, right);
      stack.push(piece);
      r.step(conv.lines.operator, `'${c}' is an operator. Pop its operands — left = **${left}**, right = **${right}** — and push them joined ${conv.rule}: **${piece}**.`, {
        ...view(i, { [i]: "tertiary" }, { [stack.length - 1]: "write" }),
        vars: { op: c, left, right },
      });
    } else {
      stack.push(c);
      r.step(conv.lines.operand, `'${c}' is an operand: push it as a piece of its own.`, {
        ...view(i, { [i]: "primary" }, { [stack.length - 1]: "write" }),
        vars: {},
      });
    }
    read.add(i);
  }

  r.step(conv.lines.done, `Every character is read and one piece is left: the ${conv.target} expression **${stack[0]}**. Each character was pushed once and each operator joined two pieces once: **O(n)** stack operations.`, {
    ...view(undefined, {}, { 0: "success" }),
    vars: { result: stack[0] },
    done: true,
  });
  return r.frames;
}
