import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function decodeString(s) {
  const counts = [];       // how many times to repeat each open bracket
  const prefixes = [];     // the text built before each open bracket
  let cur = "";
  let k = 0;
  for (const c of s) {
    if (c >= "0" && c <= "9") {
      k = k * 10 + Number(c);              // numbers can have several digits
    } else if (c === "[") {
      counts.push(k);
      prefixes.push(cur);                  // park the text so far
      cur = "";
      k = 0;
    } else if (c === "]") {
      cur = prefixes.pop() + cur.repeat(counts.pop());
    } else {
      cur += c;
    }
  }
  return cur;
}`;

const MAX_OUT = 48;
const q = (s: string) => `"${s}"`;

/** Returns the decoded string, or an error message for input that isn't a valid encoding. */
function decode(s: string): { out: string } | { error: string } {
  if (!/^[a-z0-9[\]]+$/.test(s)) return { error: "s: use lowercase letters, digits and [ ] only, like 3[a]2[bc]." };
  const counts: number[] = [];
  const prefixes: string[] = [];
  let cur = "";
  let k = 0;
  let digits = false;
  for (const c of s) {
    if (/\d/.test(c)) {
      k = k * 10 + Number(c);
      digits = true;
    } else if (c === "[") {
      if (!digits) return { error: "s: every [ needs a number right before it, like 3[a]." };
      if (k < 1 || k > 20) return { error: "s: keep each repeat count between 1 and 20." };
      counts.push(k);
      prefixes.push(cur);
      cur = "";
      k = 0;
      digits = false;
    } else if (digits) {
      return { error: "s: a number must be followed by [ — like 2[ab]." };
    } else if (c === "]") {
      if (!counts.length) return { error: "s: there is a ] without a matching [." };
      cur = prefixes.pop()! + cur.repeat(counts.pop()!);
    } else {
      cur += c;
    }
    if (cur.length + prefixes.reduce((n, p) => n + p.length, 0) > MAX_OUT) {
      return { error: `s: that decodes to more than ${MAX_OUT} letters — try a smaller example.` };
    }
  }
  if (digits) return { error: "s: the string ends with a number that has no [ after it." };
  if (counts.length) return { error: "s: a [ is never closed." };
  return { out: cur };
}

const program: Program = {
  title: "Decode string (counts and prefixes stacks)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 20, hint: "3[a2[c]]" }],
  examples: [
    { label: "Side by side", input: { s: "3[a]2[bc]" } },
    { label: "Nested", input: { s: "3[a2[c]]" } },
    { label: "Text around", input: { s: "2[abc]3[cd]ef" } },
  ],
  check(input) {
    const result = decode(input.s as string);
    return "error" in result ? result.error : null;
  },
  run(input) {
    const chars = [...(input.s as string)];
    const r = recorder();
    const counts: number[] = [];
    const prefixes: string[] = [];
    let cur = "";
    let k = 0;

    const view = (i: number | undefined, tones: Record<number, CellTone> = {}, t: { counts?: Record<number, CellTone>; prefixes?: Record<number, CellTone> } = {}) => ({
      arrays: [
        {
          name: "s",
          values: chars,
          tones: { ...Object.fromEntries(chars.map((_, j) => [j, (i !== undefined && j < i ? "done" : "idle") as CellTone])), ...tones },
          pointers: pointersAt(chars.length, { c: i }),
        },
      ],
      stacks: [
        { name: "counts", values: counts, tones: t.counts ?? {} },
        { name: "prefixes", values: prefixes.map(q), tones: t.prefixes ?? {} },
      ],
    });

    r.step(5, `\`cur\` is the text of the bracket we are inside right now; \`k\` collects the number before the next "[". Two stacks remember the **outer** brackets while we work on an inner one.`, {
      ...view(undefined),
      vars: { cur: q(cur), k },
    });

    chars.forEach((c, i) => {
      if (/\d/.test(c)) {
        k = k * 10 + Number(c);
        r.step(8, `Digit ${c}: k = **${k}**${k >= 10 ? " (digits keep building the same number)" : ""}.`, { ...view(i, { [i]: "primary" }), vars: { cur: q(cur), k } });
      } else if (c === "[") {
        counts.push(k);
        prefixes.push(cur);
        r.step(11, `"[" opens a bracket. Park the outer work: push count **${k}** and prefix **${q(cur)}**. Start the inside fresh.`, {
          ...view(i, { [i]: "primary" }, { counts: { [counts.length - 1]: "write" }, prefixes: { [prefixes.length - 1]: "write" } }),
          vars: { cur: q(""), k: 0 },
        });
        cur = "";
        k = 0;
      } else if (c === "]") {
        const times = counts.pop()!;
        const before = prefixes.pop()!;
        const inner = cur;
        cur = before + inner.repeat(times);
        r.step(15, `"]" closes the bracket. Repeat the inside ${q(inner)} **${times}** times and glue it after the parked prefix ${q(before)}: cur = **${q(cur)}**.`, {
          ...view(i, { [i]: "success" }),
          vars: { cur: q(cur), k },
        });
      } else {
        cur += c;
        r.step(17, `Letter '${c}': add it to cur → ${q(cur)}.`, { ...view(i, { [i]: "primary" }), vars: { cur: q(cur), k } });
      }
    });

    r.step(20, `Done: **${q(cur)}** (${cur.length} letters). Each bracket was opened and closed once, with the stacks holding whatever was outside it.`, {
      ...view(chars.length),
      vars: { result: q(cur) },
      done: true,
    });
    return r.frames;
  },
};

export default program;
