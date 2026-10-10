import { parseOps, type Op } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `class MyQueue {
  constructor() {
    this.inbox = [];         // new items are pushed here
    this.outbox = [];        // items leave from here: oldest on top
  }
  push(x) {
    this.inbox.push(x);      // O(1): just drop it on the inbox
  }
  pop() {
    this.peek();             // makes sure the oldest item is on top of outbox
    return this.outbox.pop();
  }
  peek() {
    if (this.outbox.length === 0) {
      while (this.inbox.length > 0) this.outbox.push(this.inbox.pop());   // pour: the order flips
    }
    return this.outbox[this.outbox.length - 1];
  }
  empty() {
    return this.inbox.length === 0 && this.outbox.length === 0;
  }
}`;

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "peek", "empty"];

const program: Program = {
  title: "A queue using two stacks (pour only when empty)",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 180, hint: "push 1, push 2, peek, pop" }],
  examples: [
    { label: "Pour once, pop many", input: { ops: "push 1, push 2, push 3, pop, push 4, pop, pop, pop" } },
    { label: "Peek, then pop", input: { ops: "push 5, push 6, peek, pop, empty, pop, empty" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10);
    if (typeof ops === "string") return ops;
    let size = 0;
    for (const op of ops) {
      if (op.name === "push") size++;
      else if (op.name !== "empty" && size === 0) return `"${op.name}" on an empty queue isn't allowed in this problem — push something first.`;
      else if (op.name === "pop") size--;
    }
    return null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10) as Op[];
    const r = recorder();
    const inbox: number[] = [];
    const outbox: number[] = [];
    let moves = 0; // every single push or pop on either stack
    let calls = 0;

    const view = (inTones: Record<number, CellTone> = {}, outTones: Record<number, CellTone> = {}) => ({
      stacks: [
        { name: "inbox", values: inbox, tones: inTones },
        { name: "outbox", values: outbox, tones: outTones, topLabel: "top = front of the queue" },
      ],
    });
    const vars = (extra: Record<string, unknown> = {}) => ({ ...extra, "stack moves": moves, "queue calls": calls });

    r.step(3, `Two stacks. New items go on the **inbox**; items leave from the **outbox**, where the **oldest** item sits on top. Moving items from one stack to the other reverses their order — that's the whole trick.`, {
      ...view(),
      vars: vars(),
    });

    // Pours the inbox into an empty outbox, as peek does; returns whether it poured.
    const pour = (why: string) => {
      if (outbox.length > 0) return false;
      const moved = [...inbox].reverse();
      while (inbox.length) outbox.push(inbox.pop()!);
      moves += moved.length * 2;
      r.step(15, `${why} The outbox is empty, so **pour**: pop each item off the inbox and push it onto the outbox — ${moved.join(", ")}. The order flips, so the **oldest** item, ${outbox[outbox.length - 1]}, ends up on top. Each item is poured **once** in its life.`, {
        ...view({}, Object.fromEntries(outbox.map((_, i) => [i, "done" as CellTone]))),
        vars: vars(),
      });
      return true;
    };

    for (const op of ops) {
      calls++;
      if (op.name === "push") {
        inbox.push(op.arg!);
        moves++;
        r.step(7, `**push ${op.arg}** — drop it on the inbox. **O(1)**, no matter what the outbox holds.`, {
          ...view({ [inbox.length - 1]: "write" }),
          vars: vars(),
        });
      } else if (op.name === "pop") {
        const poured = pour(`**pop** needs the oldest item.`);
        const x = outbox.pop()!;
        moves++;
        r.step(11, `**pop** takes the outbox's top: **${x}**, the oldest item still waiting.${poured ? "" : " The outbox wasn't empty, so nothing had to move: **O(1)**."}`, {
          ...view(),
          vars: vars({ returned: x }),
        });
      } else if (op.name === "peek") {
        const poured = pour(`**peek** needs the oldest item.`);
        r.step(17, `**peek** reads the outbox's top: **${outbox[outbox.length - 1]}**.${poured ? "" : " No pouring needed: **O(1)**."}`, {
          ...view({}, { [outbox.length - 1]: "tertiary" }),
          vars: vars({ returned: outbox[outbox.length - 1] }),
        });
      } else {
        const isEmpty = inbox.length === 0 && outbox.length === 0;
        r.step(20, `**empty** — both stacks must be empty: **${isEmpty}**.`, { ...view(), vars: vars({ returned: String(isEmpty) }) });
      }
    }

    r.step(3, `Done: **${moves}** stack moves for **${calls}** queue calls. An item is pushed on the inbox, poured once, and popped from the outbox — at most **4 moves in its whole life** — so even though one pour can be slow, every call is **O(1) amortized**.`, {
      ...view(),
      vars: vars(),
      done: true,
    });
    return r.frames;
  },
};

export default program;
