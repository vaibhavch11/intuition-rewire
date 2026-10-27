import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function reverseString(s) {
  const reverse = (left, right) => {
    if (left >= right) return;                     // 0 or 1 letters left: done
    [s[left], s[right]] = [s[right], s[left]];     // swap the ends
    reverse(left + 1, right - 1);                  // reverse the middle
  };
  reverse(0, s.length - 1);
}`;

const program: Program = {
  title: "Reverse string, recursively",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 10, hint: "letters, like hello" }],
  examples: [
    { label: "Odd length", input: { s: "hello" } },
    { label: "Even length", input: { s: "Hannah" } },
    { label: "Two letters", input: { s: "ab" } },
  ],
  check: (input) => ((input.s as string).length ? null : "Enter at least one letter."),
  run(input) {
    const s = [...(input.s as string)];
    const n = s.length;
    const r = recorder();
    const calls: string[] = [];
    const view = (left: number, right: number, tones: Record<number, CellTone> = {}) => ({
      arrays: [{ name: "s", values: [...s], tones: { ...toneRange(0, left - 1, "done"), ...toneRange(right + 1, n - 1, "done"), ...tones }, pointers: pointersAt(n, left === right ? { "left = right": left } : { left, right }, { right: "tertiary" }) }],
      stacks: [{ name: "call stack", values: [...calls], tones: calls.length ? { [calls.length - 1]: "primary" as CellTone } : {} }],
    });

    const reverse = (left: number, right: number) => {
      calls.push(`reverse(${left}, ${right})`);
      if (left >= right) {
        r.step(lineOf(code, "if (left >= right) return;"), `**reverse(${left}, ${right})**: ${left === right ? "one letter left" : "nothing left"} in the middle — the base case. Return without doing anything.`, { ...view(left, right), vars: { left, right, depth: calls.length } });
        calls.pop();
        return;
      }
      [s[left], s[right]] = [s[right], s[left]];
      r.step(lineOf(code, "[s[left], s[right]] = [s[right], s[left]];"), `**reverse(${left}, ${right})**: swap the ends, '${s[right]}' and '${s[left]}'. The letters between them are the same problem, two letters shorter.`, {
        ...view(left, right, { [left]: "write", [right]: "write" }),
        vars: { left, right, depth: calls.length },
      });
      r.step(lineOf(code, "reverse(left + 1, right - 1);"), `Call **reverse(${left + 1}, ${right - 1})** for the middle. This frame stays on the stack until it returns.`, { ...view(left + 1, right - 1), vars: { left, right, depth: calls.length } });
      reverse(left + 1, right - 1);
      calls.pop();
    };
    r.step(lineOf(code, "reverse(0, s.length - 1);"), `Reverse the whole array: positions 0 to ${n - 1}.`, view(0, n - 1));
    reverse(0, n - 1);
    const depth = Math.floor(n / 2) + 1;
    r.step(lineOf(code, "reverse(0, s.length - 1);"), `Reversed: **${s.join("")}**. ${Math.floor(n / 2)} swap${Math.floor(n / 2) === 1 ? "" : "s"}, O(n) time — but ${depth} call${depth === 1 ? " was" : "s were"} on the stack at once: **O(n) memory**. The two-pointer loop does the same in O(1).`, {
      arrays: [{ name: "s", values: [...s], tones: toneRange(0, n - 1, "success") }],
      stacks: [{ name: "call stack", values: [] }],
      done: true,
    });
    return r.frames;
  },
};

export default program;
