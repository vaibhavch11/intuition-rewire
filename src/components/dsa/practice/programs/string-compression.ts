import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function compress(chars) {
  let write = 0, read = 0;
  while (read < chars.length) {
    const ch = chars[read];
    let run = 0;
    while (read < chars.length && chars[read] === ch) {   // measure the run of ch
      read++;
      run++;
    }
    chars[write++] = ch;                        // write the character once...
    if (run > 1) {
      for (const digit of String(run)) chars[write++] = digit;   // ...then its count, digit by digit
    }
  }
  return write;                                 // the compressed length
}`;

const program: Program = {
  title: "String compression in place (read and write pointers)",
  code,
  fields: [{ key: "chars", label: "chars", kind: "text", maxLength: 16, hint: "letters, like aabbccc" }],
  examples: [
    { label: "Example", input: { chars: "aabbccc" } },
    { label: "A run of 12", input: { chars: "abbbbbbbbbbbbc" } },
    { label: "No runs", input: { chars: "abc" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.chars as string) ? null : "chars: use lowercase letters only, like aabbccc."),
  run(input) {
    const chars = [...(input.chars as string)];
    const n = chars.length;
    const r = recorder();
    let write = 0;
    let read = 0;

    const frame = (runStart: number | null) => {
      const tones: Record<number, CellTone> = {};
      for (let k = 0; k < write; k++) tones[k] = "done";
      if (runStart !== null) for (let k = runStart; k < read; k++) tones[k] = k < write ? "done" : "tertiary";
      return {
        arrays: [{ name: "chars (green: written so far)", values: chars, tones, pointers: pointersAt(n, { write, read }, { read: "tertiary" }) }],
        vars: { write, read },
      };
    };

    r.step(lineOf(code, "let write = 0, read = 0"), `Two pointers in one array. **read** scans ahead to measure each run of equal letters; **write** puts the compressed form back at the front. Writing never overtakes reading, because "aa" → "a2" is never longer than the run it replaces.`, frame(null));
    while (read < n) {
      const ch = chars[read];
      const start = read;
      let run = 0;
      while (read < n && chars[read] === ch) {
        read++;
        run++;
      }
      r.step(lineOf(code, "measure the run of ch"), `read moves past a run of **${run}** '${ch}'${run === 1 ? "" : "s"} (positions ${start}–${read - 1}).`, { ...frame(start), vars: { ch, run, write, read } });
      chars[write++] = ch;
      const digits = run > 1 ? String(run) : "";
      for (const digit of digits) chars[write++] = digit;
      r.step(
        lineOf(code, run > 1 ? "for (const digit of String(run))" : "chars[write++] = ch"),
        run > 1
          ? `Write '${ch}' then the count ${run}${digits.length > 1 ? `, one digit per cell: ${[...digits].map((d) => `'${d}'`).join(", ")}` : ""}. write is now ${write}.`
          : `A run of one is written as just '${ch}' — no count. write is now ${write}.`,
        { ...frame(null), vars: { ch, run, write, read } }
      );
    }
    r.step(
      lineOf(code, "return write"),
      `Done. The first **${write}** cells hold the compressed form "${chars.slice(0, write).join("")}"; anything after them is left over and ignored. One pass, no extra array: **O(n) time, O(1) space**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
