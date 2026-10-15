import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function shortestPalindrome(s) {
  const rev = [...s].reverse().join("");
  const t = s + "#" + rev;                     // '#' stops a border from running past s
  const lps = new Array(t.length).fill(0);
  for (let i = 1, len = 0; i < t.length; ) {
    if (t[i] === t[len]) lps[i++] = ++len;
    else if (len > 0) len = lps[len - 1];
    else lps[i++] = 0;
  }
  const keep = lps[t.length - 1];              // the longest prefix of s that is a palindrome
  return rev.slice(0, s.length - keep) + s;    // mirror the rest onto the front
}`;

const program: Program = {
  title: "Shortest palindrome (KMP on s # reverse)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 7, hint: "lowercase letters, like aabba" }],
  examples: [
    { label: "Example", input: { s: "aabba" } },
    { label: "Nothing to keep", input: { s: "abcd" } },
    { label: "Already a palindrome", input: { s: "racecar" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only."),
  run(input) {
    const s = input.s as string;
    const n = s.length;
    const rev = [...s].reverse().join("");
    const t = s + "#" + rev;
    const lps = new Array(t.length).fill(0);
    const r = recorder();

    // filled: how many lps entries are known so far.
    const frame = (i: number, len: number, hot: CellTone, filled: number) => ({
      arrays: [
        { name: "t = s # reverse(s)", values: [...t], tones: { ...Object.fromEntries(Array.from({ length: len }, (_, k) => [k, "tertiary" as const])), ...(i < t.length ? { [i]: hot } : {}) }, pointers: pointersAt(t.length, { len, i }, { i: "tertiary" }) },
        { name: "lps", values: lps.map((v, k) => (k < filled ? v : "")), tones: i < t.length ? { [i]: "write" as const } : {} },
      ],
      vars: { i, len },
    });

    r.step(lineOf(code, "const t = s + "), `To add the fewest letters to the **front**, keep the longest **prefix of s that is already a palindrome** and mirror the rest. That prefix, read backwards, is a **suffix of reverse(s)** — so it is a border of t = s + "#" + reverse(s). The '#' stops a border from being longer than s.`, frame(1, 0, "primary", 1));
    for (let i = 1, len = 0; i < t.length; ) {
      if (t[i] === t[len]) {
        lps[i] = ++len;
        r.step(lineOf(code, "lps[i++] = ++len"), `t[${i}] = '${t[i]}' matches t[${len - 1}]: the border grows to **${len}**. lps[${i}] = ${len}.`, frame(i, len, "success", i + 1));
        i++;
      } else if (len > 0) {
        const old = len;
        len = lps[len - 1];
        r.step(lineOf(code, "len = lps[len - 1]"), `t[${i}] = '${t[i]}' doesn't extend the border "${t.slice(0, old)}". Fall back to its own border, length ${len}.`, frame(i, len, "write", i));
      } else {
        lps[i] = 0;
        r.step(lineOf(code, "else lps[i++] = 0"), `t[${i}] = '${t[i]}' starts no border: lps[${i}] = 0.`, frame(i, 0, "write", i + 1));
        i++;
      }
    }

    const keep = lps[t.length - 1];
    const add = rev.slice(0, n - keep);
    const answer = add + s;
    const sTones: Record<number, CellTone> = {};
    for (let k = 0; k < n; k++) sTones[k] = k < keep ? "success" : "write";
    r.step(
      lineOf(code, "const keep = lps[t.length - 1]"),
      `The last lps entry is **${keep}**: "${s.slice(0, keep)}" is the longest prefix of s that reads the same backwards. ${keep === n ? "That's all of s." : `The other ${n - keep} letter${n - keep === 1 ? "" : "s"} ("${s.slice(keep)}") need a mirror image in front.`}`,
      { arrays: [{ name: "s (palindrome prefix, then the rest)", values: [...s], tones: sTones }, { name: "lps", values: lps, tones: { [t.length - 1]: "write" } }], vars: { keep } }
    );

    const aTones: Record<number, CellTone> = {};
    for (let k = 0; k < answer.length; k++) aTones[k] = k < add.length || k >= add.length + keep ? "write" : "success";
    r.step(
      lineOf(code, "return rev.slice"),
      add === ""
        ? `s is already a palindrome: return **"${s}"** unchanged. One KMP table over 2n + 1 letters: **O(n)**.`
        : `Put "${add}" (the rest, reversed) in front: **"${answer}"**. One KMP table over 2n + 1 letters: **O(n)**.`,
      { arrays: [{ name: "answer", values: [...answer], tones: aTones }], vars: { keep, added: add.length }, done: true }
    );
    return r.frames;
  },
};

export default program;
