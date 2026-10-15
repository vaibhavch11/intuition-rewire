import { lineOf } from "../graphs";
import { tagsAt } from "../structures";
import { recorder, type ListLink, type ListView, type Program } from "../types";

const code = `function insertEnd(tail, val) {      // the ring is held by its tail; tail.next is the head
  const node = new ListNode(val);
  if (tail === null) {               // empty ring: one node pointing at itself
    node.next = node;
    return node;
  }
  node.next = tail.next;             // the new node points at the head
  tail.next = node;                  // the old tail points at the new node
  return node;                       // the new node is the new tail
}`;

const NEW = 100;

const program: Program = {
  title: "Insert at the end of a circular list",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 5 },
    { key: "val", label: "new value", kind: "number" },
  ],
  examples: [
    { label: "Example", input: { head: [10, 20, 30], val: 40 } },
    { label: "One node", input: { head: [10], val: 20 } },
  ],
  run(input) {
    const values = input.head as number[];
    const val = input.val as number;
    const n = values.length;
    const r = recorder();
    const tailId = n - 1;
    // next pointers by id; the new node waits in the column after the tail.
    const next = new Map<number, number | null>(values.map((_, i) => [i, (i + 1) % n]));
    next.set(NEW, null);
    let tail = tailId;

    const frame = (hot: number[] = []) => {
      const links: ListLink[] = [];
      for (const [from, to] of next) if (to !== null) links.push({ from, to, tone: hot.includes(from) ? "active" : undefined });
      const view: ListView = {
        name: "ring",
        nodes: [...values.map((value, i) => ({ id: i, value, col: i })), { id: NEW, value: val, col: n, tone: "write" as const }],
        links,
        pointers: tagsAt({ head: 0, tail, ...(tail !== NEW ? { node: NEW } : {}) }, { head: "secondary", tail: "tertiary", node: "muted" }),
      };
      return { lists: [view], vars: { "tail.next (the head)": values[0] } };
    };

    r.step(lineOf(code, "const node = new ListNode(val)"), `The ring is held by its **tail**, ${values[tailId]}: \`tail.next\` is the head, so both ends are one step away. Create the new node ${val}.`, frame());
    next.set(NEW, 0);
    r.step(lineOf(code, "node.next = tail.next;"), `The new node will be the last one, so it must point back at the **head**: \`node.next = tail.next\` (${values[0]}).`, frame([NEW]));
    next.set(tailId, NEW);
    r.step(lineOf(code, "tail.next = node;"), `The old tail, ${values[tailId]}, now points at the new node instead of the head. The ring is closed again, one node bigger.`, frame([tailId]));
    tail = NEW;
    r.step(lineOf(code, "return node;                       // the new node is the new tail"), `Return the new node: it's the **new tail**, and its next is still the head. Two pointer changes, no walk: **O(1)** — that's why circular lists are held by the tail.`, { ...frame(), done: true });
    return r.frames;
  },
};

export default program;
