import { parseOps, type Op } from "../structures";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `class SimpleQueue {
  constructor() {
    this.items = [];
    this.head = 0;                 // index of the front item
  }
  enqueue(x) {
    this.items.push(x);            // join at the back
  }
  dequeue() {
    if (this.isEmpty()) return undefined;   // underflow: nobody is waiting
    const x = this.items[this.head];
    this.head++;                   // the next item becomes the front
    return x;
  }
  peek() {
    return this.isEmpty() ? undefined : this.items[this.head];
  }
  isEmpty() {
    return this.size() === 0;
  }
  size() {
    return this.items.length - this.head;
  }
}`;

const WITH_ARG = ["enqueue"];
const NO_ARG = ["dequeue", "peek", "isEmpty", "size"];

const program: Program = {
  title: "Enqueue, dequeue and peek",
  code,
  fields: [
    { key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "enqueue 10, enqueue 20, dequeue, peek" },
  ],
  examples: [
    { label: "Join and leave", input: { ops: "enqueue 10, enqueue 20, enqueue 30, dequeue, peek, enqueue 40, size" } },
    { label: "First in, first out", input: { ops: "enqueue 1, enqueue 2, enqueue 3, dequeue, dequeue, dequeue" } },
    { label: "Underflow", input: { ops: "enqueue 7, dequeue, dequeue, isEmpty" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG) as Op[];
    const r = recorder();
    const items: number[] = [];
    let head = 0;
    const served: number[] = [];

    // Slots before head have already been served: they stay in the array, greyed out.
    const views = (tones: Record<number, CellTone> = {}, fresh = false) => {
      const all: Record<number, CellTone> = {};
      for (let i = 0; i < head; i++) all[i] = "muted";
      Object.assign(all, tones);
      const size = items.length - head;
      const marks = size === 0 ? {} : size === 1 ? { "front = back": head } : { front: head, back: items.length - 1 };
      return {
        arrays: [
          { name: "items", values: items, tones: all, pointers: pointersAt(items.length, marks, { back: "tertiary" }) },
          ...(served.length
            ? [{ name: "served, in order", values: served, tones: fresh ? { [served.length - 1]: "write" as CellTone } : {} }]
            : []),
        ],
      };
    };

    r.step(3, `An empty queue. New items join at the **back**; items leave from the **front**. \`head\` is the index of the front item.`, {
      ...views(),
      vars: { head, size: 0 },
    });

    for (const op of ops) {
      const size = items.length - head;
      if (op.name === "enqueue") {
        items.push(op.arg!);
        r.step(7, `**enqueue ${op.arg}** — ${op.arg} joins at the **back**${size > 0 ? `, behind ${items[items.length - 2]}` : ""}. Nobody else moves.`, {
          ...views({ [items.length - 1]: "write" }),
          vars: { head, size: size + 1 },
        });
      } else if (op.name === "dequeue") {
        if (size === 0) {
          r.step(10, `**dequeue** on an empty queue — nobody is waiting. This is **queue underflow**; the method returns \`undefined\` instead of crashing.`, {
            ...views(),
            vars: { head, returned: "undefined", size: 0 },
          });
          continue;
        }
        const x = items[head];
        head++;
        served.push(x);
        r.step(12, `**dequeue** serves the front item, **${x}** — the one that has waited longest. \`head\` moves one place on${size > 1 ? `, so ${items[head]} is the new front` : " and the queue is empty again"}. No item is shifted: **O(1)**.`, {
          ...views({}, true),
          vars: { head, returned: x, size: size - 1 },
        });
      } else if (op.name === "peek") {
        r.step(
          16,
          size
            ? `**peek** returns the front item, **${items[head]}**, and leaves it in place.`
            : `**peek** on an empty queue returns \`undefined\` — there is no front to look at.`,
          { ...views(size ? { [head]: "tertiary" } : {}), vars: { head, returned: size ? items[head] : "undefined", size } }
        );
      } else if (op.name === "isEmpty") {
        r.step(19, `**isEmpty** → **${size === 0}**.`, { ...views(), vars: { head, returned: String(size === 0), size } });
      } else {
        r.step(22, `**size** = items.length − head = ${items.length} − ${head} = **${size}**.`, {
          ...views(),
          vars: { head, returned: size, size },
        });
      }
    }

    r.step(
      3,
      served.length > 1
        ? `Done. Items were served in **the same order** they joined — first in, first out. Every operation was **O(1)**: enqueue touches only the back, dequeue only the front.`
        : `Done. Every operation was **O(1)**: enqueue touches only the back, dequeue only the front.`,
      { ...views(), vars: { head, size: items.length - head }, done: true }
    );
    return r.frames;
  },
};

export default program;
