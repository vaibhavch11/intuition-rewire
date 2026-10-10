import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function removeDuplicates(s) {
  const stack = [];
  for (const ch of s) {
    if (stack.length > 0 && stack[stack.length - 1] === ch) {
      stack.pop();          // ch cancels the letter right before it
    } else {
      stack.push(ch);
    }
  }
  return stack.join("");
}`;

const program: Program = {
  title: "Remove adjacent duplicates",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 12, hint: "abbaca" }],
  examples: [
    { label: "abbaca", input: { s: "abbaca" } },
    { label: "azxxzy", input: { s: "azxxzy" } },
    { label: "Everything cancels", input: { s: "abccba" } },
  ],
  check(input) {
    return /^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only, like abbaca.";
  },
  run(input) {
    const s = input.s as string;
    const chars = [...s];
    const r = recorder();
    const stack: string[] = [];
    const gone = new Set<number>();
    const kept: number[] = [];

    const view = (i: number | undefined, tones: Record<number, CellTone> = {}, stackTones: Record<number, CellTone> = {}) => ({
      arrays: [
        {
          name: "s",
          values: chars,
          tones: { ...Object.fromEntries([...gone].map((g) => [g, "muted" as CellTone])), ...tones },
          pointers: pointersAt(chars.length, { ch: i }),
        },
      ],
      stacks: [{ name: "stack", values: stack, tones: stackTones }],
    });

    r.step(2, `Read the letters left to right. The stack holds the letters that **survive so far**, with the most recent survivor on top.`, {
      ...view(undefined),
      vars: {},
    });

    chars.forEach((ch, i) => {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
        const partner = kept.pop()!;
        gone.add(partner);
        gone.add(i);
        r.step(5, `'${ch}' matches the top of the stack — the letter right before it among the survivors. **Both vanish**: pop.`, {
          ...view(i, { [i]: "write", [partner]: "write" }),
          vars: { ch: `'${ch}'` },
        });
      } else {
        stack.push(ch);
        kept.push(i);
        r.step(7, stack.length > 1 ? `'${ch}' differs from the top ('${stack[stack.length - 2]}'), so it survives for now: push.` : `The stack is empty, so '${ch}' survives for now: push.`, {
          ...view(i, { [i]: "primary" }, { [stack.length - 1]: "write" }),
          vars: { ch: `'${ch}'` },
        });
      }
    });

    const result = stack.join("");
    r.step(10, `Read the stack from bottom to top: **"${result}"**${result ? "" : " (nothing survived)"}. Each letter was pushed once and popped at most once: **O(n) time**.`, {
      ...view(undefined),
      vars: { result: `"${result}"` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
