import { parseOps, type Op } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `class Stack {
  constructor() {
    this.items = [];
  }
  push(x) {
    this.items.push(x);            // add on top
  }
  pop() {
    if (this.isEmpty()) return undefined;   // underflow: nothing to take
    return this.items.pop();       // remove the top
  }
  peek() {
    return this.items[this.items.length - 1];   // look, don't remove
  }
  isEmpty() {
    return this.items.length === 0;
  }
  size() {
    return this.items.length;
  }
}`;

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "peek", "isEmpty", "size"];

const program: Program = {
  title: "Push, pop and peek",
  code,
  fields: [
    { key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "push 10, push 20, pop, peek" },
  ],
  examples: [
    { label: "Push and pop", input: { ops: "push 10, push 20, push 30, pop, peek, push 40, size" } },
    { label: "Last in, first out", input: { ops: "push 1, push 2, push 3, pop, pop, pop" } },
    { label: "Underflow", input: { ops: "push 7, pop, pop, isEmpty" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG) as Op[];
    const r = recorder();
    const items: number[] = [];
    const popped: number[] = [];

    const views = (tones: Record<number, CellTone> = {}, fresh = false) => ({
      stacks: [{ name: "stack", values: items, tones }],
      arrays: popped.length
        ? [{ name: "popped, in order", values: popped, tones: fresh ? { [popped.length - 1]: "write" as CellTone } : {} }]
        : [],
    });

    r.step(3, `An empty stack. Every operation below touches only the **top** — the most recently pushed item.`, {
      ...views(),
      vars: { size: 0 },
    });

    for (const op of ops) {
      const top = items.length - 1;
      if (op.name === "push") {
        items.push(op.arg!);
        r.step(6, `**push ${op.arg}** — ${op.arg} goes on top${items.length > 1 ? `, above ${items[items.length - 2]}` : ""}. Nothing else moves.`, {
          ...views({ [items.length - 1]: "write" }),
          vars: { size: items.length },
        });
      } else if (op.name === "pop") {
        if (items.length === 0) {
          r.step(9, `**pop** on an empty stack — there is nothing to remove. This is called **stack underflow**; the method returns \`undefined\` instead of crashing.`, {
            ...views(),
            vars: { returned: "undefined", size: 0 },
          });
          continue;
        }
        const x = items.pop()!;
        popped.push(x);
        r.step(10, `**pop** removes the top item, **${x}**${items.length ? `. ${items[items.length - 1]} is the new top` : ". The stack is empty again"}.`, {
          ...views({}, true),
          vars: { returned: x, size: items.length },
        });
      } else if (op.name === "peek") {
        r.step(
          13,
          items.length
            ? `**peek** returns the top, **${items[top]}**, but leaves it in place.`
            : `**peek** on an empty stack returns \`undefined\` — there is no top to look at.`,
          { ...views(items.length ? { [top]: "tertiary" } : {}), vars: { returned: items.length ? items[top] : "undefined", size: items.length } }
        );
      } else if (op.name === "isEmpty") {
        r.step(16, `**isEmpty** → **${items.length === 0}**.`, {
          ...views(),
          vars: { returned: String(items.length === 0), size: items.length },
        });
      } else {
        r.step(19, `**size** → **${items.length}** item${items.length === 1 ? "" : "s"}.`, {
          ...views(),
          vars: { returned: items.length, size: items.length },
        });
      }
    }

    r.step(
      3,
      popped.length > 1
        ? `Done. Items came off in the **reverse** of the order they went on — last in, first out. Every operation was **O(1)**: none of them looked below the top.`
        : `Done. Every operation was **O(1)**: none of them looked below the top.`,
      { ...views(), vars: { size: items.length }, done: true }
    );
    return r.frames;
  },
};

export default program;
