import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function firstUniqChar(s) {
  const count = new Array(26).fill(0);
  for (const ch of s) count[ch.charCodeAt(0) - 97]++;   // pass 1: count every letter
  for (let i = 0; i < s.length; i++) {
    if (count[s.charCodeAt(i) - 97] === 1) return i;    // pass 2: the first letter seen once
  }
  return -1;
}`;

const program: Program = {
  title: "First unique character (count, then scan)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 14, hint: "lowercase letters, like loveleetcode" }],
  examples: [
    { label: "Example", input: { s: "loveleetcode" } },
    { label: "The first one", input: { s: "leetcode" } },
    { label: "No unique letter", input: { s: "aabb" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only, like leetcode."),
  run(input) {
    const s = input.s as string;
    const chars = [...s];
    const count = new Array(26).fill(0);
    const r = recorder();

    const frame = (sTones: Record<number, CellTone>, marks: Record<string, number | undefined>, hot: number | null) => {
      const tones: Record<number, CellTone> = {};
      count.forEach((c, k) => c > 0 && (tones[k] = c === 1 ? "success" : "tertiary"));
      if (hot !== null) tones[hot] = "write";
      return {
        arrays: [
          { name: "s", values: chars, tones: sTones, pointers: pointersAt(chars.length, marks) },
          { name: "count (index 0 = 'a' … 25 = 'z'; green = seen once)", values: count, tones },
        ],
      };
    };

    r.step(lineOf(code, "const count = "), `"Unique" depends on the **whole** string — a letter can repeat at the very end — so it takes two passes: count everything first, then look for the first letter whose count is 1.`, frame({}, {}, null));
    chars.forEach((ch, i) => {
      const k = ch.charCodeAt(0) - 97;
      count[k]++;
      r.step(lineOf(code, "pass 1"), `Pass 1: '${ch}' → counter ${k} is now ${count[k]}.`, { ...frame(toneRange(0, i - 1, "done", { [i]: "primary" }), { i }, k), vars: { ch } });
    });
    for (let i = 0; i < chars.length; i++) {
      const k = chars[i].charCodeAt(0) - 97;
      if (count[k] === 1) {
        r.step(
          lineOf(code, "pass 2"),
          `Pass 2: '${chars[i]}' at index ${i} appears exactly once. It's the first such letter, so the answer is **${i}**. Two passes over n letters: **O(n)** time, O(1) space.`,
          { ...frame(toneRange(0, i - 1, "muted", { [i]: "success" }), { i }, k), done: true }
        );
        return r.frames;
      }
      r.step(lineOf(code, "pass 2"), `Pass 2: '${chars[i]}' at index ${i} appears ${count[k]} times — not unique, keep looking.`, frame(toneRange(0, i - 1, "muted", { [i]: "primary" }), { i }, k));
    }
    r.step(lineOf(code, "return -1"), `Every letter repeats somewhere, so there is no unique character: **-1**.`, { ...frame(toneRange(0, chars.length - 1, "muted"), {}, null), done: true });
    return r.frames;
  },
};

export default program;
