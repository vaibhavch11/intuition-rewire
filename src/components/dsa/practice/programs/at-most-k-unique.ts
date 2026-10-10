import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function countAtMostK(s, k) {
  const freq = new Map();                       // char -> count inside the window
  let left = 0, count = 0;
  for (let right = 0; right < s.length; right++) {
    freq.set(s[right], (freq.get(s[right]) ?? 0) + 1);
    while (freq.size > k) {                     // too many kinds: shrink from the left
      const out = s[left++];
      freq.set(out, freq.get(out) - 1);
      if (freq.get(out) === 0) freq.delete(out);
    }
    count += right - left + 1;                  // every start from left to right works
  }
  return count;
}`;

const program: Program = {
  title: "Count substrings with at most k unique characters",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 12, hint: "lowercase letters, like aabcb" },
    { key: "k", label: "k", kind: "number", min: 0, max: 26 },
  ],
  examples: [
    { label: "aabcb, k = 2", input: { s: "aabcb", k: 2 } },
    { label: "aabcd, k = 2", input: { s: "aabcd", k: 2 } },
    { label: "k = 1", input: { s: "aaab", k: 1 } },
  ],
  check(input) {
    return /^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only, like aabcb.";
  },
  run(input) {
    const chars = [...(input.s as string)];
    const k = input.k as number;
    const n = chars.length;
    const r = recorder();
    const freq = new Map<string, number>();
    let left = 0;
    let count = 0;

    const view = (right: number, extra: Record<number, CellTone> = {}) => ({
      name: "s",
      values: chars,
      tones: { ...toneRange(left, right, "primary"), ...extra },
      pointers: pointersAt(n, left === right ? { "L=R": left } : left > right ? { R: right } : { L: left, R: right }),
    });
    const freqView = (marks: MapMark<string>[] = []) => mapView("freq", freq, { keyLabel: "char", valueLabel: "count", marks });

    r.step(2, `Count every substring with **at most ${k}** different characters. For each right end R, shrink the window until it has ≤ ${k} kinds. Then every substring that **ends at R** and starts anywhere from L to R also has ≤ ${k} kinds — that is R − L + 1 substrings at once.`, {
      arrays: [{ name: "s", values: chars }],
      maps: [freqView()],
      vars: { k, count },
    });

    for (let right = 0; right < n; right++) {
      const ch = chars[right];
      const before = freq.get(ch);
      freq.set(ch, (before ?? 0) + 1);
      const entered = `'${ch}' enters the window${before === undefined ? " — a new kind" : ""}`;
      const enterMark: MapMark<string> = [ch, "write", before === undefined ? "new" : "+1"];
      const shrinks = freq.size > k;

      if (shrinks) {
        r.step(5, `${entered}: now ${freq.size} kinds, more than ${k}. Shrink from the left.`, {
          arrays: [view(right, { [right]: "write" })],
          maps: [freqView([enterMark])],
          vars: { L: left, R: right, kinds: freq.size, count },
        });
        const from = left;
        while (freq.size > k) {
          const out = chars[left++];
          const remaining = (freq.get(out) as number) - 1;
          if (remaining === 0) freq.delete(out);
          else freq.set(out, remaining);
        }
        const dropped = chars.slice(from, left);
        r.step(
          9,
          `Drop ${dropped.map((c) => `'${c}'`).join(", ")} from the left${k === 0 ? "" : ` until a kind disappears: ${freq.size} ${freq.size === 1 ? "kind" : "kinds"} left`}. L = ${left}.`,
          { arrays: [view(right, Object.fromEntries(dropped.map((_, t) => [from + t, "muted" as CellTone])))], maps: [freqView()], vars: { L: left, R: right, kinds: freq.size, count } }
        );
      }

      const added = right - left + 1;
      count += added;
      const listed = Array.from({ length: added }, (_, t) => `"${chars.slice(left + t, right + 1).join("")}"`);
      r.step(
        11,
        added === 0
          ? `Even "${ch}" alone has more than ${k} kinds, so no substring ends here. count stays ${count}.`
          : `${shrinks ? "" : `${entered} (${freq.size} ${freq.size === 1 ? "kind" : "kinds"}, fine). `}The ${added} substring${added === 1 ? "" : "s"} ending at R that start inside the window: ${listed.join(", ")}. count += ${added} → **${count}**.`,
        {
          arrays: [view(right, added === 0 ? { [right]: "muted" } : shrinks ? {} : { [right]: "write" })],
          maps: [freqView(shrinks ? [] : [enterMark])],
          vars: { L: left, R: right, kinds: freq.size, count },
        }
      );
    }

    r.step(13, `**${count}** substrings have at most ${k} different characters (out of ${(n * (n + 1)) / 2} in total). Each character entered and left the window at most once: O(n).`, {
      arrays: [{ name: "s", values: chars }],
      maps: [freqView()],
      vars: { count, total: (n * (n + 1)) / 2 },
      done: true,
    });
    return r.frames;
  },
};

export default program;
