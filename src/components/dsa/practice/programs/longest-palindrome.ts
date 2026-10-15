import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function longestPalindrome(s) {
  let bestStart = 0, bestLen = 0;
  const expand = (left, right) => {          // grow outwards while the ends match
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    // The loop went one step too far on each side: the palindrome is s[left+1..right-1].
    if (right - left - 1 > bestLen) {
      bestStart = left + 1;
      bestLen = right - left - 1;
    }
  };
  for (let center = 0; center < s.length; center++) {
    expand(center, center);                  // odd length: one middle letter
    expand(center, center + 1);              // even length: the gap after it
  }
  return s.slice(bestStart, bestStart + bestLen);
}`;

const program: Program = {
  title: "Longest palindromic substring (expand around each centre)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 16, hint: "lowercase letters, like babad" }],
  examples: [
    { label: "Example", input: { s: "babad" } },
    { label: "Even length", input: { s: "cbbd" } },
    { label: "Long one inside", input: { s: "forgeeksskeegfor" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? ((input.s as string).length <= 16 ? null : "Keep s to 16 letters.") : "s: use lowercase letters only, like babad."),
  run(input) {
    const s = input.s as string;
    const n = s.length;
    let bestStart = 0;
    let bestLen = 0;
    const r = recorder();

    const frame = (left: number, right: number, vars: Record<string, unknown>) => {
      const tones: Record<number, CellTone> = {};
      for (let k = bestStart; k < bestStart + bestLen; k++) tones[k] = "done";
      for (let k = Math.max(left + 1, 0); k <= Math.min(right - 1, n - 1); k++) tones[k] = "tertiary";
      return {
        arrays: [{ name: "s (green: longest so far)", values: [...s], tones, pointers: pointersAt(n, { left: left >= 0 ? left : undefined, right: right < n ? right : undefined }, { right: "tertiary" }) }],
        vars: { best: `"${s.slice(bestStart, bestStart + bestLen)}"`, ...vars },
      };
    };

    r.step(lineOf(code, "for (let center = 0"), `Try all ${2 * n - 1} middles — each letter, and each gap between two letters — and from each, grow outwards while the ends match. The widest growth anywhere is the answer.`, frame(-1, 0, {}));
    const expand = (l0: number, r0: number, kind: string, center: number) => {
      let left = l0;
      let right = r0;
      while (left >= 0 && right < n && s[left] === s[right]) {
        left--;
        right++;
      }
      const len = right - left - 1;
      if (r0 >= n) return;
      const grown = len > 0 ? `grows to **"${s.slice(left + 1, right)}"** (${len})` : "can't even start: the two middle letters differ";
      if (len > bestLen) {
        bestStart = left + 1;
        bestLen = len;
        r.step(lineOf(code, "bestLen = right - left - 1"), `${kind} centre ${center} ${grown} — the longest so far.`, frame(left, right, { center }));
      } else {
        r.step(lineOf(code, "while (left >= 0"), `${kind} centre ${center} ${grown}. Not longer than "${s.slice(bestStart, bestStart + bestLen)}".`, frame(left, right, { center }));
      }
    };
    for (let center = 0; center < n; center++) {
      expand(center, center, "Odd", center);
      expand(center, center + 1, "Even", center);
    }
    r.step(lineOf(code, "return s.slice"), `The longest palindrome is **"${s.slice(bestStart, bestStart + bestLen)}"**. 2n - 1 middles, each grown at most n / 2 times: **O(n²)** time, O(1) space.`, { ...frame(-1, 0, {}), done: true });
    return r.frames;
  },
};

export default program;
