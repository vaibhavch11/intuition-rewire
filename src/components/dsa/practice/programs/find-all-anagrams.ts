import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function findAnagrams(s, p) {
  const result = [];
  if (p.length > s.length) return result;
  const need = new Array(26).fill(0), have = new Array(26).fill(0);
  for (const ch of p) need[ch.charCodeAt(0) - 97]++;
  const same = () => need.every((c, k) => c === have[k]);   // 26 comparisons: O(1)
  for (let right = 0; right < s.length; right++) {
    have[s.charCodeAt(right) - 97]++;                // the window takes in s[right]...
    const left = right - p.length + 1;
    if (left < 0) continue;                          // not full yet
    if (same()) result.push(left);                   // ...counts match: an anagram starts at left
    have[s.charCodeAt(left) - 97]--;                 // ...then lets go of s[left]
  }
  return result;
}`;

const program: Program = {
  title: "Find all anagrams (fixed-size sliding window)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 16, hint: "lowercase letters, like cbaebabacd" },
    { key: "p", label: "p", kind: "text", maxLength: 5, hint: "lowercase letters, like abc" },
  ],
  examples: [
    { label: "Example", input: { s: "cbaebabacd", p: "abc" } },
    { label: "Overlapping", input: { s: "abab", p: "ab" } },
    { label: "None", input: { s: "hello", p: "xyz" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) && /^[a-z]+$/.test(input.p as string) ? null : "s and p: use lowercase letters only."),
  run(input) {
    const s = input.s as string;
    const p = input.p as string;
    const n = s.length;
    const m = p.length;
    const need = new Array(26).fill(0);
    const have = new Array(26).fill(0);
    for (const ch of p) need[ch.charCodeAt(0) - 97]++;
    const result: number[] = [];
    const found = new Set<number>();
    const r = recorder();

    const table = () => {
      const letters = [...new Set([...p, ...s])].sort().filter((ch) => need[ch.charCodeAt(0) - 97] > 0 || have[ch.charCodeAt(0) - 97] > 0);
      return {
        name: "counts (have / need)",
        entries: letters.map((ch) => [ch, `${have[ch.charCodeAt(0) - 97]} / ${need[ch.charCodeAt(0) - 97]}`] as [string, string]),
        keyLabel: "letter",
        valueLabel: "have/need",
        tones: Object.fromEntries(letters.flatMap((ch, k) => (have[ch.charCodeAt(0) - 97] === need[ch.charCodeAt(0) - 97] ? [[k, "done" as const]] : []))),
      };
    };
    const frame = (left: number, right: number, hot: CellTone | null = null) => {
      const tones: Record<number, CellTone> = {};
      found.forEach((st) => (tones[st] = "success"));
      for (let k = Math.max(0, left); k <= right; k++) tones[k] = hot ?? "tertiary";
      return {
        arrays: [
          { name: "s", values: [...s], tones, pointers: pointersAt(n, { left: left >= 0 ? left : undefined, right }, { right: "tertiary" }) },
          { name: "result (start indexes)", values: [...result] },
        ],
        maps: [table()],
      };
    };

    if (m > n) {
      r.step(lineOf(code, "if (p.length > s.length) return result"), `p is longer than s, so no window of s can hold an anagram of it: **[]**.`, { ...frame(-1, -1), done: true });
      return r.frames;
    }
    r.step(lineOf(code, "const same = "), `Every anagram of "${p}" is exactly **${m}** letters long, so slide a window of ${m} letters across s. Keep its letter counts in \`have\` and compare with \`need\`. Moving the window changes just two counts: one letter in, one letter out.`, frame(-1, -1));
    for (let right = 0; right < n; right++) {
      have[s.charCodeAt(right) - 97]++;
      const left = right - m + 1;
      if (left < 0) {
        r.step(lineOf(code, "if (left < 0) continue"), `Take in '${s[right]}'. The window has ${right + 1} of ${m} letters — not full yet.`, frame(0, right));
        continue;
      }
      const match = need.every((c, k) => c === have[k]);
      if (match) {
        result.push(left);
        found.add(left);
      }
      r.step(
        lineOf(code, match ? "if (same()) result.push(left)" : "if (same())"),
        match
          ? `Window s[${left}..${right}] = "${s.slice(left, right + 1)}": every count matches. An anagram starts at **${left}**.`
          : `Window s[${left}..${right}] = "${s.slice(left, right + 1)}": the counts don't match.`,
        frame(left, right, match ? "success" : "tertiary")
      );
      have[s.charCodeAt(left) - 97]--;
    }
    r.step(lineOf(code, "return result"), `Result: **[${result.join(", ")}]**. Each step changed two counts and compared 26: **O(n)** time, O(1) space.`, { ...frame(-1, -1), done: true });
    return r.frames;
  },
};

export default program;
