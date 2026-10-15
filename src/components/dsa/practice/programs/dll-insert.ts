import { lineOf } from "../graphs";
import { dlinked, tagsAt, type DNodeState } from "../structures";
import { recorder, type Program } from "../types";

const code = `function insertAt(head, index, val) {
  const node = new Node(val);
  if (index === 0) {                               // the new node becomes the head
    node.next = head;
    if (head !== null) head.prev = node;
    return node;
  }
  let curr = head;
  for (let i = 0; i < index - 1; i++) curr = curr.next;   // the node before the gap
  node.prev = curr;                                // 1. back to curr
  node.next = curr.next;                           // 2. on to curr's old next
  if (curr.next !== null) curr.next.prev = node;   // 3. old next points back to it
  curr.next = node;                                // 4. curr points on to it
  return head;
}`;

const NEW = 100;

const program: Program = {
  title: "Insert into a doubly linked list",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 5 },
    { key: "index", label: "index", kind: "number", min: 0, max: 5 },
    { key: "val", label: "new value", kind: "number" },
  ],
  examples: [
    { label: "Middle", input: { head: [10, 20, 30, 40], index: 2, val: 25 } },
    { label: "Front", input: { head: [10, 20, 30], index: 0, val: 5 } },
    { label: "End", input: { head: [10, 20, 30], index: 3, val: 40 } },
  ],
  check(input) {
    const n = (input.head as number[]).length;
    return (input.index as number) > n ? `index can be 0 to ${n} (${n} means "after the last node").` : null;
  },
  run(input) {
    const values = input.head as number[];
    const index = input.index as number;
    const val = input.val as number;
    const n = values.length;
    const r = recorder();

    // Real pointer state, by id. The new node sits in its final column from the start.
    const nodes: DNodeState[] = values.map((value, i) => ({ id: i, value, prev: i > 0 ? i - 1 : null, next: i + 1 < n ? i + 1 : null }));
    const node: DNodeState = { id: NEW, value: val, prev: null, next: null };
    const order = [...nodes.slice(0, index), node, ...nodes.slice(index)];
    const byId = new Map(order.map((x) => [x.id, x]));
    let head = 0;
    const unset = new Set([`${NEW}.prev`, `${NEW}.next`]);

    const frame = (marks: Record<string, number | null>, hot: string[] = [], vars: Record<string, unknown> = {}) => ({
      lists: [
        dlinked("list", order, {
          tones: { [NEW]: "write" },
          pointers: tagsAt({ head, ...marks }, { head: "secondary", curr: "tertiary", node: "muted" }),
          hot,
          hidden: [...unset],
        }),
      ],
      vars,
    });

    r.step(lineOf(code, "const node = new Node(val)"), `Create the new node ${val}. Its **prev** and **next** start empty. A doubly linked insert has to set **four** pointers — two on the new node, and one on each neighbour.`, frame({ node: NEW }));

    if (index === 0) {
      node.next = n > 0 ? 0 : null;
      unset.delete(`${NEW}.next`);
      r.step(lineOf(code, "node.next = head;"), `Index 0: the new node goes in front. Point its **next** at the old head${n > 0 ? `, ${values[0]}` : ""}.`, frame({ node: NEW }, [`${NEW}.next`]));
      if (n > 0) {
        nodes[0].prev = NEW;
        r.step(lineOf(code, "if (head !== null) head.prev = node"), `The old head's **prev** was null; now it points back at ${val}.`, frame({ node: NEW }, ["0.prev"]));
      }
      unset.delete(`${NEW}.prev`);
      head = NEW;
      r.step(lineOf(code, "return node;"), `The new node is the **head**: its prev stays null. Inserting at the front is **O(1)**.`, { ...frame({}, []), done: true });
      return r.frames;
    }

    let curr = 0;
    r.step(lineOf(code, "let curr = head;"), `Walk to the node **before** the gap, index ${index - 1}.`, frame({ curr, node: NEW }, [], { curr: values[curr] }));
    for (let i = 0; i < index - 1; i++) {
      curr = curr + 1;
      r.step(lineOf(code, "for (let i = 0; i < index - 1; i++)"), `Move curr to ${values[curr]}.`, frame({ curr, node: NEW }, [], { curr: values[curr] }));
    }
    const after = byId.get(curr)!.next;

    node.prev = curr;
    unset.delete(`${NEW}.prev`);
    r.step(lineOf(code, "node.prev = curr;"), `**1.** The new node's **prev** points back at curr, ${values[curr]}.`, frame({ curr, node: NEW }, [`${NEW}.prev`], { curr: values[curr] }));
    node.next = after;
    unset.delete(`${NEW}.next`);
    r.step(lineOf(code, "node.next = curr.next;"), `**2.** Its **next** points at curr's old next: ${after === null ? "null — this is the new tail" : values[after]}. Nothing in the list points at the new node yet.`, frame({ curr, node: NEW }, [`${NEW}.next`], { curr: values[curr] }));
    if (after !== null) {
      byId.get(after)!.prev = NEW;
      r.step(lineOf(code, "if (curr.next !== null) curr.next.prev = node"), `**3.** The old next, ${values[after]}, now points **back** at the new node instead of at ${values[curr]}.`, frame({ curr, node: NEW }, [`${after}.prev`], { curr: values[curr] }));
    } else {
      r.step(lineOf(code, "if (curr.next !== null) curr.next.prev = node"), `**3.** curr was the tail, so there's no old next to point back — skip this one.`, frame({ curr, node: NEW }, [], { curr: values[curr] }));
    }
    byId.get(curr)!.next = NEW;
    r.step(lineOf(code, "curr.next = node;"), `**4.** Finally curr's **next** points at the new node. Doing this last means we never lost the old next.`, frame({ curr, node: NEW }, [`${curr}.next`], { curr: values[curr] }));
    r.step(lineOf(code, "return head;"), `${val} is linked both ways. The four pointer changes are **O(1)**; walking to index ${index} was **O(${index})** — O(n) in the worst case.`, { ...frame({}), done: true });
    return r.frames;
  },
};

export default program;
