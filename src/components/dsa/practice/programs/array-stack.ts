import { parseOps, type Op } from "../structures";
import { pointersAt, recorder, type ArrayView, type CellTone, type Program, type Scalar } from "../types";

const code = `class ArrayStack {
  constructor() {
    this.data = new Array(2);   // room for 2 items to start
    this.n = 0;                 // how many items; the top is data[n - 1]
  }
  push(x) {
    if (this.n === this.data.length) this.grow();
    this.data[this.n] = x;
    this.n++;
  }
  pop() {
    if (this.n === 0) return -1;   // underflow
    this.n--;
    return this.data[this.n];      // the slot keeps its old value; n just forgets it
  }
  top() {
    return this.n === 0 ? -1 : this.data[this.n - 1];
  }
  isEmpty() {
    return this.n === 0;
  }
  size() {
    return this.n;
  }
  grow() {
    const bigger = new Array(this.data.length * 2);
    for (let i = 0; i < this.n; i++) bigger[i] = this.data[i];
    this.data = bigger;
  }
}`;

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "top", "isEmpty", "size"];

const program: Program = {
  title: "Stack on a growing array",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "push 10, push 20, pop, top" }],
  examples: [
    { label: "Push, pop, grow", input: { ops: "push 10, push 20, push 30, pop, push 40, push 50, top" } },
    { label: "Doubling", input: { ops: "push 1, push 2, push 3, push 4, push 5, size" } },
    { label: "Underflow", input: { ops: "push 7, pop, pop, isEmpty" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG) as Op[];
    const r = recorder();
    let data: Scalar[] = [null, null];
    let n = 0;
    let copies = 0;

    const dataView = (tones: Record<number, CellTone> = {}): ArrayView => ({
      name: `data (capacity ${data.length})`,
      values: data,
      tones: {
        ...Object.fromEntries(data.map((v, i) => [i, (i < n ? "done" : v === null ? "idle" : "muted") as CellTone])),
        ...(n > 0 ? { [n - 1]: "primary" as CellTone } : {}),
        ...tones,
      },
      pointers: pointersAt(data.length, { top: n > 0 ? n - 1 : undefined, n: n < data.length ? n : undefined }, { n: "muted" }),
    });

    r.step(3, `Start with room for **2** items and \`n\` = 0. The top is always \`data[n - 1]\`; \`n\` points at the next free slot.`, {
      arrays: [dataView()],
      vars: { n: 0, capacity: 2 },
    });

    for (const op of ops) {
      if (op.name === "push") {
        if (n === data.length) {
          const bigger: Scalar[] = new Array(data.length * 2).fill(null);
          r.step(7, `**push ${op.arg}**, but all ${data.length} slots are used. Time to **grow**: make an array twice as big.`, {
            arrays: [dataView(), { name: `bigger (capacity ${bigger.length})`, values: bigger }],
            vars: { n, capacity: data.length },
          });
          for (let i = 0; i < n; i++) bigger[i] = data[i];
          copies += n;
          r.step(27, `Copy all ${n} items across, in the same order. This one push costs ${n} copies — but the next ${bigger.length - n} pushes will cost none.`, {
            arrays: [dataView(), { name: `bigger (capacity ${bigger.length})`, values: bigger, tones: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, "write" as CellTone])) }],
            vars: { n, copied: n },
          });
          data = bigger;
        }
        data[n] = op.arg!;
        n++;
        r.step(9, `**push ${op.arg}** — write it at index ${n - 1} and move \`n\` to ${n}. ${op.arg} is the new top.`, {
          arrays: [dataView({ [n - 1]: "write" })],
          vars: { n, capacity: data.length },
        });
      } else if (op.name === "pop") {
        if (n === 0) {
          r.step(12, `**pop** with n = 0: the stack is empty (**underflow**). Return -1.`, {
            arrays: [dataView()],
            vars: { returned: -1, n },
          });
          continue;
        }
        n--;
        r.step(14, `**pop** — move \`n\` back to ${n} and return **${data[n]}**. The value stays in the slot (greyed out), but it is no longer part of the stack: the next push overwrites it.`, {
          arrays: [dataView()],
          vars: { returned: data[n], n },
        });
      } else if (op.name === "top") {
        r.step(17, n ? `**top** reads data[${n - 1}] = **${data[n - 1]}**.` : `**top** on an empty stack returns -1.`, {
          arrays: [dataView(n ? { [n - 1]: "tertiary" } : {})],
          vars: { returned: n ? (data[n - 1] as number) : -1, n },
        });
      } else if (op.name === "isEmpty") {
        r.step(20, `**isEmpty** → **${n === 0}**.`, { arrays: [dataView()], vars: { returned: String(n === 0), n } });
      } else {
        r.step(23, `**size** → **${n}**.`, { arrays: [dataView()], vars: { returned: n, n } });
      }
    }

    r.step(3, `Done. push, pop and top are **O(1)**; the occasional grow copies everything, but because the capacity doubles, the copies add up to less than one per push: **O(1) amortized**. (${copies} cop${copies === 1 ? "y" : "ies"} in total here.)`, {
      arrays: [dataView()],
      vars: { n, capacity: data.length, copies },
      done: true,
    });
    return r.frames;
  },
};

export default program;
