import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function countSubstrings(s) {
  let count = 0;
  const expand = (left, right) => {          // grow outwards while the ends match
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count++;                               // s[left..right] is a palindrome
      left--;
      right++;
    }
  };
  for (let center = 0; center < s.length; center++) {
    expand(center, center);                  // odd length: one middle letter
    expand(center, center + 1);              // even length: the gap after it
  }
  return count;
}`;

const program: Program = {
  title: "Count palindromic substrings (expand around each centre)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 12, hint: "lowercase letters, like aaa" }],
  examples: [
    { label: "Example", input: { s: "abba" } },
    { label: "All the same", input: { s: "aaa" } },
    { label: "No repeats", input: { s: "abc" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only, like abba."),
  run(input) {
    const s = input.s as string;
    const n = s.length;
    const found: string[] = [];
    let count = 0;
    const r = recorder();

    const frame = (left: number, right: number, hot: CellTone, vars: Record<string, unknown>) => {
      const tones: Record<number, CellTone> = {};
      for (let k = Math.max(left, 0); k <= Math.min(right, n - 1); k++) tones[k] = hot;
      if (hot === "write") {
        // A stop: the inside is the last palindrome found; only the two ends failed.
        for (let k = left + 1; k <= right - 1; k++) tones[k] = "success";
        if (left >= 0 && right < n) tones[left] = tones[right] = "write";
      }
      return {
        arrays: [
          { name: "s", values: [...s], tones, pointers: pointersAt(n, { left: left >= 0 ? left : undefined, right: right < n ? right : undefined }, { right: "tertiary" }) },
          { name: "palindromes found", values: [...found] },
        ],
        vars: { count, ...vars },
      };
    };

    r.step(lineOf(code, "for (let center = 0"), `Every palindrome mirrors around a **middle** — a letter (odd length) or the gap between two letters (even length). That's 2n - 1 = ${2 * n - 1} possible middles. From each one, grow outwards while the two ends match; every step that matches is one more palindrome.`, frame(-1, -2, "idle", {}));
    const expand = (l0: number, r0: number, kind: string, center: number) => {
      let left = l0;
      let right = r0;
      while (left >= 0 && right < n && s[left] === s[right]) {
        count++;
        found.push(s.slice(left, right + 1));
        r.step(lineOf(code, "count++"), `${kind} centre ${center}: s[${left}..${right}] = **"${s.slice(left, right + 1)}"** reads the same both ways. count = ${count}. Step both ends outwards.`, frame(left, right, "success", { center }));
        left--;
        right++;
      }
      if (r0 < n) {
        const why = left < 0 || right >= n ? "an end has run off the string" : `'${s[left]}' ≠ '${s[right]}'`;
        r.step(lineOf(code, "while (left >= 0"), `${kind} centre ${center}: stop — ${why}. No longer palindrome has this middle.`, frame(left, right, "write", { center }));
      }
    };
    for (let center = 0; center < n; center++) {
      expand(center, center, "Odd", center);
      expand(center, center + 1, "Even", center);
    }
    r.step(lineOf(code, "return count"), `All ${2 * n - 1} middles tried: **${count}** palindromic substrings. Each expansion is at most n / 2 steps: **O(n²)** time, O(1) space.`, { ...frame(-1, -2, "idle", {}), done: true });
    return r.frames;
  },
};

export default program;
