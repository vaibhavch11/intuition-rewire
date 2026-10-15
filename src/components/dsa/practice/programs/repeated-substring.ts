import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function repeatedSubstringPattern(s) {
  const n = s.length;
  const lps = new Array(n).fill(0);
  for (let i = 1, len = 0; i < n; ) {
    if (s[i] === s[len]) lps[i++] = ++len;
    else if (len > 0) len = lps[len - 1];
    else lps[i++] = 0;
  }
  const border = lps[n - 1];                   // the longest prefix that is also a suffix
  const period = n - border;                   // s shifted by period lines up with itself
  return border > 0 && n % period === 0;       // the shift must cut s into whole blocks
}`;

const program: Program = {
  title: "Repeated substring pattern (KMP border)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 12, hint: "lowercase letters, like abcabcabc" }],
  examples: [
    { label: "Example", input: { s: "abcabcabc" } },
    { label: "Border, but no fit", input: { s: "abacaba" } },
    { label: "Not repeated", input: { s: "aba" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only."),
  run(input) {
    const s = input.s as string;
    const n = s.length;
    const lps = new Array(n).fill(0);
    const r = recorder();

    // filled: how many lps entries are known so far.
    const frame = (i: number, len: number, hot: CellTone, filled: number) => ({
      arrays: [
        { name: "s", values: [...s], tones: { ...Object.fromEntries(Array.from({ length: len }, (_, k) => [k, "tertiary" as const])), ...(i < n ? { [i]: hot } : {}) }, pointers: pointersAt(n, { len, i }, { i: "tertiary" }) },
        { name: "lps", values: lps.map((v, k) => (k < filled ? v : "")), tones: i < n ? { [i]: "write" as const } : {} },
      ],
      vars: { i, len },
    });

    r.step(lineOf(code, "const lps = "), `If s is a block repeated k times, then s without its first block equals s without its last block — a long **border** (a prefix that is also a suffix). Build the KMP table to find the longest border.`, frame(1, 0, "primary", 1));
    for (let i = 1, len = 0; i < n; ) {
      if (s[i] === s[len]) {
        lps[i] = ++len;
        r.step(lineOf(code, "lps[i++] = ++len"), `s[${i}] = '${s[i]}' matches s[${len - 1}]: the border grows to **${len}**. lps[${i}] = ${len}.`, frame(i, len, "success", i + 1));
        i++;
      } else if (len > 0) {
        const old = len;
        len = lps[len - 1];
        r.step(lineOf(code, "len = lps[len - 1]"), `s[${i}] = '${s[i]}' doesn't extend the border "${s.slice(0, old)}". Fall back to its own border, length ${len}.`, frame(i, len, "write", i));
      } else {
        lps[i] = 0;
        r.step(lineOf(code, "else lps[i++] = 0"), `s[${i}] = '${s[i]}' starts no border: lps[${i}] = 0.`, frame(i, 0, "write", i + 1));
        i++;
      }
    }

    const border = lps[n - 1];
    const period = n - border;
    // The prefix border, the suffix border, and where they overlap.
    const ends: Record<number, CellTone> = {};
    for (let k = 0; k < border; k++) ends[k] = "tertiary";
    for (let k = n - border; k < n; k++) ends[k] = ends[k] ? "write" : "primary";
    r.step(
      lineOf(code, "const period = n - border"),
      border === 0
        ? `lps[${n - 1}] = 0: no prefix of s is also a suffix, so s can't be made of a repeated block.`
        : `The longest border is lps[${n - 1}] = **${border}** ("${s.slice(0, border)}"). So s shifted right by n − border = **${period}** lines up with itself: every letter equals the one ${period} places before it.`,
      { arrays: [{ name: "s (prefix border, suffix border)", values: [...s], tones: ends }, { name: "lps", values: lps, tones: { [n - 1]: "write" } }], vars: { border, period } }
    );

    const ok = border > 0 && n % period === 0;
    const blocks: Record<number, CellTone> = {};
    if (ok) for (let k = 0; k < n; k++) blocks[k] = Math.floor(k / period) % 2 === 0 ? "success" : "primary";
    r.step(
      lineOf(code, "return border > 0"),
      ok
        ? `${n} is a multiple of ${period}, so s is "${s.slice(0, period)}" repeated ${n / period} times: **true**. Building the table is O(n).`
        : border === 0
          ? `No border: **false**.`
          : `The shift of ${period} does line s up with itself, but ${n} isn't a multiple of ${period}, so the blocks don't fit exactly: **false**.`,
      { arrays: [{ name: ok ? `s in blocks of ${period}` : "s", values: [...s], tones: blocks }, { name: "lps", values: lps }], vars: { border, period, "n % period": n % period }, done: true }
    );
    return r.frames;
  },
};

export default program;
