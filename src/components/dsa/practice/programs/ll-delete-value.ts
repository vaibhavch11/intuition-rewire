import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function deleteValue(head, x) {
  if (head === null) return null;
  if (head.val === x) return head.next;
  let prev = head;
  while (prev.next !== null && prev.next.val !== x) {
    prev = prev.next;
  }
  if (prev.next !== null) {
    prev.next = prev.next.next;
  }
  return head;
}`;

const program: Program = {
  title: "Delete the first node with a value",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 7 },
    { key: "x", label: "value to delete", kind: "number" },
  ],
  examples: [
    { label: "Middle", input: { head: [10, 20, 30, 40], x: 30 } },
    { label: "Head", input: { head: [10, 20, 30, 40], x: 10 } },
    { label: "Not found", input: { head: [10, 20, 30], x: 99 } },
  ],
  run(input) {
    const values = input.head as number[];
    const x = input.x as number;
    const n = values.length;
    const r = recorder();
    const next: number[] = values.map((_, i) => (i + 1 < n ? i + 1 : NULL_ID));
    let removed = -1;
    let head = 0;

    const view = (marks: Record<string, number>, tones: Record<number, CellTone> = {}, fresh?: number) => {
      const nodes: ListNodeView[] = [
        ...values.map((value, i) => ({ id: i, value, col: i, row: i === removed ? 1 : 0, tone: i === removed ? ("muted" as const) : tones[i] })),
        { id: NULL_ID, value: null, col: n },
      ];
      const links: ListLink[] = values.map((_, i) => ({
        from: i,
        to: next[i],
        tone: (i === removed ? "muted" : i === fresh ? "active" : "idle") as EdgeTone,
      }));
      return { name: "list", nodes, links, pointers: tagsAt({ head, ...marks }, { head: "secondary", prev: "tertiary" }) };
    };

    if (values[0] === x) {
      r.step(3, `The head itself holds ${x}. Just move the head forward: return \`head.next\`. **O(1)**.`, { lists: [view({}, { 0: "primary" })], vars: { x } });
      removed = 0;
      head = n > 1 ? 1 : NULL_ID;
      r.step(3, `The new head is ${n > 1 ? values[1] : "null"}. Nothing points to ${x} any more, so it's gone from the list.`, {
        lists: [view({})],
        vars: { head: n > 1 ? values[1] : "null" },
        done: true,
      });
      return r.frames;
    }

    let prev = 0;
    r.step(4, `To delete a node, we must change the arrow **into** it — so we look for the node **before** it. Start \`prev\` at the head.`, {
      lists: [view({ prev }, { [prev]: "primary" })],
      vars: { x, prev: values[prev] },
    });
    while (next[prev] !== NULL_ID && values[next[prev]] !== x) {
      r.step(5, `\`prev.next\` holds ${values[next[prev]]}, not ${x}. Keep walking.`, {
        lists: [view({ prev }, { [prev]: "primary", [next[prev]]: "tertiary" })],
        vars: { prev: values[prev], "prev.next": values[next[prev]] },
      });
      prev = next[prev];
      r.step(6, `\`prev = prev.next\` → ${values[prev]}.`, { lists: [view({ prev }, { [prev]: "primary" })], vars: { prev: values[prev] } });
    }

    if (next[prev] === NULL_ID) {
      r.step(8, `We reached the end without finding ${x}, so nothing is deleted. Searching cost **O(n)**.`, {
        lists: [view({ prev }, { [prev]: "primary" })],
        vars: { found: "no" },
        done: true,
      });
      return r.frames;
    }

    const target = next[prev];
    r.step(8, `Found it: \`prev.next\` is the node holding ${x}.`, {
      lists: [view({ prev }, { [prev]: "primary", [target]: "write" })],
      vars: { prev: values[prev], "prev.next": x },
    });
    next[prev] = next[target];
    removed = target;
    r.step(9, `Skip over it: \`prev.next = prev.next.next\`. The arrow now jumps from ${values[prev]} straight to ${next[prev] === NULL_ID ? "null" : values[next[prev]]}.`, {
      lists: [view({ prev }, { [prev]: "primary" }, prev)],
      vars: { "prev.next": next[prev] === NULL_ID ? "null" : values[next[prev]] },
    });
    r.step(11, `Nothing points to ${x} any more, so it's out of the list (garbage collection frees it). Finding it cost **O(n)**; unlinking it was **O(1)**.`, {
      lists: [view({})],
      vars: { deleted: x },
      done: true,
    });
    return r.frames;
  },
};

export default program;
