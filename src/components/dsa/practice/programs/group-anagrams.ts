import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function groupAnagrams(strs) {
  const groups = new Map();                   // signature -> the words that share it
  for (const word of strs) {
    const count = new Array(26).fill(0);
    for (const ch of word) count[ch.charCodeAt(0) - 97]++;
    let key = "";                             // e.g. "eat" -> "a1e1t1"
    for (let k = 0; k < 26; k++) {
      if (count[k] > 0) key += String.fromCharCode(97 + k) + count[k];
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}`;

const parseWords = (text: string) => text.split(/[\s,]+/).filter(Boolean);

const program: Program = {
  title: "Group anagrams (letter-count signature)",
  code,
  fields: [{ key: "strs", label: "strs", kind: "text", maxLength: 48, hint: "lowercase words separated by spaces, like eat tea tan ate nat bat" }],
  examples: [
    { label: "Example", input: { strs: "eat tea tan ate nat bat" } },
    { label: "Repeated letters", input: { strs: "aab aba baa ab ba" } },
    { label: "No anagrams", input: { strs: "one two six" } },
  ],
  check: (input) => {
    const words = parseWords(input.strs as string);
    if (words.length < 1 || words.length > 8) return "Give between 1 and 8 words.";
    return words.every((w) => /^[a-z]{1,6}$/.test(w)) ? null : "Use lowercase words of up to 6 letters.";
  },
  run(input) {
    const strs = parseWords(input.strs as string);
    const groups = new Map<string, string[]>();
    const r = recorder();

    const frame = (i: number | null, hotKey: string | null) => {
      const entries = [...groups].map(([k, ws]) => [k, ws.join(", ")] as [string, string]);
      return {
        arrays: [{ name: "strs", values: strs, tones: i === null ? toneRange(0, strs.length - 1, "done") : toneRange(0, i - 1, "done", { [i]: "primary" }), pointers: i === null ? {} : pointersAt(strs.length, { word: i }) }],
        maps: [
          {
            name: "groups (signature → words)",
            entries,
            keyLabel: "signature",
            valueLabel: "words",
            tones: Object.fromEntries(entries.flatMap(([k], idx) => (k === hotKey ? [[idx, "write" as const]] : []))),
          },
        ],
      };
    };

    r.step(lineOf(code, "const groups = new Map()"), `Anagrams have the **same letter counts**. Turn each word's counts into a short signature — "eat" has one a, one e, one t: "a1e1t1" — and file the word under it. Words with the same signature are anagrams.`, frame(null, null));
    strs.forEach((word, i) => {
      const count = new Array(26).fill(0);
      for (const ch of word) count[ch.charCodeAt(0) - 97]++;
      let key = "";
      for (let k = 0; k < 26; k++) if (count[k] > 0) key += String.fromCharCode(97 + k) + count[k];
      const isNew = !groups.has(key);
      if (isNew) groups.set(key, []);
      groups.get(key)!.push(word);
      r.step(
        lineOf(code, "groups.get(key).push(word)"),
        isNew
          ? `"${word}" has signature **${key}**. No group has it yet: start a new one.`
          : `"${word}" has signature **${key}** — the same as ${groups.get(key)!.slice(0, -1).map((w) => `"${w}"`).join(", ")}. Same letters, so it joins that group.`,
        { ...frame(i, key), vars: { word, key } }
      );
    });
    r.step(
      lineOf(code, "return [...groups.values()]"),
      `${groups.size} group${groups.size === 1 ? "" : "s"}: ${[...groups.values()].map((g) => `[${g.join(", ")}]`).join(" ")}. Each word was counted once, so the work is **O(n · k)** for n words of up to k letters.`,
      { ...frame(null, null), done: true }
    );
    return r.frames;
  },
};

export default program;
