import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function minRemoveToMakeValid(s) {
  const chars = [...s];
  const open = [];                            // indexes of '(' still waiting for a match
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "(") open.push(i);
    else if (chars[i] === ")") {
      if (open.length > 0) open.pop();        // matches the most recent '('
      else chars[i] = "";                     // nothing to match: remove it
    }
  }
  for (const i of open) chars[i] = "";        // '(' never matched: remove them too
  return chars.join("");
}`;

const program: Program = {
  title: "Minimum remove to make valid parentheses (stack of indexes)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 18, hint: "letters and brackets, like lee(t(c)o)de)" }],
  examples: [
    { label: "Example", input: { s: "lee(t(c)o)de)" } },
    { label: "Unclosed (", input: { s: "a)b(c)d(" } },
    { label: "All wrong", input: { s: "))((" } },
  ],
  check: (input) => (/^[a-z()]+$/.test(input.s as string) ? null : "s: use lowercase letters and ( ) only."),
  run(input) {
    const s = input.s as string;
    const chars = [...s];
    const n = chars.length;
    const open: number[] = [];
    const removed = new Set<number>();
    const matched = new Set<number>();
    const r = recorder();

    const frame = (i: number | null, hot: CellTone | null = null) => {
      const tones: Record<number, CellTone> = {};
      matched.forEach((k) => (tones[k] = "done"));
      open.forEach((k) => (tones[k] = "tertiary"));
      removed.forEach((k) => (tones[k] = "muted"));
      if (i !== null && hot) tones[i] = hot;
      return {
        arrays: [{ name: "s (grey: removed)", values: [...s], tones, pointers: i === null ? {} : pointersAt(n, { i }) }],
        stacks: [{ name: "open (indexes of unmatched '(')", values: [...open] }],
      };
    };

    r.step(lineOf(code, "const open = []"), `A ')' must close the **most recent** '(' that is still open — a stack. Keep the indexes of open '(' on it. A ')' with an empty stack can never be matched; a '(' still on the stack at the end never got closed. Remove exactly those.`, frame(null));
    for (let i = 0; i < n; i++) {
      if (chars[i] === "(") {
        open.push(i);
        r.step(lineOf(code, `if (chars[i] === "(") open.push(i)`), `'(' at ${i}: push its index and wait for a ')'.`, frame(i, "tertiary"));
      } else if (chars[i] === ")") {
        if (open.length > 0) {
          const j = open.pop()!;
          matched.add(i);
          matched.add(j);
          r.step(lineOf(code, "if (open.length > 0) open.pop()"), `')' at ${i} closes the most recent '(' at ${j}. Both stay.`, frame(i, "success"));
        } else {
          removed.add(i);
          chars[i] = "";
          r.step(lineOf(code, `else chars[i] = ""`), `')' at ${i} has no open '(' to close: remove it.`, frame(i, "write"));
        }
      }
    }
    if (open.length) {
      for (const j of open) {
        removed.add(j);
        chars[j] = "";
      }
      r.step(lineOf(code, "for (const i of open)"), `The scan is over, but '(' at ${open.join(", ")} never closed: remove ${open.length === 1 ? "it" : "them"}.`, frame(null));
      open.length = 0;
    }
    const result = chars.join("");
    r.step(
      lineOf(code, "return chars.join"),
      `Removed ${removed.size} bracket${removed.size === 1 ? "" : "s"} — the fewest possible, since each one could never be matched. Result: **"${result}"**. One pass plus a cleanup: **O(n)**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
