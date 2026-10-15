import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function characterReplacement(s, k) {
  const count = new Array(26).fill(0);
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    count[s.charCodeAt(right) - 65]++;               // 'A' is 65
    // To make the window one letter, replace everything except its most common letter.
    while (right - left + 1 - Math.max(...count) > k) {
      count[s.charCodeAt(left) - 65]--;              // too many to replace: shrink from the left
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`;

const program: Program = {
  title: "Longest repeating character replacement (sliding window)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 16, hint: "uppercase letters, like AABABBA" },
    { key: "k", label: "k", kind: "number", min: 0, max: 5 },
  ],
  examples: [
    { label: "Example", input: { s: "AABABBA", k: 1 } },
    { label: "k = 2", input: { s: "ABAB", k: 2 } },
    { label: "No replacements", input: { s: "AABBBCC", k: 0 } },
  ],
  check: (input) => (/^[A-Z]+$/.test(input.s as string) ? null : "s: use uppercase letters only, like AABABBA."),
  run(input) {
    const s = input.s as string;
    const k = input.k as number;
    const n = s.length;
    const count = new Array(26).fill(0);
    let left = 0;
    let best = 0;
    let bestRange: [number, number] | null = null;
    const r = recorder();

    const frame = (right: number, hot: CellTone = "tertiary") => {
      const tones: Record<number, CellTone> = {};
      if (bestRange) for (let x = bestRange[0]; x <= bestRange[1]; x++) tones[x] = "done";
      for (let x = left; x <= right; x++) tones[x] = hot;
      const maxFreq = Math.max(...count);
      const letters = count.flatMap((c, i) => (c > 0 ? [String.fromCharCode(65 + i)] : []));
      return {
        arrays: [{ name: "s (green: best window so far)", values: [...s], tones, pointers: pointersAt(n, { left, right: right >= 0 ? right : undefined }, { right: "tertiary" }) }],
        maps: [
          {
            name: "count (letters in the window)",
            entries: letters.map((ch) => [ch, count[ch.charCodeAt(0) - 65]] as [string, number]),
            keyLabel: "letter",
            valueLabel: "count",
            tones: Object.fromEntries(letters.flatMap((ch, i) => (count[ch.charCodeAt(0) - 65] === maxFreq ? [[i, "success" as const]] : []))),
          },
        ],
        vars: { window: right - left + 1, "most common": maxFreq, "to replace": right - left + 1 - maxFreq, best },
      };
    };

    r.step(lineOf(code, "let left = 0, best = 0"), `A window can become all one letter by replacing everything **except its most common letter**: that's \`window length - max count\` replacements. Grow the window to the right; whenever that needs more than k = ${k}, shrink it from the left.`, frame(-1));
    for (let right = 0; right < n; right++) {
      count[s.charCodeAt(right) - 65]++;
      const needed = right - left + 1 - Math.max(...count);
      r.step(lineOf(code, "count[s.charCodeAt(right) - 65]++"), `Take in '${s[right]}'. The window "${s.slice(left, right + 1)}" would need ${needed} replacement${needed === 1 ? "" : "s"}.`, frame(right));
      while (right - left + 1 - Math.max(...count) > k) {
        count[s.charCodeAt(left) - 65]--;
        left++;
        r.step(lineOf(code, "too many to replace"), `That's more than ${k}: drop '${s[left - 1]}' from the left. The window is now "${s.slice(left, right + 1)}".`, frame(right, "primary"));
      }
      if (right - left + 1 > best) {
        best = right - left + 1;
        bestRange = [left, right];
        r.step(lineOf(code, "best = Math.max"), `"${s.slice(left, right + 1)}" works with at most ${k} replacement${k === 1 ? "" : "s"}: new best, **${best}**.`, frame(right, "success"));
      }
    }
    r.step(lineOf(code, "return best"), `The longest window is **${best}** letters. Each letter entered and left the window at most once: **O(n)** time (with 26 counters to check each step).`, { ...frame(n - 1, "done"), done: true });
    return r.frames;
  },
};

export default program;
