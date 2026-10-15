import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function longestCommonPrefix(strs) {
  const first = strs[0];
  for (let i = 0; i < first.length; i++) {    // column i
    for (const word of strs) {
      if (i === word.length || word[i] !== first[i]) {
        return first.slice(0, i);             // a word ended or disagreed: stop here
      }
    }
  }
  return first;                               // the whole first word is shared
}`;

const parseWords = (text: string) => text.split(/[\s,]+/).filter(Boolean);

const program: Program = {
  title: "Longest common prefix (column by column)",
  code,
  fields: [{ key: "strs", label: "strs", kind: "text", maxLength: 48, hint: "lowercase words separated by spaces, like flower flow flight" }],
  examples: [
    { label: "Example", input: { strs: "flower flow flight" } },
    { label: "A short word ends it", input: { strs: "interview inter internet" } },
    { label: "Nothing shared", input: { strs: "dog racecar car" } },
  ],
  check: (input) => {
    const words = parseWords(input.strs as string);
    if (words.length < 1 || words.length > 6) return "Give between 1 and 6 words.";
    return words.every((w) => /^[a-z]{1,10}$/.test(w)) ? null : "Use lowercase words of up to 10 letters.";
  },
  run(input) {
    const strs = parseWords(input.strs as string);
    const first = strs[0];
    const r = recorder();
    const rows = strs.map((w) => [...w]);

    const frame = (done: number, col: number | null, bad: number | null, ok: number[] = []) => {
      const tones: Record<string, CellTone> = {};
      rows.forEach((row, y) =>
        row.forEach((_, x) => {
          if (x < done) tones[cell(y, x)] = "done";
        })
      );
      if (col !== null) {
        ok.forEach((y) => (tones[cell(y, col)] = "success"));
        if (bad !== null && col < rows[bad].length) tones[cell(bad, col)] = "write";
      }
      return {
        grids: [{ name: "strs (one word per row)", values: rows, tones, rowLabels: strs.map((_, y) => String(y)) }],
        vars: { prefix: `"${first.slice(0, done)}"`, ...(col === null ? {} : { i: col }) },
      };
    };

    r.step(lineOf(code, "const first = strs[0]"), `The answer can't be longer than any word, so use the first word as the guide. Compare **column by column**: column i is shared only if every word has the same letter there.`, frame(0, null, null));
    for (let i = 0; i < first.length; i++) {
      const ok: number[] = [];
      for (let y = 0; y < strs.length; y++) {
        const word = strs[y];
        if (i === word.length || word[i] !== first[i]) {
          r.step(
            lineOf(code, "return first.slice(0, i)"),
            i === word.length
              ? `Column ${i}: "${word}" has no letter here — it has ended. The common prefix stops at **"${first.slice(0, i)}"**.`
              : `Column ${i}: "${word}" has '${word[i]}' where the first word has '${first[i]}'. The common prefix is **"${first.slice(0, i)}"**.`,
            { ...frame(i, i, y, ok), done: true }
          );
          return r.frames;
        }
        ok.push(y);
      }
      r.step(lineOf(code, "for (const word of strs)"), `Column ${i}: every word has '${first[i]}'. It's part of the prefix.`, frame(i + 1, i, null, ok));
    }
    r.step(lineOf(code, "return first;"), `Every column of the first word matched in all words: the whole word **"${first}"** is the prefix. At most every character was compared once: **O(S)** for S characters in total.`, { ...frame(first.length, null, null), done: true });
    return r.frames;
  },
};

export default program;
