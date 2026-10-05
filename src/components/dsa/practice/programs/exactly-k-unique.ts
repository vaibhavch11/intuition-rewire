import { mapView } from "../structures";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function countExactlyK(s, k) {
  return atMost(s, k) - atMost(s, k - 1);       // exactly k = at most k - at most (k - 1)
}

function atMost(s, k) {
  const freq = new Map();
  let left = 0, count = 0;
  for (let right = 0; right < s.length; right++) {
    freq.set(s[right], (freq.get(s[right]) ?? 0) + 1);
    while (freq.size > k) {
      const out = s[left++];
      freq.set(out, freq.get(out) - 1);
      if (freq.get(out) === 0) freq.delete(out);
    }
    count += right - left + 1;
  }
  return count;
}`;

const program: Program = {
  title: "Exactly k unique = at most k − at most (k − 1)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 10, hint: "lowercase letters, like aabcb" },
    { key: "k", label: "k", kind: "number", min: 1, max: 26 },
  ],
  examples: [
    { label: "aabcb, k = 2", input: { s: "aabcb", k: 2 } },
    { label: "aabcd, k = 3", input: { s: "aabcd", k: 3 } },
    { label: "abc, k = 1", input: { s: "abc", k: 1 } },
  ],
  check(input) {
    return /^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only, like aabcb.";
  },
  run(input) {
    const chars = [...(input.s as string)];
    const k = input.k as number;
    const n = chars.length;
    const r = recorder();
    const totals: number[] = [];

    r.step(
      2,
      `Counting **exactly ${k}** directly is awkward: a window with exactly ${k} kinds can't simply grow or shrink. But "at most" counts are easy, and every substring with at most ${k} kinds has **either exactly ${k}** or at most ${k - 1}. So exactly ${k} = atMost(${k}) − atMost(${k - 1}).`,
      { arrays: [{ name: "s", values: chars }], vars: { k } }
    );

    for (const limit of [k, k - 1]) {
      const freq = new Map<string, number>();
      let left = 0;
      let count = 0;
      for (let right = 0; right < n; right++) {
        freq.set(chars[right], (freq.get(chars[right]) ?? 0) + 1);
        while (freq.size > limit) {
          const out = chars[left++];
          const rest = (freq.get(out) as number) - 1;
          if (rest === 0) freq.delete(out);
          else freq.set(out, rest);
        }
        const added = right - left + 1;
        count += added;
        r.step(
          15,
          `atMost(${limit}), R = ${right}: the window "${chars.slice(left, right + 1).join("")}" has ≤ ${limit} ${limit === 1 ? "kind" : "kinds"}, so ${added === 1 ? "1 substring ending here counts" : `${added} substrings ending here count`}. Running total ${count}.`,
          {
            arrays: [
              {
                name: "s",
                values: chars,
                tones: toneRange(left, right, "primary"),
                pointers: pointersAt(n, left === right ? { "L=R": left } : left > right ? { R: right } : { L: left, R: right }),
              },
            ],
            maps: [mapView("freq", freq, { keyLabel: "char", valueLabel: "count" })],
            vars: { pass: `atMost(${limit})`, count, ...(totals.length ? { [`atMost(${k})`]: totals[0] } : {}) },
          }
        );
      }
      totals.push(count);
      r.step(17, `atMost(s, ${limit}) = **${count}**: substrings with ${limit === 0 ? "no characters at all — none" : `at most ${limit} different ${limit === 1 ? "character" : "characters"}`}.`, {
        arrays: [{ name: "s", values: chars }],
        vars: { [`atMost(${limit})`]: count },
      });
    }

    r.step(2, `exactly ${k} = atMost(${k}) − atMost(${k - 1}) = ${totals[0]} − ${totals[1]} = **${totals[0] - totals[1]}**. Two linear passes: still O(n).`, {
      arrays: [{ name: "s", values: chars }],
      vars: { [`atMost(${k})`]: totals[0], [`atMost(${k - 1})`]: totals[1], exactly: totals[0] - totals[1] },
      done: true,
    });
    return r.frames;
  },
};

export default program;
