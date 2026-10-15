import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function validPalindrome(s) {
  const isPal = (i, j) => {                  // is s[i..j] a palindrome?
    while (i < j) {
      if (s[i] !== s[j]) return false;
      i++;
      j--;
    }
    return true;
  };
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) {
      // One deletion allowed: drop the left character or the right one, and check the rest.
      return isPal(left + 1, right) || isPal(left, right - 1);
    }
    left++;
    right--;
  }
  return true;
}`;

const program: Program = {
  title: "Valid palindrome II (one deletion)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 14, hint: "lowercase letters, like abca" }],
  examples: [
    { label: "Example", input: { s: "abca" } },
    { label: "Delete on the right", input: { s: "eeeed" } },
    { label: "Two deletions needed", input: { s: "abc" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only, like abca."),
  run(input) {
    const s = [...(input.s as string)];
    const n = s.length;
    const r = recorder();
    const matched = new Set<number>();
    let skipped: number | null = null;

    const frame = (marks: Record<string, number | undefined>, hot: Record<number, CellTone> = {}) => {
      const tones: Record<number, CellTone> = {};
      matched.forEach((k) => (tones[k] = "done"));
      if (skipped !== null) tones[skipped] = "muted";
      Object.assign(tones, hot);
      return { arrays: [{ name: "s", values: s, tones, pointers: pointersAt(n, marks, { right: "tertiary", j: "tertiary" }) }], vars: marks };
    };

    const isPal = (i: number, j: number, which: string) => {
      const before = new Set(matched);
      while (i < j) {
        if (s[i] !== s[j]) {
          r.step(lineOf(code, "if (s[i] !== s[j]) return false"), `${which}: '${s[i]}' at ${i} and '${s[j]}' at ${j} differ, so this choice fails.`, frame({ i, j }, { [i]: "write", [j]: "write" }));
          matched.clear();
          before.forEach((k) => matched.add(k));
          return false;
        }
        matched.add(i);
        matched.add(j);
        r.step(lineOf(code, "if (s[i] !== s[j]) return false"), `${which}: '${s[i]}' and '${s[j]}' match.`, frame({ i, j }, { [i]: "success", [j]: "success" }));
        i++;
        j--;
      }
      return true;
    };

    let left = 0;
    let right = n - 1;
    r.step(lineOf(code, "let left = 0, right"), `Check from both ends as usual. The first mismatch is the only place a deletion can help — everything outside it already matches.`, frame({ left, right }));
    while (left < right) {
      if (s[left] !== s[right]) {
        r.step(
          lineOf(code, "if (s[left] !== s[right])"),
          `Mismatch: '${s[left]}' at ${left} and '${s[right]}' at ${right}. One of them must go. Try deleting the **left** one: is s[${left + 1}..${right}] a palindrome?`,
          frame({ left, right }, { [left]: "write", [right]: "write" })
        );
        skipped = left;
        if (isPal(left + 1, right, `Without s[${left}]`)) {
          r.step(lineOf(code, "return isPal(left + 1, right) || isPal(left, right - 1)"), `Deleting '${s[left]}' at ${left} leaves a palindrome: **true**.`, { ...frame({}), done: true });
          return r.frames;
        }
        skipped = right;
        r.step(
          lineOf(code, "return isPal(left + 1, right) || isPal(left, right - 1)"),
          `That failed. Try deleting the **right** one instead: is s[${left}..${right - 1}] a palindrome?`,
          frame({ left, right }, { [right]: "muted" })
        );
        const ok = isPal(left, right - 1, `Without s[${right}]`);
        r.step(
          lineOf(code, "return isPal(left + 1, right) || isPal(left, right - 1)"),
          ok ? `Deleting '${s[right]}' at ${right} leaves a palindrome: **true**.` : `Neither deletion works, and one deletion is all we get: **false**.`,
          { ...frame({}), done: true }
        );
        return r.frames;
      }
      matched.add(left);
      matched.add(right);
      r.step(lineOf(code, "if (s[left] !== s[right])"), `'${s[left]}' and '${s[right]}' match. Move inwards.`, frame({ left, right }, { [left]: "success", [right]: "success" }));
      left++;
      right--;
    }
    r.step(code.split("\n").length - 1, `No mismatch at all: it's already a palindrome, no deletion needed. **true**. At most about 2n comparisons: **O(n)**.`, { ...frame({}), done: true });
    return r.frames;
  },
};

export default program;
