import type { Field, InputValue } from "./types";

type Parsed = { value: InputValue } | { error: string };

const bounds = (field: Field) => ({ min: field.min ?? -99, max: field.max ?? 999 });

export function formatField(field: Field, value: InputValue): string {
  switch (field.kind) {
    case "number":
      return String(value);
    case "array":
      return (value as number[]).join(", ");
    case "grid":
      return (value as number[][]).map((row) => row.join(" ")).join("\n");
    case "pairs":
      return (value as number[][]).map(([a, b]) => `[${a},${b}]`).join(" ");
    case "tree":
      return (value as (number | null)[]).map((v) => (v === null ? "null" : String(v))).join(", ");
    case "text":
      return String(value);
  }
}

function parseNumbers(field: Field, text: string, what: string): number[] | string {
  const cleaned = text.replace(/[[\]]/g, " ").trim();
  if (!cleaned) return `${what}: enter at least one number.`;
  if (!/^[-\d\s,]+$/.test(cleaned)) {
    return `${what}: use whole numbers separated by commas or spaces, like 3, 1, 4.`;
  }
  const parts = cleaned.split(/[\s,]+/).filter(Boolean);
  const { min, max } = bounds(field);
  const numbers: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return `${what}: "${part}" isn't a whole number.`;
    const value = Number(part);
    if (value < min || value > max) return `${what}: keep every value between ${min} and ${max}.`;
    numbers.push(value);
  }
  return numbers;
}

export function parseField(field: Field, text: string): Parsed {
  const limit = field.maxLength ?? 10;

  switch (field.kind) {
    case "number": {
      const trimmed = text.trim();
      const { min, max } = bounds(field);
      if (!/^-?\d+$/.test(trimmed)) return { error: `${field.label}: enter a whole number.` };
      const value = Number(trimmed);
      if (value < min || value > max) return { error: `${field.label}: use a value from ${min} to ${max}.` };
      return { value };
    }

    case "array": {
      const numbers = parseNumbers(field, text, field.label);
      if (typeof numbers === "string") return { error: numbers };
      if (numbers.length > limit) return { error: `${field.label}: use at most ${limit} numbers so every step stays readable.` };
      return { value: numbers };
    }

    case "grid": {
      const rowTexts = (
        text.includes("[")
          ? [...text.matchAll(/\[([^[\]]*)\]/g)].map((m) => m[1])
          : text.split(/[;\n]/)
      )
        .map((row) => row.trim())
        .filter(Boolean);
      if (rowTexts.length === 0) return { error: `${field.label}: enter at least one row.` };
      if (rowTexts.length > limit) return { error: `${field.label}: use at most ${limit} rows.` };
      const rows: number[][] = [];
      for (const [i, rowText] of rowTexts.entries()) {
        const numbers = parseNumbers(field, rowText, `${field.label} row ${i + 1}`);
        if (typeof numbers === "string") return { error: numbers };
        if (numbers.length > limit) return { error: `${field.label}: use at most ${limit} columns.` };
        rows.push(numbers);
      }
      if (rows.some((row) => row.length !== rows[0].length)) {
        return { error: `${field.label}: every row needs the same number of values.` };
      }
      return { value: rows };
    }

    case "tree": {
      const tokens = text.replace(/[[\]]/g, " ").split(/[\s,]+/).filter(Boolean);
      if (tokens.length === 0) return { value: [] };
      const { min, max } = bounds(field);
      const values: (number | null)[] = [];
      for (const token of tokens) {
        if (/^(null|none|nil|#|x)$/i.test(token)) {
          values.push(null);
          continue;
        }
        if (!/^-?\d+$/.test(token)) {
          return { error: `${field.label}: "${token}" isn't a number. Write the tree level by level, using null for a missing child, like 1, 2, 3, null, 4.` };
        }
        const value = Number(token);
        if (value < min || value > max) return { error: `${field.label}: keep every value between ${min} and ${max}.` };
        values.push(value);
      }
      while (values.length > 0 && values[values.length - 1] === null) values.pop();
      if (values.length > 0 && values[0] === null) return { error: `${field.label}: the first value is the root, so it can't be null.` };
      if (values.filter((v) => v !== null).length > limit) {
        return { error: `${field.label}: use at most ${limit} nodes so the tree stays readable.` };
      }
      return { value: values };
    }

    case "text": {
      const trimmed = text.trim();
      if (!trimmed) return { error: `${field.label}: enter something to run.` };
      if (trimmed.length > limit) return { error: `${field.label}: keep it to ${limit} characters.` };
      return { value: trimmed };
    }

    case "pairs": {
      const pattern = /\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/g;
      // Intervals are [start,end]; points (ordered: false) are any [x,y].
      const ordered = field.ordered ?? true;
      // A hint (e.g. edges as "[u,v] pairs") replaces the interval / point wording.
      const shape = field.hint ?? (ordered ? "[start,end], like [1,3] [2,6]" : "[x,y], like [1,3] [-2,2]");
      if (text.replace(pattern, "").replace(/[\s,;]/g, "") !== "") {
        return { error: `${field.label}: write each one as ${shape}.` };
      }
      const pairs = [...text.matchAll(pattern)].map((m) => [Number(m[1]), Number(m[2])]);
      if (pairs.length === 0) {
        return { error: field.hint ? `${field.label}: enter at least one, as ${field.hint}.` : `${field.label}: enter at least one ${ordered ? "[start,end] pair" : "[x,y] point"}.` };
      }
      if (pairs.length > limit) return { error: `${field.label}: use at most ${limit} pairs.` };
      const { min, max } = bounds(field);
      for (const [a, b] of pairs) {
        if (ordered && a > b) return { error: `${field.label}: [${a},${b}] ends before it starts.` };
        if (Math.min(a, b) < min || Math.max(a, b) > max) return { error: `${field.label}: keep values between ${min} and ${max}.` };
      }
      return { value: pairs };
    }
  }
}
