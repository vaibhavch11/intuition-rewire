import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function countLetters(s) {
  const counts = new Array(26).fill(0);     // one counter per letter: index 0 is 'a', 25 is 'z'
  for (const ch of s) {
    counts[ch.charCodeAt(0) - 97]++;        // 'a' is 97, so 'a' -> 0, 'b' -> 1, ...
  }
  return counts;
}`;

const program: Program = {
  title: "Counting letters with an array of 26",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 14, hint: "lowercase letters, like banana" }],
  examples: [
    { label: "banana", input: { s: "banana" } },
    { label: "hello", input: { s: "hello" } },
    { label: "abcxyz", input: { s: "abcxyz" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters a to z only, like banana."),
  run(input) {
    const s = input.s as string;
    const chars = [...s];
    const counts = new Array(26).fill(0);
    const r = recorder();

    const frame = (i: number | null, index: number | null) => {
      const tones: Record<number, CellTone> = {};
      counts.forEach((c, k) => c > 0 && (tones[k] = "done"));
      if (index !== null) tones[index] = "write";
      return {
        arrays: [
          { name: "s", values: chars, tones: i === null ? toneRange(0, chars.length - 1, "done") : toneRange(0, i - 1, "done", { [i]: "primary" }), pointers: i === null ? {} : pointersAt(chars.length, { ch: i }) },
          { name: "counts (index 0 = 'a', 1 = 'b', … 25 = 'z')", values: counts, tones, pointers: index === null ? {} : { [index]: [{ label: chars[i ?? 0], tone: "primary" as const }] } },
        ],
      };
    };

    r.step(2, `Make 26 counters, all 0. Counter 0 is for 'a', counter 1 for 'b', and so on up to 25 for 'z'. No hash map needed: the letter itself will tell us which counter to use.`, frame(null, null));
    chars.forEach((ch, i) => {
      const code = ch.charCodeAt(0);
      const index = code - 97;
      counts[index]++;
      r.step(
        4,
        `'${ch}' has code ${code}. ${code} - 97 = **${index}**, so add one to counter ${index}: it is now ${counts[index]}.`,
        { ...frame(i, index), vars: { ch, code, index } }
      );
    });
    const used = counts.flatMap((c, k) => (c > 0 ? [`${String.fromCharCode(97 + k)}: ${c}`] : []));
    r.step(
      6,
      `Done in one pass over ${chars.length} letter${chars.length === 1 ? "" : "s"}: ${used.join(", ")}. The array always has 26 slots, so the extra space is **O(1)** however long the string gets.`,
      { ...frame(null, null), done: true }
    );
    return r.frames;
  },
};

export default program;
