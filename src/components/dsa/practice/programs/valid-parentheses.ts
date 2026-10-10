import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function isValid(s) {
  if (s.length % 2 === 1) return false;      // odd length can't pair up
  const expect = [];                          // closers we still owe
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(") expect.push(")");
    else if (c === "[") expect.push("]");
    else if (c === "{") expect.push("}");
    else if (expect.pop() !== c) return false;   // wrong closer, or none owed
    if (expect.length > s.length - 1 - i) return false;   // can't close them all in time
  }
  return expect.length === 0;
}`;

const CLOSER: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const LINE: Record<string, number> = { "(": 6, "[": 7, "{": 8 };

const program: Program = {
  title: "Valid parentheses (a stack of owed closers)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 14, hint: "{[()]}" }],
  examples: [
    { label: "Nested", input: { s: "{[()]}" } },
    { label: "Crossed", input: { s: "([)]" } },
    { label: "Side by side", input: { s: "()[]{}" } },
    { label: "Too many open", input: { s: "(([]" } },
  ],
  check(input) {
    return /^[()[\]{}]+$/.test(input.s as string) ? null : "s: use only the brackets ( ) [ ] { }.";
  },
  run(input) {
    const chars = [...(input.s as string)];
    const n = chars.length;
    const r = recorder();
    const expect: string[] = [];

    const view = (i: number | undefined, tones: Record<number, CellTone> = {}, stackTones: Record<number, CellTone> = {}) => ({
      arrays: [
        {
          name: "s",
          values: chars,
          tones: { ...Object.fromEntries(chars.map((_, k) => [k, (i !== undefined && k < i ? "done" : "idle") as CellTone])), ...tones },
          pointers: pointersAt(n, { i }),
        },
      ],
      stacks: [{ name: "expect", values: expect, tones: stackTones }],
    });

    if (n % 2 === 1) {
      r.step(2, `${n} characters is an **odd** number. Brackets come in pairs, so some bracket must be left without a partner: return **false** before reading anything.`, {
        ...view(undefined, Object.fromEntries(chars.map((_, k) => [k, "muted" as CellTone]))),
        vars: { "s.length": n, result: "false" },
        done: true,
      });
      return r.frames;
    }

    r.step(3, `Read left to right. For every opening bracket, push the **closer we now owe**. A closing bracket must pay the most recent debt — the top of the stack.`, {
      ...view(undefined),
      vars: { "s.length": n },
    });

    for (let i = 0; i < n; i++) {
      const c = chars[i];
      if (CLOSER[c]) {
        expect.push(CLOSER[c]);
        r.step(LINE[c], `'${c}' opens a bracket: push the closer it needs, '${CLOSER[c]}'.`, {
          ...view(i, { [i]: "primary" }, { [expect.length - 1]: "write" }),
          vars: { i, c: `'${c}'` },
        });
      } else {
        const owed = expect.pop();
        if (owed !== c) {
          r.step(9, owed === undefined
            ? `'${c}' closes a bracket, but nothing is open — there is no debt to pay. Return **false**.`
            : `'${c}' closes a bracket, but the most recent opener needs '${owed}'. The brackets cross. Return **false**.`, {
            ...view(i, { [i]: "write" }),
            vars: { i, c: `'${c}'`, owed: owed === undefined ? "nothing" : `'${owed}'`, result: "false" },
            done: true,
          });
          return r.frames;
        }
        r.step(9, `'${c}' matches the top of the stack: that debt is paid. Pop.`, {
          ...view(i, { [i]: "success" }),
          vars: { i, c: `'${c}'` },
        });
      }
      const left = n - 1 - i;
      if (expect.length > left) {
        r.step(10, `${expect.length} closers are still owed, but only ${left} character${left === 1 ? "" : "s"} remain${left === 1 ? "s" : ""}. They can't all be closed: return **false** without reading further.`, {
          ...view(i, {}, Object.fromEntries(expect.map((_, k) => [k, "write" as CellTone]))),
          vars: { owed: expect.length, remaining: left, result: "false" },
          done: true,
        });
        return r.frames;
      }
    }

    r.step(12, `Every bracket was matched and nothing is still owed: return **true**. One pass, each character pushed or popped once: **O(n) time**.`, {
      ...view(n, Object.fromEntries(chars.map((_, k) => [k, "success" as CellTone]))),
      vars: { result: "true" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
