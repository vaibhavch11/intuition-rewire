import { lineOf } from "../graphs";
import { recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function numDecodings(s) {
  const n = s.length;
  const ways = new Array(n + 1).fill(0);         // ways[i]: decodings of the first i digits
  ways[0] = 1;                                   // the empty prefix
  for (let i = 1; i <= n; i++) {
    if (s[i - 1] !== "0") ways[i] += ways[i - 1];             // last letter: one digit, 1-9
    const two = i >= 2 ? Number(s.slice(i - 2, i)) : 0;
    if (two >= 10 && two <= 26) ways[i] += ways[i - 2];       // last letter: two digits, 10-26
  }
  return ways[n];
}`;

const program: Program = {
  title: "Decode ways: one digit or two",
  code,
  fields: [{ key: "s", label: "s (digits)", kind: "text", maxLength: 10, hint: "digits, like 226" }],
  examples: [
    { label: "Example", input: { s: "226" } },
    { label: "With zeros", input: { s: "2101" } },
    { label: "Leading zero", input: { s: "06" } },
  ],
  check: (input) => (/^\d+$/.test(input.s as string) ? null : "Use digits only."),
  run(input) {
    const s = input.s as string;
    const n = s.length;
    const r = recorder();
    const ways: Scalar[] = new Array(n + 1).fill("");
    ways[0] = 1;
    const view = (wt: Record<number, CellTone> = {}, st: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "s", values: [...s], tones: st },
        { name: "ways (decodings of the first i digits)", values: [...ways], tones: wt },
      ],
    });

    r.step(lineOf(code, "ways[0] = 1;"), `ways[i] = decodings of the first i digits. **ways[0] = 1**: the empty prefix has exactly one (empty) decoding.`, view({ 0: "success" }));
    for (let i = 1; i <= n; i++) {
      let total = 0;
      const parts: string[] = [];
      const wt: Record<number, CellTone> = { [i]: "write" };
      if (s[i - 1] !== "0") {
        total += ways[i - 1] as number;
        parts.push(`"${s[i - 1]}" alone → ways[${i - 1}] = ${ways[i - 1]}`);
        wt[i - 1] = "primary";
      } else parts.push(`"0" can't stand alone`);
      const two = i >= 2 ? Number(s.slice(i - 2, i)) : 0;
      if (i >= 2) {
        if (two >= 10 && two <= 26) {
          total += ways[i - 2] as number;
          parts.push(`"${s.slice(i - 2, i)}" → ways[${i - 2}] = ${ways[i - 2]}`);
          wt[i - 2] = "primary";
        } else parts.push(`"${s.slice(i - 2, i)}" isn't 10–26`);
      }
      ways[i] = total;
      r.step(lineOf(code, i >= 2 && two >= 10 && two <= 26 ? "if (two >= 10 && two <= 26)" : "if (s[i - 1] !== \"0\")"), `Prefix "${s.slice(0, i)}": ${parts.join("; ")}. ways[${i}] = **${total}**.`, view(wt, toneRange(Math.max(0, i - 2), i - 1, "primary")));
    }
    r.step(lineOf(code, "return ways[n];"), `"${s}" can be decoded in **${ways[n]}** way${ways[n] === 1 ? "" : "s"}. O(n) time.`, { ...view({ [n]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
