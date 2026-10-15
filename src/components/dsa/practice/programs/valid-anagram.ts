import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function isAnagram(s, t) {
  if (s.length !== t.length) return false;   // different lengths can't match
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;            // s adds one
    count[t.charCodeAt(i) - 97]--;            // t takes one away
  }
  return count.every((c) => c === 0);         // every letter balanced out?
}`;

const program: Program = {
  title: "Valid anagram (one array of 26 counts)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 10, hint: "lowercase letters, like anagram" },
    { key: "t", label: "t", kind: "text", maxLength: 10, hint: "lowercase letters, like nagaram" },
  ],
  examples: [
    { label: "Example", input: { s: "listen", t: "silent" } },
    { label: "Not an anagram", input: { s: "rat", t: "car" } },
    { label: "Different lengths", input: { s: "ab", t: "abc" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) && /^[a-z]+$/.test(input.t as string) ? null : "s and t: use lowercase letters only."),
  run(input) {
    const s = input.s as string;
    const t = input.t as string;
    const count = new Array(26).fill(0);
    const r = recorder();

    const frame = (i: number | null, hot: number[] = []) => {
      const tones: Record<number, CellTone> = {};
      count.forEach((c, k) => c !== 0 && (tones[k] = "tertiary"));
      hot.forEach((k) => (tones[k] = "write"));
      return {
        arrays: [
          { name: "s", values: [...s], tones: i === null ? {} : toneRange(0, i - 1, "done", { [i]: "primary" }), pointers: i === null ? {} : pointersAt(s.length, { i }) },
          { name: "t", values: [...t], tones: i === null ? {} : toneRange(0, i - 1, "done", { [i]: "primary" }), pointers: i === null ? {} : pointersAt(t.length, { i }) },
          { name: "count (index 0 = 'a' … 25 = 'z')", values: count, tones },
        ],
      };
    };

    if (s.length !== t.length) {
      r.step(lineOf(code, "if (s.length !== t.length) return false"), `s has ${s.length} letters and t has ${t.length}. Anagrams use exactly the same letters, so they must be the same length: **false**.`, { ...frame(null), done: true });
      return r.frames;
    }
    r.step(lineOf(code, "const count = "), `Two strings are anagrams when every letter appears the **same number of times** in both. One array of 26 counters checks that: s adds, t subtracts, and everything must end at 0.`, frame(null));
    for (let i = 0; i < s.length; i++) {
      const a = s.charCodeAt(i) - 97;
      const b = t.charCodeAt(i) - 97;
      count[a]++;
      count[b]--;
      r.step(
        lineOf(code, "count[t.charCodeAt(i) - 97]--"),
        a === b
          ? `s[${i}] and t[${i}] are both '${s[i]}': +1 and -1 on counter ${a} cancel out.`
          : `s[${i}] = '${s[i]}' adds one to counter ${a} (now ${count[a]}); t[${i}] = '${t[i]}' takes one from counter ${b} (now ${count[b]}).`,
        { ...frame(i, a === b ? [a] : [a, b]), vars: { i } }
      );
    }
    const off = count.flatMap((c, k) => (c !== 0 ? [`'${String.fromCharCode(97 + k)}' is ${c > 0 ? "+" : ""}${c}`] : []));
    r.step(
      lineOf(code, "return count.every"),
      off.length
        ? `Not every counter is 0 (${off.join(", ")}): the letters don't balance, so **false**.`
        : `Every counter is back to 0: each letter appears equally often in both. **true**, in **O(n)** time and O(1) space.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
