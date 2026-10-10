import { tagsAt } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`;

// Node i (value values[i]) has id i and sits in column i + 1, between two null boxes.
const LEFT_NULL = -2;
const RIGHT_NULL = -1;

const program: Program = {
  title: "Reverse a linked list (three pointers)",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 7 }],
  examples: [
    { label: "Example", input: { head: [1, 2, 3, 4, 5] } },
    { label: "Two nodes", input: { head: [1, 2] } },
    { label: "One node", input: { head: [7] } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();
    const next: number[] = values.map((_, i) => (i + 1 < n ? i + 1 : RIGHT_NULL));
    const flipped = new Set<number>();
    let prev: number = LEFT_NULL;
    let curr: number = n > 0 ? 0 : RIGHT_NULL;

    const view = (marks: Record<string, number>, tones: Record<number, CellTone> = {}, fresh?: number) => {
      const nodes: ListNodeView[] = [
        { id: LEFT_NULL, value: null, col: 0 },
        ...values.map((value, i) => ({ id: i, value, col: i + 1, tone: tones[i] ?? (flipped.has(i) ? ("done" as const) : undefined) })),
        { id: RIGHT_NULL, value: null, col: n + 1 },
      ];
      const links: ListLink[] = values.map((_, i) => ({
        from: i,
        to: next[i],
        tone: (i === fresh ? "active" : flipped.has(i) ? "done" : "idle") as EdgeTone,
      }));
      return {
        name: "list",
        nodes,
        links,
        pointers: tagsAt(marks, { prev: "tertiary", next: "muted", head: "secondary" }),
      };
    };

    r.step(3, `Two pointers to start: \`prev\` is **null** (nothing is reversed yet) and \`curr\` is the head, ${n > 0 ? values[0] : "null"}.`, {
      lists: [view({ prev, curr })],
      vars: { prev: "null", curr: n > 0 ? values[0] : "null" },
    });

    while (curr !== RIGHT_NULL) {
      const nxt = next[curr];
      r.step(5, `Before touching \`curr.next\`, save where it points: \`next = ${nxt === RIGHT_NULL ? "null" : values[nxt]}\`. Without this, the rest of the list would be lost.`, {
        lists: [view({ prev, curr, next: nxt }, { [curr]: "primary" })],
        vars: { prev: prev === LEFT_NULL ? "null" : values[prev], curr: values[curr], next: nxt === RIGHT_NULL ? "null" : values[nxt] },
      });

      next[curr] = prev;
      flipped.add(curr);
      r.step(6, `Flip the arrow: \`curr.next = prev\`. Node ${values[curr]} now points back to ${prev === LEFT_NULL ? "null" : values[prev]}.`, {
        lists: [view({ prev, curr, next: nxt }, { [curr]: "write" }, curr)],
        vars: { prev: prev === LEFT_NULL ? "null" : values[prev], curr: values[curr], next: nxt === RIGHT_NULL ? "null" : values[nxt] },
      });

      prev = curr;
      curr = nxt;
      r.step(8, `Move both pointers one step forward: \`prev = ${values[prev]}\`, \`curr = ${curr === RIGHT_NULL ? "null" : values[curr]}\`.`, {
        lists: [view({ prev, curr })],
        vars: { prev: values[prev], curr: curr === RIGHT_NULL ? "null" : values[curr] },
      });
    }

    r.step(
      10,
      n === 0
        ? `The list was empty, so there's nothing to reverse: return null.`
        : `\`curr\` fell off the end, so every arrow is flipped. \`prev\` (${values[prev]}) is the **new head**. Each node was visited once: **O(n) time, O(1) space**.`,
      {
        lists: [view({ head: prev }, Object.fromEntries(values.map((_, i) => [i, "success" as CellTone])))],
        vars: { "new head": prev === LEFT_NULL ? "null" : values[prev] },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
