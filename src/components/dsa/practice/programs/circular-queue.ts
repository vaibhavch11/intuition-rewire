import { parseOps, type Op } from "../structures";
import { pointersAt, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `class ArrayQueue {
  constructor() {
    this.data = new Array(4);   // the slots; the queue wraps around them
    this.head = 0;              // index of the front item
    this.count = 0;             // how many items are stored
  }
  enqueue(x) {
    if (this.count === this.data.length) this.grow();   // full: double first
    const tail = (this.head + this.count) % this.data.length;
    this.data[tail] = x;        // the slot after the last item, wrapping to 0
    this.count++;
  }
  dequeue() {
    if (this.count === 0) return -1;                     // underflow
    const x = this.data[this.head];
    this.head = (this.head + 1) % this.data.length;      // the front moves on, wrapping
    this.count--;
    return x;
  }
  front() {
    return this.count === 0 ? -1 : this.data[this.head];
  }
  isEmpty() {
    return this.count === 0;
  }
  size() {
    return this.count;
  }
  grow() {
    const bigger = new Array(this.data.length * 2);
    for (let i = 0; i < this.count; i++) {
      bigger[i] = this.data[(this.head + i) % this.data.length];   // unwrap, front first
    }
    this.data = bigger;
    this.head = 0;
  }
}`;

const WITH_ARG = ["enqueue"];
const NO_ARG = ["dequeue", "front", "isEmpty", "size"];

const program: Program = {
  title: "Queue on a circular array (wrap around, then double)",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 180, hint: "enqueue 1, enqueue 2, dequeue, enqueue 3" }],
  examples: [
    { label: "Wrap around", input: { ops: "enqueue 1, enqueue 2, enqueue 3, dequeue, dequeue, enqueue 4, enqueue 5, enqueue 6" } },
    { label: "Full, so double", input: { ops: "enqueue 1, enqueue 2, enqueue 3, dequeue, enqueue 4, enqueue 5, enqueue 6, front" } },
    { label: "Underflow", input: { ops: "enqueue 9, dequeue, dequeue, isEmpty" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10) as Op[];
    const r = recorder();
    let data: Scalar[] = [null, null, null, null];
    let live: boolean[] = [false, false, false, false];
    let head = 0;
    let count = 0;

    const view = (tones: Record<number, CellTone> = {}, name = "data") => {
      const cap = data.length;
      const all: Record<number, CellTone> = {};
      // Served items stay in their slots until overwritten: greyed out, not live.
      data.forEach((v, i) => {
        if (v !== null && !live[i]) all[i] = "muted";
      });
      Object.assign(all, tones);
      const last = (head + count - 1) % cap;
      const marks = count === 0 ? { head } : count === 1 ? { "front = back": head } : { front: head, back: last };
      return {
        arrays: [{ name: `${name} (capacity ${cap})`, values: data, tones: all, pointers: pointersAt(cap, marks, { back: "tertiary", head: "muted" }) }],
      };
    };

    r.step(3, `Start with **4 slots**. \`head\` is the front item's index and \`count\` how many items are stored — the back is worked out from them. No slot is ever shifted; instead, indexes **wrap around** with \`% capacity\`.`, {
      ...view(),
      vars: { head, count, capacity: 4 },
    });

    for (const op of ops) {
      const cap = data.length;
      if (op.name === "enqueue") {
        if (count === cap) {
          r.step(8, `**enqueue ${op.arg}** — but count = capacity = ${cap}: every slot holds a live item. Grow first.`, {
            ...view(),
            vars: { head, count, capacity: cap },
          });
          const bigger: Scalar[] = Array(cap * 2).fill(null);
          const order: number[] = [];
          for (let i = 0; i < count; i++) {
            bigger[i] = data[(head + i) % cap];
            order.push((head + i) % cap);
          }
          data = bigger;
          live = bigger.map((_, i) => i < count);
          head = 0;
          r.step(34, `**grow** copies the ${count} items into ${cap * 2} slots **front first** — reading slots ${order.join(", ")} of the old array — so the queue is unwrapped: the front lands at index 0 and \`head\` resets to 0. This copy is O(n), but it only happens when the array doubles, so enqueue stays **O(1) amortized**.`, {
            ...view(Object.fromEntries(Array.from({ length: count }, (_, i) => [i, "done" as CellTone]))),
            vars: { head, count, capacity: cap * 2 },
          });
        }
        const capNow = data.length;
        const tail = (head + count) % capNow;
        const wrapped = head + count >= capNow;
        data[tail] = op.arg!;
        live[tail] = true;
        count++;
        r.step(10, `**enqueue ${op.arg}** — tail = (head + count) % capacity = (${head} + ${count - 1}) % ${capNow} = **${tail}**${wrapped ? `. That's past the end, so it **wraps around** to slot ${tail}` : ""}. Write ${op.arg} there.`, {
          ...view({ [tail]: "write" }),
          vars: { head, count, capacity: capNow },
        });
      } else if (op.name === "dequeue") {
        if (count === 0) {
          r.step(14, `**dequeue** on an empty queue — **underflow**. Return -1.`, { ...view(), vars: { head, count, capacity: cap, returned: -1 } });
          continue;
        }
        const x = data[head] as number;
        const old = head;
        live[old] = false;
        head = (head + 1) % cap;
        count--;
        r.step(16, `**dequeue** returns the front, **${x}**. Then head = (${old} + 1) % ${cap} = **${head}**${old === cap - 1 ? " — the front wraps back to slot 0" : ""}. Slot ${old} keeps its old value, but it's free now and will be overwritten.`, {
          ...view({ [old]: "muted" }),
          vars: { head, count, capacity: cap, returned: x },
        });
      } else if (op.name === "front") {
        r.step(21, count ? `**front** reads slot head = ${head}: **${data[head]}**.` : `**front** on an empty queue returns -1.`, {
          ...view(count ? { [head]: "tertiary" } : {}),
          vars: { head, count, capacity: cap, returned: count ? (data[head] as number) : -1 },
        });
      } else if (op.name === "isEmpty") {
        r.step(24, `**isEmpty** → **${count === 0}**.`, { ...view(), vars: { head, count, capacity: cap, returned: String(count === 0) } });
      } else {
        r.step(27, `**size** → **${count}**.`, { ...view(), vars: { head, count, capacity: cap, returned: count } });
      }
    }

    r.step(3, `Done. Enqueue and dequeue only move \`head\` or write one slot, with \`% capacity\` turning the array into a ring — **O(1)**, plus an occasional O(n) doubling that averages out to **O(1) amortized**.`, {
      ...view(),
      vars: { head, count, capacity: data.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
