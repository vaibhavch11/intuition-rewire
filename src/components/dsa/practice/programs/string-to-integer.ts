import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function myAtoi(s) {
  const MAX = 2147483647, MIN = -2147483648;
  let i = 0;
  while (i < s.length && s[i] === " ") i++;          // 1. skip leading spaces
  let sign = 1;
  if (s[i] === "+" || s[i] === "-") {                // 2. an optional sign
    if (s[i] === "-") sign = -1;
    i++;
  }
  let value = 0;
  while (i < s.length && s[i] >= "0" && s[i] <= "9") {   // 3. digits, until anything else
    const d = s.charCodeAt(i) - 48;
    // Would value * 10 + d pass MAX? Check first, so nothing ever overflows.
    if (value > Math.floor((MAX - d) / 10)) return sign === 1 ? MAX : MIN;
    value = value * 10 + d;
    i++;
  }
  return sign * value;
}`;

const program: Program = {
  title: "String to integer (atoi)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 20, hint: "text like   -42abc" }],
  examples: [
    { label: "Example", input: { s: "   -042abc" } },
    { label: "Too big", input: { s: "+91283472332" } },
    { label: "Words first", input: { s: "words and 987" } },
  ],
  check: (input) => ((input.s as string).length > 0 ? null : "s: type at least one character."),
  run(input) {
    const raw = input.s as string;
    const s = [...raw];
    const n = s.length;
    const MAX = 2147483647;
    const MIN = -2147483648;
    const r = recorder();
    let i = 0;
    let sign = 1;
    let value = 0;
    const tones: Record<number, CellTone> = {};

    const frame = (hot: CellTone | null = null) => ({
      arrays: [{ name: "s", values: s.map((c) => (c === " " ? "␣" : c)), tones: hot && i < n ? { ...tones, [i]: hot } : { ...tones }, pointers: pointersAt(n, { i }) }],
      vars: { sign, value },
    });

    r.step(lineOf(code, "let i = 0"), `Read the string left to right in three stages — **spaces**, then an optional **sign**, then **digits** — and stop at the first character that doesn't fit.`, frame("primary"));
    const spaceStart = i;
    while (i < n && s[i] === " ") tones[i++] = "muted";
    if (i > spaceStart) r.step(lineOf(code, "1. skip leading spaces"), `Skip ${i - spaceStart} leading space${i - spaceStart === 1 ? "" : "s"}.`, frame("primary"));
    if (s[i] === "+" || s[i] === "-") {
      if (s[i] === "-") sign = -1;
      tones[i] = "tertiary";
      r.step(lineOf(code, "2. an optional sign"), `'${s[i]}' sets the sign to ${sign}.`, frame());
      i++;
    }
    let digits = 0;
    while (i < n && s[i] >= "0" && s[i] <= "9") {
      const d = s[i].charCodeAt(0) - 48;
      if (value > Math.floor((MAX - d) / 10)) {
        tones[i] = "write";
        r.step(
          lineOf(code, "return sign === 1 ? MAX : MIN"),
          `${value} × 10 + ${d} would be more than ${MAX}, the largest 32-bit integer. Clamp: the answer is **${sign === 1 ? MAX : MIN}**.`,
          { ...frame(), done: true }
        );
        return r.frames;
      }
      value = value * 10 + d;
      tones[i] = "done";
      digits++;
      r.step(lineOf(code, "value = value * 10 + d"), `Digit '${s[i]}': shift the number one place left and add it — value = ${value}.`, frame());
      i++;
    }
    if (i < n) {
      tones[i] = "write";
      r.step(lineOf(code, "3. digits, until anything else"), digits === 0 ? `'${s[i]}' isn't a digit, and no digits came before it: there is no number here.` : `'${s[i]}' isn't a digit: stop. Everything after it is ignored.`, frame());
    }
    const result = sign * value || 0;
    r.step(
      lineOf(code, "return sign * value"),
      `The answer is ${sign === -1 && value !== 0 ? `-1 × ${value} = ` : ""}**${result}**. One pass over the string: **O(n)** time, O(1) space.`,
      { ...frame(), done: true }
    );
    return r.frames;
  },
};

export default program;
