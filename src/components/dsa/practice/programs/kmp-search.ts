import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function strStr(haystack, needle) {
  const m = needle.length;
  if (m === 0) return 0;
  // lps[i]: length of the longest proper prefix of needle[0..i] that is also a suffix of it.
  const lps = new Array(m).fill(0);
  for (let i = 1, len = 0; i < m; ) {
    if (needle[i] === needle[len]) lps[i++] = ++len;   // the border grows by one
    else if (len > 0) len = lps[len - 1];              // fall back to a shorter border
    else lps[i++] = 0;
  }
  // Scan the haystack; after a mismatch, lps says how much of the needle still matches.
  for (let i = 0, j = 0; i < haystack.length; ) {
    if (haystack[i] === needle[j]) {
      i++;
      j++;
      if (j === m) return i - m;                       // all of the needle matched
    } else if (j > 0) j = lps[j - 1];                  // keep the border; i never moves back
    else i++;
  }
  return -1;
}`;

const program: Program = {
  title: "Find a substring with KMP",
  code,
  fields: [
    { key: "haystack", label: "haystack", kind: "text", maxLength: 16, hint: "lowercase letters, like abababca" },
    { key: "needle", label: "needle", kind: "text", maxLength: 7, hint: "lowercase letters, like ababca" },
  ],
  examples: [
    { label: "Example", input: { haystack: "abababca", needle: "ababca" } },
    { label: "Repeated letters", input: { haystack: "aaaaab", needle: "aab" } },
    { label: "Not there", input: { haystack: "leetcode", needle: "leeto" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.haystack as string) && /^[a-z]+$/.test(input.needle as string) ? null : "haystack and needle: use lowercase letters only."),
  run(input) {
    const hay = input.haystack as string;
    const needle = input.needle as string;
    const m = needle.length;
    const lps = new Array(m).fill(0);
    const r = recorder();

    // filled: how many lps entries are known so far.
    const buildFrame = (i: number, len: number, hot: CellTone, filled: number) => ({
      arrays: [
        { name: "needle", values: [...needle], tones: { ...Object.fromEntries(Array.from({ length: len }, (_, k) => [k, "tertiary" as const])), ...(i < m ? { [i]: hot } : {}) }, pointers: pointersAt(m, { len, i }, { i: "tertiary" }) },
        { name: "lps", values: lps.map((v, k) => (k < filled ? v : "")), tones: i < m ? { [i]: "write" as const } : {} },
      ],
      vars: { i, len },
    });
    const scanFrame = (i: number, j: number, hot: CellTone | null, found = false) => {
      const shift = i - j;
      const aligned: Scalar[] = [...Array(Math.max(shift, 0)).fill(""), ...needle];
      const hayTones: Record<number, CellTone> = {};
      for (let k = shift; k < i; k++) hayTones[k] = found ? "success" : "done";
      if (hot && i < hay.length) hayTones[i] = hot;
      const needleTones: Record<number, CellTone> = {};
      for (let k = 0; k < j; k++) needleTones[shift + k] = found ? "success" : "done";
      if (hot && j < m) needleTones[shift + j] = hot;
      return {
        arrays: [
          { name: "haystack", values: [...hay], tones: hayTones, pointers: pointersAt(hay.length, { i }) },
          { name: "needle (lined up under the haystack)", values: aligned, tones: needleTones, pointers: j < m ? { [shift + j]: [{ label: "j", tone: "tertiary" as const }] } : {} },
          { name: "lps", values: lps },
        ],
        vars: { i, j },
      };
    };

    r.step(lineOf(code, "const lps = "), `Step 1 — study the needle on its own. For each prefix needle[0..i], find its longest **border**: a proper prefix that is also a suffix (in "abab", the border is "ab"). After a mismatch, the border is the part of the needle that is already known to match again.`, buildFrame(1, 0, "primary", 1));
    for (let i = 1, len = 0; i < m; ) {
      if (needle[i] === needle[len]) {
        lps[i] = ++len;
        r.step(lineOf(code, "lps[i++] = ++len"), `needle[${i}] = '${needle[i]}' matches needle[${len - 1}]: the border grows to **${len}** ("${needle.slice(0, len)}"). lps[${i}] = ${len}.`, buildFrame(i, len, "success", i + 1));
        i++;
      } else if (len > 0) {
        const old = len;
        len = lps[len - 1];
        r.step(lineOf(code, "len = lps[len - 1]"), `needle[${i}] = '${needle[i]}' doesn't extend the border "${needle.slice(0, old)}". Fall back to its own border, length ${len}, and try again.`, buildFrame(i, len, "write", i));
      } else {
        lps[i] = 0;
        r.step(lineOf(code, "else lps[i++] = 0"), `needle[${i}] = '${needle[i]}' starts no border: lps[${i}] = 0.`, buildFrame(i, 0, "write", i + 1));
        i++;
      }
    }
    r.step(lineOf(code, "// Scan the haystack"), `The table is ready: lps = [${lps.join(", ")}]. Step 2 — scan the haystack once. i only moves forwards; j is how much of the needle matches so far.`, scanFrame(0, 0, "primary"));
    let j = 0;
    for (let i = 0; i < hay.length; ) {
      if (hay[i] === needle[j]) {
        i++;
        j++;
        if (j === m) {
          r.step(lineOf(code, "if (j === m) return i - m"), `All ${m} letters of the needle match: it first occurs at index **${i - m}**. Building the table took O(m) and the scan O(n): **O(n + m)**.`, { ...scanFrame(i, j, null, true), done: true });
          return r.frames;
        }
        r.step(lineOf(code, "if (haystack[i] === needle[j])"), `haystack[${i - 1}] = needle[${j - 1}] = '${hay[i - 1]}': ${j} letter${j === 1 ? "" : "s"} matched.`, scanFrame(i, j, "primary"));
      } else if (j > 0) {
        const old = j;
        j = lps[j - 1];
        r.step(
          lineOf(code, "else if (j > 0) j = lps[j - 1]"),
          `Mismatch: '${hay[i]}' ≠ '${needle[old]}'. The ${old} letters just matched end with a border of ${j}${j > 0 ? ` ("${needle.slice(0, j)}")` : ""}, so slide the needle along to keep those ${j} matched — without moving i back.`,
          scanFrame(i, j, "write")
        );
      } else {
        r.step(lineOf(code, "else i++"), `'${hay[i]}' ≠ '${needle[0]}' and nothing is matched: move on.`, scanFrame(i, 0, "write"));
        i++;
      }
    }
    r.step(code.split("\n").length - 1, `The haystack ran out without a full match: **-1**. Still only O(n + m) steps.`, { ...scanFrame(hay.length, j, null), done: true });
    return r.frames;
  },
};

export default program;
