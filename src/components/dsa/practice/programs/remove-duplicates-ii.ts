import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function removeDuplicates(s, k) {
  const stack = [];                           // [character, how many in a row]
  for (const ch of s) {
    const top = stack[stack.length - 1];
    if (top && top[0] === ch) {
      top[1]++;                               // one more of the same letter
      if (top[1] === k) stack.pop();          // k in a row: they vanish together
    } else {
      stack.push([ch, 1]);
    }
  }
  return stack.map(([ch, n]) => ch.repeat(n)).join("");
}`;

const program: Program = {
  title: "Remove k adjacent duplicates (stack of runs)",
  code,
  fields: [
    { key: "s", label: "s", kind: "text", maxLength: 20, hint: "lowercase letters, like deeedbbcccbdaa" },
    { key: "k", label: "k", kind: "number", min: 2, max: 5 },
  ],
  examples: [
    { label: "Example", input: { s: "deeedbbcccbdaa", k: 3 } },
    { label: "A chain reaction", input: { s: "abbbaaca", k: 3 } },
    { label: "Pairs", input: { s: "pbbcggttciiippooaais", k: 2 } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? ((input.s as string).length <= 20 ? null : "Keep s to 20 letters.") : "s: use lowercase letters only."),
  run(input) {
    const s = input.s as string;
    const k = input.k as number;
    const chars = [...s];
    const stack: [string, number][] = [];
    const r = recorder();

    const frame = (i: number | null) => ({
      arrays: [{ name: "s", values: chars, tones: i === null ? toneRange(0, chars.length - 1, "done") : toneRange(0, i - 1, "done", { [i]: "primary" }), pointers: i === null ? {} : pointersAt(chars.length, { ch: i }) }],
      stacks: [{ name: "stack (letter × run length)", values: stack.map(([c, n]) => `${c} × ${n}`), topLabel: "top" }],
    });

    r.step(lineOf(code, "const stack = []"), `Removing k equal neighbours can make new neighbours meet ("abbba" → "aa"). A stack handles this: keep each **run** as [letter, count] on top of the runs before it. When a run reaches **${k}**, pop it — and the run below becomes the top again, ready to grow.`, frame(null));
    chars.forEach((ch, i) => {
      const top = stack[stack.length - 1];
      if (top && top[0] === ch) {
        top[1]++;
        if (top[1] === k) {
          stack.pop();
          const under = stack[stack.length - 1];
          r.step(lineOf(code, "if (top[1] === k) stack.pop()"), `'${ch}' makes ${k} in a row: the whole run vanishes.${under ? ` The run below (${under[0]} × ${under[1]}) is on top again — the next letter may extend it.` : ""}`, frame(i));
        } else {
          r.step(lineOf(code, "top[1]++"), `'${ch}' continues the run on top: ${ch} × ${top[1]}.`, frame(i));
        }
      } else {
        stack.push([ch, 1]);
        r.step(lineOf(code, "stack.push([ch, 1])"), `'${ch}' starts a new run: push ${ch} × 1.`, frame(i));
      }
    });
    const result = stack.map(([c, n]) => c.repeat(n)).join("");
    r.step(lineOf(code, "return stack.map"), `Write out the runs left on the stack, bottom to top: **"${result}"**. Each letter was pushed or counted once: **O(n)** time.`, { ...frame(null), done: true });
    return r.frames;
  },
};

export default program;
