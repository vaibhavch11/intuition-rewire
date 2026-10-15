import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function backspaceCompare(s, t) {
  const build = (str) => {
    const stack = [];
    for (const ch of str) {
      if (ch === "#") stack.pop();            // backspace: remove the last character typed
      else stack.push(ch);                    // (popping an empty stack does nothing)
    }
    return stack.join("");
  };
  return build(s) === build(t);
}`;

const program: Program = {
  title: "Backspace string compare (a stack per string)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 12, hint: "letters and #, like ab#c" },
    { key: "t", label: "t", kind: "text", maxLength: 12, hint: "letters and #, like ad#c" },
  ],
  examples: [
    { label: "Example", input: { s: "ab#c", t: "ad#c" } },
    { label: "Backspace at the start", input: { s: "#a#c", t: "c" } },
    { label: "Different", input: { s: "a#c", t: "b" } },
  ],
  check: (input) => (/^[a-z#]+$/.test(input.s as string) && /^[a-z#]+$/.test(input.t as string) ? null : "s and t: use lowercase letters and # only."),
  run(input) {
    const strs = { s: input.s as string, t: input.t as string };
    const results: Record<string, string> = {};
    const r = recorder();

    const frame = (name: "s" | "t" | null, i: number | null, stack: string[]) => ({
      arrays: (["s", "t"] as const).map((k) => ({
        name: k,
        values: [...strs[k]],
        tones: name === k && i !== null ? toneRange(0, i - 1, "done", { [i]: strs[k][i] === "#" ? "write" : "primary" }) : results[k] !== undefined ? toneRange(0, strs[k].length - 1, "done") : {},
        pointers: name === k && i !== null ? pointersAt(strs[k].length, { ch: i }) : {},
      })),
      stacks: [{ name: name ? `stack for ${name}` : "stack", values: [...stack] }],
      vars: { ...(results.s !== undefined ? { "build(s)": `"${results.s}"` } : {}), ...(results.t !== undefined ? { "build(t)": `"${results.t}"` } : {}) },
    });

    r.step(lineOf(code, "const build = "), `Typing is a stack: each letter goes on top, and a backspace removes the **most recent** letter — the top. Replay each string's keystrokes onto a stack and compare what's left.`, frame(null, null, []));
    for (const name of ["s", "t"] as const) {
      const str = strs[name];
      const stack: string[] = [];
      [...str].forEach((ch, i) => {
        if (ch === "#") {
          const gone = stack.pop();
          r.step(lineOf(code, `if (ch === "#") stack.pop()`), gone === undefined ? `'#' with nothing typed yet: the backspace does nothing.` : `'#' deletes the last letter typed, '${gone}'.`, frame(name, i, stack));
        } else {
          stack.push(ch);
          r.step(lineOf(code, "else stack.push(ch)"), `Type '${ch}': push it.`, frame(name, i, stack));
        }
      });
      results[name] = stack.join("");
      r.step(lineOf(code, `return stack.join("")`), `What's left of ${name} reads **"${results[name]}"**.`, frame(null, null, stack));
    }
    const same = results.s === results.t;
    r.step(
      lineOf(code, "return build(s) === build(t)"),
      `"${results.s}" ${same ? "equals" : "differs from"} "${results.t}": **${same}**. Each keystroke was one push or pop: **O(n + m)** time and space.`,
      { ...frame(null, null, []), done: true }
    );
    return r.frames;
  },
};

export default program;
