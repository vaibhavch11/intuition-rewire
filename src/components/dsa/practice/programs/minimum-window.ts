import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function minWindow(s, t) {
  const need = new Map();                            // char -> how many more the window needs
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  let missing = t.length;                            // characters of t not yet covered
  let left = 0, bestStart = 0, bestLen = Infinity;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (need.has(ch)) {
      if (need.get(ch) > 0) missing--;               // this one was still needed
      need.set(ch, need.get(ch) - 1);                // (below 0 means a spare copy)
    }
    while (missing === 0) {                          // the window covers t: try to shrink it
      if (right - left + 1 < bestLen) {
        bestStart = left;
        bestLen = right - left + 1;
      }
      const out = s[left++];
      if (need.has(out)) {
        need.set(out, need.get(out) + 1);
        if (need.get(out) > 0) missing++;            // dropped a character we still needed
      }
    }
  }
  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}`;

const program: Program = {
  title: "Minimum window substring (grow, then shrink)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 16, hint: "letters, like ADOBECODEBANC" },
    { key: "t", label: "t", kind: "text", maxLength: 5, hint: "letters, like ABC" },
  ],
  examples: [
    { label: "Example", input: { s: "ADOBECODEBANC", t: "ABC" } },
    { label: "Needs two a's", input: { s: "baacab", t: "aab" } },
    { label: "Impossible", input: { s: "abc", t: "abd" } },
  ],
  check: (input) => (/^[A-Za-z]+$/.test(input.s as string) && /^[A-Za-z]+$/.test(input.t as string) ? null : "s and t: use letters only."),
  run(input) {
    const s = input.s as string;
    const t = input.t as string;
    const n = s.length;
    const need = new Map<string, number>();
    for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
    let missing = t.length;
    let left = 0;
    let bestStart = 0;
    let bestLen = Infinity;
    const r = recorder();

    const frame = (right: number, hot: CellTone = "tertiary") => {
      const tones: Record<number, CellTone> = {};
      if (bestLen !== Infinity) for (let x = bestStart; x < bestStart + bestLen; x++) tones[x] = "done";
      for (let x = left; x <= right; x++) tones[x] = hot;
      const keys = [...need.keys()];
      return {
        arrays: [{ name: "s (green: best window so far)", values: [...s], tones, pointers: pointersAt(n, { left, right: right >= 0 ? right : undefined }, { right: "tertiary" }) }],
        maps: [
          {
            name: "need (still missing; below 0 = spare)",
            entries: keys.map((ch) => [ch, need.get(ch)!] as [string, number]),
            keyLabel: "char",
            valueLabel: "need",
            tones: Object.fromEntries(keys.flatMap((ch, i) => (need.get(ch)! <= 0 ? [[i, "done" as const]] : []))),
          },
        ],
        vars: { missing, best: bestLen === Infinity ? "none yet" : `"${s.slice(bestStart, bestStart + bestLen)}"` },
      };
    };

    r.step(lineOf(code, "let missing = t.length"), `\`need\` counts how many of each character of t the window still lacks; \`missing\` is their total. **Grow** the window to the right until missing hits 0 — it then covers t — and **shrink** it from the left for as long as it still does, recording the smallest.`, frame(-1));
    for (let right = 0; right < n; right++) {
      const ch = s[right];
      if (need.has(ch)) {
        const wasNeeded = need.get(ch)! > 0;
        if (wasNeeded) missing--;
        need.set(ch, need.get(ch)! - 1);
        r.step(lineOf(code, "if (need.get(ch) > 0) missing--"), wasNeeded ? `Take in '${ch}': it was needed. missing = ${missing}.` : `Take in '${ch}': it's in t, but the window already has enough — a spare.`, frame(right));
      } else {
        r.step(lineOf(code, "for (let right = 0"), `Take in '${ch}': not in t, it just widens the window.`, frame(right));
      }
      while (missing === 0) {
        if (right - left + 1 < bestLen) {
          bestStart = left;
          bestLen = right - left + 1;
          r.step(lineOf(code, "bestLen = right - left + 1"), `The window "${s.slice(left, right + 1)}" covers all of t. It's the smallest so far (${bestLen}). Now try dropping its left end.`, frame(right, "success"));
        }
        const out = s[left++];
        if (need.has(out)) {
          need.set(out, need.get(out)! + 1);
          if (need.get(out)! > 0) {
            missing++;
            r.step(lineOf(code, "dropped a character we still needed"), `Drop '${out}' from the left — it was needed, so the window no longer covers t (missing = ${missing}). Back to growing.`, frame(right, "primary"));
            continue;
          }
        }
        r.step(lineOf(code, "const out = s[left++]"), `Drop '${out}' from the left: the window still covers t.`, frame(right, "primary"));
      }
    }
    const answer = bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
    r.step(
      lineOf(code, `return bestLen === Infinity`),
      bestLen === Infinity ? `No window ever covered t: the answer is **""**.` : `The smallest window is **"${answer}"**. Each character entered and left the window at most once: **O(n + m)**.`,
      { ...frame(-1), done: true }
    );
    return r.frames;
  },
};

export default program;
