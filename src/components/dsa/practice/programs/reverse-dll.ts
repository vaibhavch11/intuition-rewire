import { lineOf } from "../graphs";
import { dchain, NULL_ID, tagsAt } from "../structures";
import { recorder, type ListLink, type ListNodeView, type ListView, type Program } from "../types";

const code = `function reverseDLL(head) {
  let curr = head, newHead = null;
  while (curr !== null) {
    const next = curr.next;          // save it before the swap
    curr.next = curr.prev;           // swap the two pointers
    curr.prev = next;
    newHead = curr;                  // the last node handled is the new head
    curr = next;                     // move on (the old next)
  }
  return newHead;
}`;

const START = NULL_ID;
const END = NULL_ID - 1;

const program: Program = {
  title: "Reverse a doubly linked list (swap prev and next)",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 5 }],
  examples: [
    { label: "Example", input: { head: [1, 2, 3, 4] } },
    { label: "Two nodes", input: { head: [5, 9] } },
    { label: "One node", input: { head: [7] } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();
    const next: (number | null)[] = values.map((_, i) => (i + 1 < n ? i + 1 : null));
    const prev: (number | null)[] = values.map((_, i) => (i > 0 ? i - 1 : null));
    const swapped = new Set<number>();

    // Nodes keep their columns. A null pointer is drawn to the null box on the
    // side it now faces: a swapped node's next faces left, its prev right.
    const view = (curr: number | null, newHead: number | null, hot: number | null): ListView => {
      const nodes: ListNodeView[] = [
        { id: START, value: null, col: 0 },
        ...values.map((value, i) => ({ id: i, value, col: i + 1, tone: i === hot ? ("write" as const) : swapped.has(i) ? ("done" as const) : undefined })),
        { id: END, value: null, col: n + 1 },
      ];
      const links: ListLink[] = [];
      values.forEach((_, i) => {
        const flip = swapped.has(i);
        links.push({ from: i, to: next[i] ?? (flip ? START : END), tone: i === hot ? "active" : undefined });
        links.push({ from: i, to: prev[i] ?? (flip ? END : START), tone: i === hot ? "active" : undefined, kind: "prev" });
      });
      return {
        name: "list",
        nodes,
        links,
        pointers: tagsAt({ curr: curr ?? (newHead !== null ? END : undefined), newHead }, { newHead: "secondary", curr: "tertiary" }),
        doubly: true,
      };
    };

    let newHead: number | null = null;
    r.step(lineOf(code, "let curr = head, newHead = null"), `Every node already has both arrows, so reversing needs no extra pointers: just **swap each node's prev and next**. Next arrows run along the top, prev arrows along the bottom.`, { lists: [view(0, null, null)] });
    for (let curr: number | null = 0; curr !== null; ) {
      const after: number | null = next[curr];
      r.step(lineOf(code, "const next = curr.next;"), `Save ${values[curr]}'s next (${after === null ? "null" : values[after]}) — after the swap it would be lost.`, { lists: [view(curr, newHead, null)], vars: { next: after === null ? "null" : values[after] } });
      next[curr] = prev[curr];
      prev[curr] = after;
      swapped.add(curr);
      r.step(
        lineOf(code, "curr.next = curr.prev;"),
        `Swap: ${values[curr]}'s **next** now points ${next[curr] === null ? "to null (it will be the last node)" : `back to ${values[next[curr]!]}`}, and its **prev** points ${after === null ? "to null (it is the new head)" : `forward to ${values[after]}`}.`,
        { lists: [view(curr, newHead, curr)], vars: { next: after === null ? "null" : values[after] } }
      );
      newHead = curr;
      r.step(lineOf(code, "newHead = curr;"), `${values[curr]} is the last node handled so far, so it's the new head for now. Move on to the saved next${after === null ? ": null, so we're done" : `, ${values[after]}`}.`, { lists: [view(after, newHead, null)] });
      curr = after;
    }
    const reversed = [...values].reverse();
    r.step(lineOf(code, "return newHead;"), `Every node is swapped. Read from the new head: **${reversed.join(" ⇄ ")}**. One pass, three pointer moves per node: **O(n) time, O(1) space**.`, {
      lists: [dchain("reversed", reversed, { pointers: tagsAt({ head: 0 }, { head: "secondary" }), tones: Object.fromEntries(reversed.map((_, i) => [i, "success" as const])) })],
      done: true,
    });
    return r.frames;
  },
};

export default program;
