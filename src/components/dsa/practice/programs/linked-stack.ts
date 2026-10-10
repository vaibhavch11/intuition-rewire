import { NULL_ID, parseOps, tagsAt, type Op } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type ListView, type Program } from "../types";

const code = `class LinkedStack {
  constructor() {
    this.head = null;        // the top of the stack
    this.count = 0;
  }
  push(x) {
    const node = new ListNode(x);
    node.next = this.head;   // the new node points at the old top
    this.head = node;        // and becomes the new top
    this.count++;
  }
  pop() {
    if (this.head === null) return null;   // underflow
    const x = this.head.val;
    this.head = this.head.next;            // the old top falls away
    this.count--;
    return x;
  }
  peek() {
    return this.head === null ? null : this.head.val;
  }
}`;

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "peek"];

const program: Program = {
  title: "A stack built on a linked list",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "push 10, push 20, pop, peek" }],
  examples: [
    { label: "Push and pop", input: { ops: "push 10, push 20, push 30, pop, peek, push 40" } },
    { label: "Underflow", input: { ops: "push 5, pop, pop" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG, 10) as Op[];
    const r = recorder();
    // Node ids are stable so a node keeps its identity as the list shifts.
    let nextId = 0;
    let nodes: { id: number; val: number }[] = []; // head first

    const view = (
      opts: { tones?: Record<number, CellTone>; fresh?: number; leaving?: { id: number; val: number } } = {}
    ): ListView => {
      const shown = opts.leaving ? [opts.leaving, ...nodes] : nodes;
      const listNodes: ListNodeView[] = shown.map((n, col) => ({
        id: n.id,
        value: n.val,
        col,
        tone: opts.tones?.[n.id] ?? (n.id === opts.leaving?.id ? "muted" : undefined),
      }));
      listNodes.push({ id: NULL_ID, value: null, col: shown.length });
      const links: ListLink[] = shown.map((n, i) => ({
        from: n.id,
        to: i + 1 < shown.length ? shown[i + 1].id : NULL_ID,
        tone: (n.id === opts.fresh ? "active" : n.id === opts.leaving?.id ? "muted" : "idle") as EdgeTone,
      }));
      return {
        name: "stack (head = top)",
        nodes: listNodes,
        links,
        pointers: tagsAt({ head: nodes.length ? nodes[0].id : NULL_ID }),
      };
    };

    r.step(3, `An empty stack: \`head\` is null. The **head** of the list will always be the **top** of the stack.`, {
      lists: [view()],
      vars: { count: 0 },
    });

    for (const op of ops) {
      if (op.name === "push") {
        const node = { id: nextId++, val: op.arg! };
        nodes = [node, ...nodes];
        r.step(9, `**push ${op.arg}** — a new node is created, its \`next\` points at the old top${nodes.length > 1 ? ` (${nodes[1].val})` : " (null)"}, and \`head\` moves to it. No other node is touched: **O(1)**.`, {
          lists: [view({ tones: { [node.id]: "write" }, fresh: node.id })],
          vars: { count: nodes.length },
        });
      } else if (op.name === "pop") {
        if (nodes.length === 0) {
          r.step(13, `**pop** with \`head\` = null — nothing to remove (**underflow**). Return null.`, {
            lists: [view()],
            vars: { returned: "null", count: 0 },
          });
          continue;
        }
        const [gone, ...rest] = nodes;
        nodes = rest;
        r.step(15, `**pop** — remember ${gone.val}, then move \`head\` to the next node. The old top is no longer reachable, so it falls away.`, {
          lists: [view({ leaving: gone })],
          vars: { returned: gone.val, count: nodes.length },
        });
      } else {
        r.step(20, nodes.length ? `**peek** reads \`head.val\` = **${nodes[0].val}** without changing anything.` : `**peek** on an empty stack returns null.`, {
          lists: [view({ tones: nodes.length ? { [nodes[0].id]: "tertiary" } : {} })],
          vars: { returned: nodes.length ? nodes[0].val : "null", count: nodes.length },
        });
      }
    }

    r.step(3, `Done. push and pop only ever change \`head\`, so both are **O(1)**, and the stack never runs out of room until memory does.`, {
      lists: [view()],
      vars: { count: nodes.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
