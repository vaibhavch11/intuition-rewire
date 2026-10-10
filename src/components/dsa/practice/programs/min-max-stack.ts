import { parseOps, type Op } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `class MinMaxStack {
  constructor() {
    this.items = [];
    this.mins = [];      // top of mins = the current minimum
    this.maxs = [];      // top of maxs = the current maximum
  }
  push(x) {
    this.items.push(x);
    if (this.mins.length === 0 || x <= this.getMin()) this.mins.push(x);
    if (this.maxs.length === 0 || x >= this.getMax()) this.maxs.push(x);
  }
  pop() {
    const x = this.items.pop();
    if (x === this.getMin()) this.mins.pop();
    if (x === this.getMax()) this.maxs.pop();
  }
  top() {
    return this.items[this.items.length - 1];
  }
  getMin() {
    return this.mins[this.mins.length - 1];
  }
  getMax() {
    return this.maxs[this.maxs.length - 1];
  }
}`;

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "top", "getMin", "getMax"];

const program: Program = {
  title: "Min & max stack (two helper stacks)",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 180, hint: "push 5, push 2, getMin, pop" }],
  examples: [
    { label: "Example", input: { ops: "push 5, push 2, push 8, push 1, getMin, getMax, pop, getMin, pop, getMax" } },
    { label: "Repeated minimum", input: { ops: "push 3, push 1, push 1, pop, getMin, pop, getMin" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG);
    if (typeof ops === "string") return ops;
    let size = 0;
    for (const op of ops) {
      if (op.name === "push") size++;
      else if (size === 0) return `"${op.name}" on an empty stack isn't allowed in this problem — push something first.`;
      else if (op.name === "pop") size--;
    }
    return null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG) as Op[];
    const r = recorder();
    const items: number[] = [];
    const mins: number[] = [];
    const maxs: number[] = [];

    const view = (t: { items?: Record<number, CellTone>; mins?: Record<number, CellTone>; maxs?: Record<number, CellTone> } = {}) => ({
      stacks: [
        { name: "items", values: items, tones: t.items ?? {} },
        { name: "mins", values: mins, tones: t.mins ?? {}, topLabel: "min" },
        { name: "maxs", values: maxs, tones: t.maxs ?? {}, topLabel: "max" },
      ],
    });
    const vars = () => ({ min: mins.length ? mins[mins.length - 1] : "—", max: maxs.length ? maxs[maxs.length - 1] : "—" });

    r.step(5, `Three stacks. **items** holds everything. **mins** only grows when a new value is ≤ the current minimum, and **maxs** only when it is ≥ the current maximum — so their tops are always the answers.`, {
      ...view(),
      vars: vars(),
    });

    for (const op of ops) {
      const last = (a: number[]) => a.length - 1;
      if (op.name === "push") {
        const x = op.arg!;
        items.push(x);
        const newMin = mins.length === 0 || x <= mins[last(mins)];
        const newMax = maxs.length === 0 || x >= maxs[last(maxs)];
        if (newMin) mins.push(x);
        if (newMax) maxs.push(x);
        const parts = [newMin ? `a new minimum (push onto mins)` : "", newMax ? `a new maximum (push onto maxs)` : ""].filter(Boolean);
        r.step(newMax ? 10 : newMin ? 9 : 8, `**push ${x}** onto items. ${parts.length ? `It is ${parts.join(" and ")}.` : `It beats neither the minimum nor the maximum, so mins and maxs don't change.`}`, {
          ...view({ items: { [last(items)]: "write" }, mins: newMin ? { [last(mins)]: "write" } : {}, maxs: newMax ? { [last(maxs)]: "write" } : {} }),
          vars: vars(),
        });
      } else if (op.name === "pop") {
        const x = items.pop()!;
        const wasMin = x === mins[last(mins)];
        const wasMax = x === maxs[last(maxs)];
        if (wasMin) mins.pop();
        if (wasMax) maxs.pop();
        const parts = [wasMin ? "it was the current minimum, so pop mins too" : "", wasMax ? "it was the current maximum, so pop maxs too" : ""].filter(Boolean);
        r.step(wasMax ? 15 : wasMin ? 14 : 13, `**pop** removes ${x}${parts.length ? `; ${parts.join(", and ")}` : ". It wasn't a record, so mins and maxs stay"}. The previous records are back on top.`, {
          ...view(),
          vars: vars(),
        });
      } else if (op.name === "top") {
        r.step(18, `**top** → **${items[last(items)]}**.`, { ...view({ items: { [last(items)]: "tertiary" } }), vars: { ...vars(), returned: items[last(items)] } });
      } else if (op.name === "getMin") {
        r.step(21, `**getMin** reads the top of mins: **${mins[last(mins)]}**. No scanning: O(1).`, {
          ...view({ mins: { [last(mins)]: "success" } }),
          vars: { ...vars(), returned: mins[last(mins)] },
        });
      } else {
        r.step(24, `**getMax** reads the top of maxs: **${maxs[last(maxs)]}**. No scanning: O(1).`, {
          ...view({ maxs: { [last(maxs)]: "success" } }),
          vars: { ...vars(), returned: maxs[last(maxs)] },
        });
      }
    }

    r.step(5, `Done. Every operation is **O(1)**. The helper stacks only store values that set a record when they arrived, so they are usually much shorter than items.`, {
      ...view(),
      vars: vars(),
      done: true,
    });
    return r.frames;
  },
};

export default program;
