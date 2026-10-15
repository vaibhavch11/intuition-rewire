import { lineOf } from "../graphs";
import { dlinked, tagsAt, type DNodeState } from "../structures";
import { recorder, type Program } from "../types";

const code = `function deleteValue(head, val) {
  let node = head;
  while (node !== null && node.val !== val) node = node.next;   // find it: O(n)
  if (node === null) return head;                                // not in the list
  // Unlink it in O(1): the node knows both of its neighbours.
  if (node.prev !== null) node.prev.next = node.next;
  else head = node.next;                                         // it was the head
  if (node.next !== null) node.next.prev = node.prev;
  return head;
}`;

const program: Program = {
  title: "Delete from a doubly linked list",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 6 },
    { key: "val", label: "value to delete", kind: "number" },
  ],
  examples: [
    { label: "Middle", input: { head: [10, 20, 30, 40], val: 30 } },
    { label: "Head", input: { head: [10, 20, 30], val: 10 } },
    { label: "Not there", input: { head: [10, 20, 30], val: 99 } },
  ],
  run(input) {
    const values = input.head as number[];
    const val = input.val as number;
    const n = values.length;
    const r = recorder();
    const nodes: DNodeState[] = values.map((value, i) => ({ id: i, value, prev: i > 0 ? i - 1 : null, next: i + 1 < n ? i + 1 : null }));
    let order = [...nodes];
    let head: number | null = n > 0 ? 0 : null;

    const frame = (marks: Record<string, number | null>, hot: string[] = [], tones: Record<number, "primary" | "write" | "muted"> = {}) => ({
      lists: [dlinked("list", order, { tones, pointers: tagsAt({ head, ...marks }, { head: "secondary", node: "tertiary" }), hot })],
      vars: { val },
    });

    let at: number | null = head;
    r.step(lineOf(code, "let node = head;"), `Start at the head and look for ${val}. Finding it is a normal forward walk.`, frame({ node: at }, [], at === null ? {} : { [at]: "primary" }));
    while (at !== null && values[at] !== val) {
      at = nodes[at].next;
      r.step(lineOf(code, "while (node !== null && node.val !== val)"), at === null ? `Walked past the tail onto null: ${val} isn't in the list.` : `${values[nodes[at].prev!]} isn't ${val}; move on to ${values[at]}.`, frame({ node: at }, [], at === null ? {} : { [at]: "primary" }));
    }
    if (at === null) {
      r.step(lineOf(code, "if (node === null) return head"), `Nothing to delete: the list is unchanged. The search cost **O(n)**.`, { ...frame({}), done: true });
      return r.frames;
    }

    const target = nodes[at];
    r.step(lineOf(code, "// Unlink it in O(1)"), `Found ${val}. In a singly linked list we'd now need the node **before** it — another search. Here the node already knows both neighbours: prev is ${target.prev === null ? "null" : values[target.prev]}, next is ${target.next === null ? "null" : values[target.next]}.`, frame({ node: at }, [], { [at]: "write" }));

    if (target.prev !== null) {
      nodes[target.prev].next = target.next;
      r.step(lineOf(code, "if (node.prev !== null) node.prev.next = node.next"), `${values[target.prev]}'s **next** skips over ${val} to ${target.next === null ? "null" : values[target.next]}.`, frame({ node: at }, [`${target.prev}.next`], { [at]: "write" }));
    } else {
      head = target.next;
      r.step(lineOf(code, "else head = node.next"), `${val} is the head, so there's no node before it: the **head** moves on to ${head === null ? "null (the list is now empty)" : values[head]}.`, frame({ node: at }, [], { [at]: "write" }));
    }
    if (target.next !== null) {
      nodes[target.next].prev = target.prev;
      r.step(lineOf(code, "if (node.next !== null) node.next.prev = node.prev"), `${values[target.next]}'s **prev** skips back over ${val} to ${target.prev === null ? "null — it's the new head" : values[target.prev]}.`, frame({ node: at }, [`${target.next}.prev`], { [at]: "write" }));
    } else {
      r.step(lineOf(code, "if (node.next !== null) node.next.prev = node.prev"), `${val} was the tail: nothing after it needs fixing.`, frame({ node: at }, [], { [at]: "write" }));
    }

    order = order.filter((x) => x.id !== at);
    r.step(lineOf(code, "return head;"), `Nothing points at ${val} any more, so it's gone from the list. Unlinking took **O(1)** — two pointer changes — and only finding the node cost O(n).`, { ...frame({}), done: true });
    return r.frames;
  },
};

export default program;
