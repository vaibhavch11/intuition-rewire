import { NULL_ID, tagsAt } from "../structures";
import { recorder, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function insertAtHead(head, x) {
  const node = new ListNode(x);
  node.next = head;
  return node;   // the new head
}`;

const NEW = 100;

const program: Program = {
  title: "Insert at the front of a linked list",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 6 },
    { key: "x", label: "new value", kind: "number" },
  ],
  examples: [
    { label: "Example", input: { head: [10, 20, 30, 40], x: 5 } },
    { label: "Longer", input: { head: [1, 2, 3, 4, 5, 6], x: 0 } },
  ],
  run(input) {
    const values = input.head as number[];
    const x = input.x as number;
    const n = values.length;
    const r = recorder();

    // Existing nodes sit in columns 1..n; the new node waits in column 0.
    const view = (stage: number) => {
      const nodes: ListNodeView[] = [
        ...values.map((value, i) => ({ id: i, value, col: i + 1 })),
        { id: NULL_ID, value: null, col: n + 1 },
      ];
      const links: ListLink[] = values.map((_, i) => ({ from: i, to: i + 1 < n ? i + 1 : NULL_ID }));
      if (stage >= 1) nodes.push({ id: NEW, value: x, col: 0, tone: stage >= 3 ? "success" : "write" });
      if (stage >= 2) links.push({ from: NEW, to: 0, tone: "active" });
      const head = stage >= 3 ? NEW : 0;
      return { name: "list", nodes, links, pointers: tagsAt({ head, ...(stage >= 1 && stage < 3 ? { node: NEW } : {}) }, { head: "secondary" }) };
    };

    r.step(1, `The list starts at \`head\` (${values[0]}). We want **${x}** in front of it.`, { lists: [view(0)], vars: {} });
    r.step(2, `Create a new node holding ${x}. It isn't connected to anything yet.`, { lists: [view(1)], vars: { "node.val": x } });
    r.step(3, `Point the new node at the current head: \`node.next = head\`. Nothing else moves.`, { lists: [view(2)], vars: { "node.next": values[0] } });
    r.step(4, `Return the new node as the **head**. That's it: **2 pointer changes** no matter how long the list is — **O(1)**.`, {
      lists: [view(3)],
      vars: { head: x },
      done: true,
    });
    return r.frames;
  },
};

export default program;
