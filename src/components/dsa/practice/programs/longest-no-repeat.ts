import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function lengthOfLongestSubstring(s) {
  const last = new Map();                       // char -> last index it was seen
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) {
      left = last.get(ch) + 1;                  // jump just past the earlier copy
    }
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`;

const program: Program = {
  title: "Longest substring without repeating characters",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 16, hint: "letters and digits, like abcabcbb" }],
  examples: [
    { label: "abcabcbb", input: { s: "abcabcbb" } },
    { label: "pwwkew", input: { s: "pwwkew" } },
    { label: "Stale entry", input: { s: "abba" } },
    { label: "bbbbb", input: { s: "bbbbb" } },
  ],
  check(input) {
    return /^[a-z0-9]+$/i.test(input.s as string) ? null : "s: use letters and digits only, like abcabcbb.";
  },
  run(input) {
    const chars = [...(input.s as string)];
    const n = chars.length;
    const r = recorder();
    const last = new Map<string, number>();
    let left = 0;
    let best = 0;
    let bestFrom = 0;

    const view = (right: number, extra: Record<number, CellTone> = {}) => ({
      name: "s",
      values: chars,
      tones: { ...toneRange(left, right, "primary"), ...extra },
      pointers: pointersAt(n, left === right ? { "L=R": left } : { L: left, R: right }),
    });
    const lastView = (marks: MapMark<string>[] = []) => mapView("last", last, { keyLabel: "char", valueLabel: "index", marks });

    r.step(2, `Grow a window [L..R] that never holds a repeated character. The map remembers the **last index** of every character, so on a repeat L can jump straight past the earlier copy instead of creeping forward one step at a time.`, {
      arrays: [{ name: "s", values: chars }],
      maps: [lastView()],
      vars: { left, best },
    });

    for (let right = 0; right < n; right++) {
      const ch = chars[right];
      const prev = last.get(ch);
      const inWindow = prev !== undefined && prev >= left;
      // Seen before but left of L: an old copy that no longer matters ("abba").
      const stale = prev !== undefined && !inWindow;
      if (inWindow) {
        left = prev + 1;
        r.step(
          7,
          `'${ch}' is already in the window, at index ${prev}. Any window containing both copies is invalid, so L jumps to ${prev} + 1 = **${left}**.`,
          { arrays: [view(right, { [prev]: "tertiary" })], maps: [lastView([[ch, "tertiary", "repeat"]])], vars: { L: left, R: right, best } }
        );
      }
      last.set(ch, right);
      const len = right - left + 1;
      const better = len > best;
      if (better) {
        best = len;
        bestFrom = left;
      }
      r.step(
        10,
        `${stale ? `'${ch}' was seen at index ${prev}, but that is left of L = ${left} — outside the window — so it doesn't count. ` : ""}Window [${left}..${right}] = "${chars.slice(left, right + 1).join("")}" has no repeats, length ${len}${better ? ` — best = **${best}**.` : `; best stays ${best}.`}`,
        { arrays: [view(right)], maps: [lastView([[ch, "write", "R"]])], vars: { L: left, R: right, best } }
      );
    }

    r.step(12, `The longest substring without repeats is "${chars.slice(bestFrom, bestFrom + best).join("")}", length **${best}**. L and R each only move forward, so this is **O(n)**.`, {
      arrays: [{ name: "s", values: chars, tones: toneRange(bestFrom, bestFrom + best - 1, "success") }],
      maps: [lastView()],
      vars: { best },
      done: true,
    });
    return r.frames;
  },
};

export default program;
