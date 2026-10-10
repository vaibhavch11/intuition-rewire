import { parseOps, type Op } from "../structures";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `class MyStack {
  constructor() {
    this.q = [];                     // a queue: push at the back, shift from the front
  }
  push(x) {
    this.q.push(x);
    for (let i = 0; i < this.q.length - 1; i++) {
      this.q.push(this.q.shift());   // rotate: older items go behind x
    }
  }
  pop() {
    return this.q.shift();           // the front is always the newest item
  }
  top() {
    return this.q[0];
  }
  empty() {
    return this.q.length === 0;
  }
}`;

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "top", "empty"];

const program: Program = {
  title: "A stack using one queue",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "push 1, push 2, top, pop" }],
  examples: [
    { label: "Push, top, pop", input: { ops: "push 1, push 2, push 3, top, pop, push 4, pop" } },
    { label: "Single item", input: { ops: "push 7, top, pop, empty" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10);
    if (typeof ops === "string") return ops;
    let size = 0;
    for (const op of ops) {
      if (op.name === "push") size++;
      else if (op.name !== "empty" && size === 0) return `"${op.name}" on an empty stack isn't allowed in this problem — push something first.`;
      else if (op.name === "pop") size--;
    }
    return null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10) as Op[];
    const r = recorder();
    const q: number[] = [];

    const view = (tones: Record<number, CellTone> = {}) => ({
      arrays: [
        {
          name: "queue",
          values: q,
          tones,
          pointers: pointersAt(q.length, q.length > 1 ? { front: 0, back: q.length - 1 } : { "front = back": 0 }, { back: "tertiary" }),
        },
      ],
    });

    r.step(3, `One queue. It can only add at the **back** and remove from the **front**. The trick: keep the **newest** item at the front, so the front behaves like a stack's top.`, {
      ...view(),
      vars: {},
    });

    for (const op of ops) {
      if (op.name === "push") {
        q.push(op.arg!);
        r.step(6, `**push ${op.arg}** — the queue can only add at the back, so ${op.arg} lands behind the ${q.length - 1} older item${q.length === 2 ? "" : "s"}.`, {
          ...view({ [q.length - 1]: "write" }),
          vars: { size: q.length },
        });
        for (let k = 0; k < q.length - 1; k++) {
          const moved = q.shift()!;
          q.push(moved);
          r.step(8, `Rotate ${k + 1} of ${q.length - 1}: take ${moved} off the front and add it at the back.`, {
            // The new item started at the back and moves one place forward per rotation.
            ...view({ [q.length - 1]: "muted", [q.length - 2 - k]: "write" }),
            vars: { size: q.length, rotated: k + 1 },
          });
        }
        if (q.length > 1) {
          r.step(7, `After ${q.length - 1} rotation${q.length === 2 ? "" : "s"}, ${op.arg} is at the **front** and the older items follow in newest-to-oldest order. Push costs O(n).`, {
            ...view({ 0: "primary" }),
            vars: { size: q.length },
          });
        }
      } else if (op.name === "pop") {
        const x = q.shift()!;
        r.step(12, `**pop** — the front is the newest item, so a plain dequeue returns **${x}**. O(1).`, {
          ...view(),
          vars: { returned: x, size: q.length },
        });
      } else if (op.name === "top") {
        r.step(15, `**top** reads the front: **${q[0]}**. O(1).`, { ...view({ 0: "tertiary" }), vars: { returned: q[0], size: q.length } });
      } else {
        r.step(18, `**empty** → **${q.length === 0}**.`, { ...view(), vars: { returned: String(q.length === 0), size: q.length } });
      }
    }

    r.step(3, `Done. The queue always holds the items **newest first**, so pop and top are O(1); each push pays O(n) to rotate the older items behind the new one.`, {
      ...view(),
      vars: { size: q.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
