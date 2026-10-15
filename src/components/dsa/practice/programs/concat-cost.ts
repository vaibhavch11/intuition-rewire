import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function joinWords(words) {
  let s = "";
  for (let i = 0; i < words.length; i++) {
    if (i > 0) s += " ";
    s += words[i];                          // a new string each time: copies everything so far
  }
  return s;
}`;

const parseWords = (text: string) => text.split(/\s+/).filter(Boolean);

const program: Program = {
  title: "The cost of += on a string",
  code,
  fields: [{ key: "words", label: "words", kind: "text", maxLength: 40, hint: "words separated by spaces, like the quick brown fox" }],
  examples: [
    { label: "Example", input: { words: "the quick brown fox" } },
    { label: "Many short words", input: { words: "a b c d e f g h" } },
    { label: "One word", input: { words: "hello" } },
  ],
  check: (input) => {
    const words = parseWords(input.words as string);
    if (words.length < 1 || words.length > 8) return "Give between 1 and 8 words.";
    if (words.join(" ").length > 30) return "Keep the joined sentence to 30 characters, so it fits on screen.";
    return null;
  },
  run(input) {
    const words = parseWords(input.words as string);
    const r = recorder();
    let s = "";
    let copied = 0;

    const frame = (oldLength: number, vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      for (let k = 0; k < s.length; k++) tones[k] = oldLength < 0 ? "done" : k < oldLength ? "muted" : "write";
      return {
        arrays: [{ name: "s (a brand-new string)", values: [...s].map((c) => (c === " " ? "␣" : c)), tones }],
        vars: { "length of s": s.length, "characters copied so far": copied, ...vars },
      };
    };
    const append = (piece: string, line: number, what: string, i: number) => {
      const old = s.length;
      s += piece;
      copied += s.length;
      r.step(
        line,
        `${what}: the old ${old} character${old === 1 ? "" : "s"} can't grow, so a **new** string of ${s.length} is made — copying the ${old} old character${old === 1 ? "" : "s"} (grey) and then the new one${piece.length === 1 ? "" : "s"}. Copied so far: **${copied}**.`,
        frame(old, { i })
      );
    };

    r.step(lineOf(code, `let s = ""`), `Start with an empty string and add the words one by one with \`+=\`. Keep an eye on how many characters get **copied** compared with how long the result is.`, frame(0));
    words.forEach((word, i) => {
      if (i > 0) append(" ", lineOf(code, `if (i > 0) s += " "`), "Add a space", i);
      append(word, lineOf(code, "s += words[i]"), `Add "${word}"`, i);
    });
    r.step(
      lineOf(code, "return s"),
      `The result has **${s.length}** characters, but **${copied}** character copies were made to build it. That gap grows like n² / 2. A builder (array + join, StringBuilder) writes each character once: ${s.length}.`,
      { ...frame(-1), done: true }
    );
    return r.frames;
  },
};

export default program;
