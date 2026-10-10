import { NULL_ID, parseOps, tagsAt, type Op } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type ListView, type Program } from "../types";

const code = `class LinkedQueue {
  constructor() {
    this.head = null;        // the front: dequeue here
    this.tail = null;        // the back: enqueue here
    this.count = 0;
  }
  enqueue(x) {
    const node = new ListNode(x);
    if (this.tail === null) this.head = node;   // empty: the node is both ends
    else this.tail.next = node;                 // link it after the old back
    this.tail = node;
    this.count++;
  }
  dequeue() {
    if (this.head === null) return -1;          // underflow
    const x = this.head.val;
    this.head = this.head.next;                 // the front node falls away
    if (this.head === null) this.tail = null;   // the queue is empty again
    this.count--;
    return x;
  }
  front() {
    return this.head === null ? -1 : this.head.val;
  }
  isEmpty() {
    return this.count === 0;
  }
  size() {
    return this.count;
  }
}`;

const WITH_ARG = ["enqueue"];
const NO_ARG = ["dequeue", "front", "isEmpty", "size"];

const program: Program = {
  title: "A queue built on a linked list (head and tail)",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "enqueue 10, enqueue 20, dequeue, front" }],
  examples: [
    { label: "Join and leave", input: { ops: "enqueue 10, enqueue 20, enqueue 30, dequeue, front, enqueue 40" } },
    { label: "Empty again", input: { ops: "enqueue 5, dequeue, enqueue 6, front, dequeue, dequeue" } },
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
        tone: (i + 1 < shown.length && shown[i + 1].id === opts.fresh ? "active" : n.id === opts.leaving?.id ? "muted" : "idle") as EdgeTone,
      }));
      const head = nodes.length ? nodes[0].id : NULL_ID;
      const tail = nodes.length ? nodes[nodes.length - 1].id : NULL_ID;
      return {
        name: "queue (head = front, tail = back)",
        nodes: listNodes,
        links,
        pointers: tagsAt(head === tail ? { "head = tail": head } : { head, tail }, { tail: "tertiary" }),
      };
    };

    r.step(3, `An empty queue: \`head\` and \`tail\` are both null. Items will **leave at the head** and **join at the tail** — the two ends a singly linked list can change in O(1).`, {
      lists: [view()],
      vars: { count: 0 },
    });

    for (const op of ops) {
      if (op.name === "enqueue") {
        const node = { id: nextId++, val: op.arg! };
        const wasEmpty = nodes.length === 0;
        nodes = [...nodes, node];
        r.step(
          wasEmpty ? 9 : 10,
          wasEmpty
            ? `**enqueue ${op.arg}** into an empty queue: the new node is the front **and** the back, so \`head\` and \`tail\` both point at it.`
            : `**enqueue ${op.arg}** — link it after the old back (${nodes[nodes.length - 2].val}) and move \`tail\` to it. No walking down the list: **O(1)**.`,
          { lists: [view({ tones: { [node.id]: "write" }, fresh: node.id })], vars: { count: nodes.length } }
        );
      } else if (op.name === "dequeue") {
        if (nodes.length === 0) {
          r.step(15, `**dequeue** with \`head\` = null — nothing to remove (**underflow**). Return -1.`, {
            lists: [view()],
            vars: { returned: -1, count: 0 },
          });
          continue;
        }
        const [gone, ...rest] = nodes;
        nodes = rest;
        r.step(
          nodes.length ? 17 : 18,
          nodes.length
            ? `**dequeue** — remember ${gone.val}, then move \`head\` to the next node. The old front is no longer reachable, so it falls away: **O(1)**.`
            : `**dequeue** — ${gone.val} was the only node, so \`head\` becomes null… and \`tail\` must be set to null **too**. Forget this line and \`tail\` still points at the removed node — the next enqueue would link onto a node that isn't in the queue.`,
          { lists: [view({ leaving: gone })], vars: { returned: gone.val, count: nodes.length } }
        );
      } else if (op.name === "front") {
        r.step(23, nodes.length ? `**front** reads \`head.val\` = **${nodes[0].val}**.` : `**front** on an empty queue returns -1.`, {
          lists: [view({ tones: nodes.length ? { [nodes[0].id]: "tertiary" } : {} })],
          vars: { returned: nodes.length ? nodes[0].val : -1, count: nodes.length },
        });
      } else if (op.name === "isEmpty") {
        r.step(26, `**isEmpty** → **${nodes.length === 0}**.`, { lists: [view()], vars: { returned: String(nodes.length === 0), count: nodes.length } });
      } else {
        r.step(29, `**size** → **${nodes.length}**.`, { lists: [view()], vars: { returned: nodes.length, count: nodes.length } });
      }
    }

    r.step(3, `Done. Enqueue only touches \`tail\` and dequeue only touches \`head\`, so both are **O(1)** — and the queue never runs out of room until memory does.`, {
      lists: [view()],
      vars: { count: nodes.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
