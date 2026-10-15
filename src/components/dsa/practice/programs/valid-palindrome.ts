import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function isPalindrome(s) {
  const ok = (ch) => /[a-z0-9]/i.test(ch);   // letters and digits count; the rest is skipped
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (!ok(s[left])) { left++; continue; }   // skip spaces and punctuation
    if (!ok(s[right])) { right--; continue; }
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;   // a mismatch
    left++;
    right--;
  }
  return true;
}`;

const ok = (ch: string) => /[a-z0-9]/i.test(ch);

const program: Program = {
  title: "Valid palindrome (two pointers, skipping)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 24, hint: "any text, like A man, a plan" }],
  examples: [
    { label: "Example", input: { s: "No lemon, no melon" } },
    { label: "Not a palindrome", input: { s: "race a car" } },
    { label: "Only punctuation", input: { s: ", .!" } },
  ],
  check: (input) => ((input.s as string).length > 0 ? null : "s: type at least one character."),
  run(input) {
    const s = [...(input.s as string)];
    const n = s.length;
    const r = recorder();
    let left = 0;
    let right = n - 1;
    const matched = new Set<number>();

    const frame = (hot: CellTone | null = null) => {
      const tones: Record<number, CellTone> = {};
      s.forEach((ch, k) => {
        if (!ok(ch)) tones[k] = "muted";
        if (matched.has(k)) tones[k] = "done";
      });
      if (hot && left < n) tones[left] = hot;
      if (hot && right >= 0) tones[right] = hot;
      return {
        arrays: [{ name: "s", values: s.map((c) => (c === " " ? "␣" : c)), tones, pointers: pointersAt(n, { left, right }, { right: "tertiary" }) }],
        vars: { left, right },
      };
    };

    r.step(
      lineOf(code, "let left = 0"),
      `Only letters and digits count, and case doesn't matter. Instead of building a cleaned copy, walk two pointers inwards and **skip** anything else on the way (greyed out).`,
      frame()
    );
    while (left < right) {
      if (!ok(s[left])) {
        r.step(lineOf(code, "if (!ok(s[left]))"), `'${s[left]}' at ${left} isn't a letter or digit: skip it.`, frame("primary"));
        left++;
        continue;
      }
      if (!ok(s[right])) {
        r.step(lineOf(code, "if (!ok(s[right]))"), `'${s[right]}' at ${right} isn't a letter or digit: skip it.`, frame("primary"));
        right--;
        continue;
      }
      const a = s[left].toLowerCase();
      const b = s[right].toLowerCase();
      if (a !== b) {
        r.step(
          lineOf(code, "return false;   // a mismatch"),
          `'${s[left]}' and '${s[right]}' differ (ignoring case). A palindrome needs every mirrored pair to match, so the answer is **false**.`,
          { ...frame("write"), done: true }
        );
        return r.frames;
      }
      matched.add(left);
      matched.add(right);
      r.step(lineOf(code, "if (s[left].toLowerCase() !== s[right].toLowerCase())"), `'${s[left]}' and '${s[right]}' match. Move both pointers inwards.`, frame("success"));
      left++;
      right--;
    }
    r.step(
      lineOf(code, "return true"),
      `The pointers have met without a mismatch: the answer is **true**. Each character was looked at once: **O(n) time, O(1) space**.`,
      { ...frame(), done: true }
    );
    return r.frames;
  },
};

export default program;
