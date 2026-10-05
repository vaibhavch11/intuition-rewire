import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function longestKSubstr(s, k) {
  const freq = new Map();                       // char -> count inside the window
  let left = 0, best = -1;
  for (let right = 0; right < s.length; right++) {
    freq.set(s[right], (freq.get(s[right]) ?? 0) + 1);
    while (freq.size > k) {                     // too many kinds: shrink from the left
      const out = s[left++];
      freq.set(out, freq.get(out) - 1);
      if (freq.get(out) === 0) freq.delete(out);
    }
    if (freq.size === k) best = Math.max(best, right - left + 1);
  }
  return best;
}`;

const program: Program = {
  title: "Longest substring with k unique characters",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 14, hint: "lowercase letters, like aabacbebebe" },
    { key: "k", label: "k", kind: "number", min: 1, max: 26 },
  ],
  examples: [
    { label: "Example", input: { s: "aabacbebebe", k: 3 } },
    { label: "Not enough kinds", input: { s: "aaaa", k: 2 } },
    { label: "k = 1", input: { s: "abbbcc", k: 1 } },
  ],
  check(input) {
    return /^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only, like aabacbebebe.";
  },
  run(input) {
    const chars = [...(input.s as string)];
    const k = input.k as number;
    const n = chars.length;
    const r = recorder();
    const freq = new Map<string, number>();
    let left = 0;
    let best = -1;
    let bestFrom = 0;

    const view = (right: number, extra: Record<number, CellTone> = {}) => ({
      name: "s",
      values: chars,
      tones: { ...toneRange(left, right, "primary"), ...extra },
      pointers: pointersAt(n, left === right ? { "L=R": left } : { L: left, R: right }),
    });
    const freqView = (marks: MapMark<string>[] = []) => mapView("freq", freq, { keyLabel: "char", valueLabel: "count", marks });

    r.step(2, `Find the longest substring with **exactly ${k}** different characters. Slide a window: grow it on the right, and whenever it holds more than ${k} kinds, shrink it from the left. The map counts each character inside the window, so its **size** is the number of kinds.`, {
      arrays: [{ name: "s", values: chars }],
      maps: [freqView()],
      vars: { k, best },
    });

    for (let right = 0; right < n; right++) {
      const ch = chars[right];
      const before = freq.get(ch);
      freq.set(ch, (before ?? 0) + 1);
      const entered = `'${ch}' enters the window${before === undefined ? " — a new kind" : ""}`;
      const enterMark: MapMark<string> = [ch, "write", before === undefined ? "new" : "+1"];
      const shrinks = freq.size > k;

      if (shrinks) {
        r.step(5, `${entered}: now ${freq.size} kinds, more than ${k}. The window has to shrink from the left.`, {
          arrays: [view(right, { [right]: "write" })],
          maps: [freqView([enterMark])],
          vars: { L: left, R: right, kinds: freq.size, best },
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
          `Drop ${dropped.map((c) => `'${c}'`).join(", ")} from the left. Removing the last '${dropped[dropped.length - 1]}' deletes its key, so the window is back to ${freq.size} ${freq.size === 1 ? "kind" : "kinds"}: L = ${left}.`,
          { arrays: [view(right, Object.fromEntries(dropped.map((_, t) => [from + t, "muted" as CellTone])))], maps: [freqView()], vars: { L: left, R: right, kinds: freq.size, best } }
        );
      }

      if (freq.size === k) {
        const len = right - left + 1;
        const better = len > best;
        if (better) {
          best = len;
          bestFrom = left;
        }
        r.step(
          11,
          `${shrinks ? "" : `${entered}. `}Exactly ${k} ${k === 1 ? "kind" : "kinds"} in "${chars.slice(left, right + 1).join("")}" — length ${len}${better ? `, best = **${best}**.` : `; best stays ${best}.`}`,
          { arrays: [view(right, shrinks ? {} : { [right]: "write" })], maps: [freqView(shrinks ? [] : [enterMark])], vars: { L: left, R: right, kinds: freq.size, best } }
        );
      } else {
        r.step(5, `${entered}: ${freq.size} ${freq.size === 1 ? "kind" : "kinds"} so far, fewer than ${k} — nothing to record yet.`, {
          arrays: [view(right, { [right]: "write" })],
          maps: [freqView([enterMark])],
          vars: { L: left, R: right, kinds: freq.size, best },
        });
      }
    }

    r.step(
      13,
      best === -1
        ? `The whole string has only ${freq.size} different ${freq.size === 1 ? "character" : "characters"}, so no substring has exactly ${k}: the answer is **−1**.`
        : `The longest substring with exactly ${k} unique ${k === 1 ? "character" : "characters"} is "${chars.slice(bestFrom, bestFrom + best).join("")}", length **${best}**. Each character entered and left the window at most once: O(n).`,
      {
        arrays: [{ name: "s", values: chars, tones: best === -1 ? {} : toneRange(bestFrom, bestFrom + best - 1, "success") }],
        maps: [freqView()],
        vars: { best },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
