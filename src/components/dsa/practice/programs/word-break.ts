import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const longest = Math.max(...wordDict.map((w) => w.length));
  // dp[i]: can the first i letters, s[0..i), be split into dictionary words?
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;                                   // the empty prefix needs no words
  for (let i = 1; i <= s.length; i++) {
    for (let j = Math.max(0, i - longest); j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) {    // a good split up to j, then one word
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}`;

const parseWords = (text: string) => text.split(/[\s,]+/).filter(Boolean);

const program: Program = {
  title: "Word break (DP over prefixes)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 14, hint: "lowercase letters, like leetcode" },
    { key: "words", label: "wordDict", kind: "text", maxLength: 40, hint: "lowercase words separated by spaces, like leet code" },
  ],
  examples: [
    { label: "Example", input: { s: "leetcode", words: "leet code" } },
    { label: "Words reused", input: { s: "applepenapple", words: "apple pen" } },
    { label: "No split", input: { s: "catsandog", words: "cats dog sand and cat" } },
  ],
  check: (input) => {
    if (!/^[a-z]+$/.test(input.s as string)) return "s: use lowercase letters only.";
    const words = parseWords(input.words as string);
    if (words.length === 0 || words.some((w) => !/^[a-z]+$/.test(w))) return "wordDict: one or more lowercase words, separated by spaces.";
    return null;
  },
  run(input) {
    const s = input.s as string;
    const wordDict = parseWords(input.words as string);
    const words = new Set(wordDict);
    const longest = Math.max(...wordDict.map((w) => w.length));
    const n = s.length;
    const dp: (boolean | null)[] = Array.from({ length: n + 1 }, (_, k) => (k === 0 ? true : null));
    const r = recorder();

    // cut[i]: where the last word of a good split of the first i letters starts.
    const cut: number[] = [];
    const frame = (i: number | null, j: number | null, wordTone: CellTone | null, sTones: Record<number, CellTone> = {}) => {
      if (i !== null && j !== null && wordTone) for (let k = j; k < i; k++) sTones[k] = wordTone;
      const dpTones: Record<number, CellTone> = {};
      dp.forEach((v, k) => {
        if (v !== null) dpTones[k] = v ? "success" : "muted";
      });
      if (j !== null) dpTones[j] = "tertiary";
      if (i !== null) dpTones[i] = "write";
      return {
        arrays: [
          { name: "s", values: [...s], tones: sTones },
          { name: "dp (can the first i letters be split?)", values: dp.map((v) => (v === null ? "" : v ? "T" : "F")), tones: dpTones, pointers: pointersAt(n + 1, { j: j ?? undefined, i: i ?? undefined }, { j: "tertiary" }) },
        ],
        vars: { wordDict: wordDict.join(", "), longest, ...(i !== null && j !== null ? { "s[j..i)": `"${s.slice(j, i)}"` } : {}) },
      };
    };

    r.step(lineOf(code, "dp[0] = true"), `dp[i] asks: can the **first i letters** be split into words? dp[0] is true — the empty prefix needs no words. A prefix splits if some shorter prefix splits (dp[j] true) and the rest, s[j..i), is one word. Words are at most ${longest} letters, so j only goes back ${longest}.`, frame(null, null, null));
    for (let i = 1; i <= n; i++) {
      const from = Math.max(0, i - longest);
      let checked = 0;
      for (let j = from; j < i; j++) {
        if (!dp[j]) continue;
        checked++;
        const piece = s.slice(j, i);
        if (words.has(piece)) {
          dp[i] = true;
          cut[i] = j;
          r.step(lineOf(code, "dp[i] = true"), `dp[${j}] is true and "${piece}" is a word, so the first ${i} letters split: dp[${i}] = **true**.`, frame(i, j, "success"));
          break;
        }
        r.step(lineOf(code, "if (dp[j] && words.has"), `dp[${j}] is true, but "${piece}" is not a word.`, frame(i, j, "primary"));
      }
      if (!dp[i]) {
        dp[i] = false;
        r.step(
          lineOf(code, "if (dp[j] && words.has"),
          checked === 0
            ? `No j from ${from} to ${i - 1} has dp[j] true, so there's nowhere to end a word: dp[${i}] = **false**.`
            : `No good split ends at ${i}: dp[${i}] = **false**.`,
          frame(i, null, null)
        );
      }
    }
    // Walk the cuts back from the end to show one split, alternating colours word by word.
    const split: string[] = [];
    const wordTones: Record<number, CellTone> = {};
    if (dp[n]) {
      for (let end = n; end > 0; end = cut[end]) split.unshift(s.slice(cut[end], end));
      let at = 0;
      split.forEach((w, k) => {
        for (let x = 0; x < w.length; x++) wordTones[at + x] = k % 2 === 0 ? "success" : "primary";
        at += w.length;
      });
    }
    r.step(
      lineOf(code, "return dp[s.length]"),
      dp[n]
        ? `dp[${n}] covers the whole string: **true**. One split: ${split.map((w) => `"${w}"`).join(" + ")}. ${n} prefixes, each trying at most ${longest} split points: O(n · L) checks.`
        : `dp[${n}] covers the whole string: **false**, no split into dictionary words exists.`,
      { ...frame(null, null, null, wordTones), done: true }
    );
    return r.frames;
  },
};

export default program;
