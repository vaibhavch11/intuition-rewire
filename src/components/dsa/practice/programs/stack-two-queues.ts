import { parseOps, type Op } from "../structures";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `class MyStack {
  constructor() {
    this.q1 = [];            // the items, newest first: q1's front is the top
    this.q2 = [];            // an empty helper
  }
  push(x) {
    this.q2.push(x);                                            // x goes in first...
    while (this.q1.length > 0) this.q2.push(this.q1.shift());   // ...then every older item behind it
    [this.q1, this.q2] = [this.q2, this.q1];                    // swap: q1 is newest-first again
  }
  pop() {
    return this.q1.shift();  // the front is the newest item
  }
  top() {
    return this.q1[0];
  }
  empty() {
    return this.q1.length === 0;
  }
}`;

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "top", "empty"];

const ends = (q: number[]) => (q.length > 1 ? { front: 0, back: q.length - 1 } : { "front = back": 0 });

const program: Program = {
  title: "A stack using two queues (costly push)",
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
    let q1: number[] = [];
    let q2: number[] = [];

    const view = (t1: Record<number, CellTone> = {}, t2: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "q1", values: q1, tones: t1, pointers: pointersAt(q1.length, ends(q1), { back: "tertiary" }) },
        { name: "q2", values: q2, tones: t2, pointers: pointersAt(q2.length, ends(q2), { back: "tertiary" }) },
      ],
    });

    r.step(3, `Two queues. The rule we keep: **q1 holds every item newest-first**, so q1's front is always the stack's top. q2 is an empty helper used only during a push.`, {
      ...view(),
      vars: { size: 0 },
    });

    for (const op of ops) {
      if (op.name === "push") {
        q2.push(op.arg!);
        r.step(7, `**push ${op.arg}** — ${op.arg} goes into the **empty** q2 first, so it will be at the front.`, {
          ...view({}, { 0: "write" }),
          vars: { size: q1.length + q2.length },
        });
        if (q1.length) {
          const moved = [...q1];
          q2 = [...q2, ...q1];
          q1 = [];
          r.step(8, `Move q1's ${moved.length} item${moved.length === 1 ? "" : "s"} (${moved.join(", ")}) behind it, one dequeue and one enqueue each. Their order doesn't change: they were newest-first, and they stay that way **behind** ${op.arg}. This is the O(n) part.`, {
            ...view({}, { 0: "write", ...Object.fromEntries(moved.map((_, i) => [i + 1, "done" as CellTone])) }),
            vars: { size: q2.length, moved: moved.length },
          });
        }
        [q1, q2] = [q2, q1];
        r.step(9, `Swap the names: q1 = [${q1.join(", ")}] — newest-first again, with ${op.arg} at the front — and q2 is empty, ready for the next push.`, {
          ...view({ 0: "primary" }),
          vars: { size: q1.length },
        });
      } else if (op.name === "pop") {
        const x = q1.shift()!;
        r.step(12, `**pop** — q1's front is the newest item, so a plain dequeue returns **${x}**. **O(1)**.`, {
          ...view(),
          vars: { returned: x, size: q1.length },
        });
      } else if (op.name === "top") {
        r.step(15, `**top** reads q1's front: **${q1[0]}**. **O(1)**.`, { ...view({ 0: "tertiary" }), vars: { returned: q1[0], size: q1.length } });
      } else {
        r.step(18, `**empty** → **${q1.length === 0}**.`, { ...view(), vars: { returned: String(q1.length === 0), size: q1.length } });
      }
    }

    r.step(3, `Done. q1 always holds the items **newest-first**, so pop and top are O(1); each push pays **O(n)** to move the older items behind the new one.`, {
      ...view(),
      vars: { size: q1.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
