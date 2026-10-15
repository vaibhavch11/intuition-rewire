import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function reverseWords(s) {
  const words = [];
  let i = s.length - 1;
  while (i >= 0) {
    while (i >= 0 && s[i] === " ") i--;      // skip spaces
    if (i < 0) break;
    const end = i;                            // the last letter of a word
    while (i >= 0 && s[i] !== " ") i--;      // walk back to the space before it
    words.push(s.slice(i + 1, end + 1));      // the word is s[i+1..end]
  }
  return words.join(" ");
}`;

const program: Program = {
  title: "Reverse words (two pointers from the end)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 26, hint: "words and spaces, like the sky is blue" }],
  examples: [
    { label: "Example", input: { s: "the sky is blue" } },
    { label: "Extra spaces", input: { s: "  hello   world " } },
    { label: "One word", input: { s: "solo" } },
  ],
  check: (input) => (/^[A-Za-z0-9 ]+$/.test(input.s as string) && /\S/.test(input.s as string) ? null : "s: use letters, digits and spaces, with at least one word."),
  run(input) {
    const s = [...(input.s as string)];
    const n = s.length;
    const r = recorder();
    const words: string[] = [];
    const taken = new Set<number>();
    let i = n - 1;

    const frame = (marks: Record<string, number | undefined>, hot: number[] = []) => {
      const tones: Record<number, CellTone> = {};
      s.forEach((ch, k) => {
        if (ch === " ") tones[k] = "muted";
        if (taken.has(k)) tones[k] = "done";
      });
      hot.forEach((k) => (tones[k] = "write"));
      return {
        arrays: [
          { name: "s", values: s.map((c) => (c === " " ? "␣" : c)), tones, pointers: pointersAt(n, marks, { end: "tertiary" }) },
          { name: "words (in reverse order)", values: [...words] },
        ],
        vars: marks,
      };
    };

    r.step(
      lineOf(code, "let i = s.length - 1"),
      `The last word should come first, so read the string **from the end**. Each word is found by two indexes: \`end\`, its last letter, and \`i\`, which walks back to the space before it.`,
      frame({ i })
    );
    while (i >= 0) {
      const spaceStart = i;
      while (i >= 0 && s[i] === " ") i--;
      if (spaceStart !== i) {
        r.step(lineOf(code, `while (i >= 0 && s[i] === " ") i--`), `Skip ${spaceStart - i} space${spaceStart - i === 1 ? "" : "s"}. Extra spaces anywhere simply never become part of a word.`, frame({ i }));
      }
      if (i < 0) {
        r.step(lineOf(code, "if (i < 0) break"), `Only spaces were left before the start: stop.`, frame({}));
        break;
      }
      const end = i;
      while (i >= 0 && s[i] !== " ") i--;
      const word = s.slice(i + 1, end + 1).join("");
      words.push(word);
      for (let k = i + 1; k <= end; k++) taken.add(k);
      r.step(
        lineOf(code, "words.push(s.slice(i + 1, end + 1))"),
        `Walk \`i\` back over the letters until a space (or the start). The word is s[${i + 1}..${end}] = **"${word}"**. Add it to the list.`,
        frame({ i: i >= 0 ? i : undefined, end }, Array.from({ length: end - i }, (_, k) => i + 1 + k))
      );
    }
    r.step(
      lineOf(code, `return words.join(" ")`),
      `Join the words with single spaces: **"${words.join(" ")}"**. Every character was passed once by \`i\`: **O(n) time**, plus O(n) for the answer.`,
      { ...frame({}), done: true }
    );
    return r.frames;
  },
};

export default program;
