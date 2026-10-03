import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function deleteDuplicates(head) {
  let curr = head;
  while (curr !== null && curr.next !== null) {
    if (curr.val === curr.next.val) {
      curr.next = curr.next.next;
    } else {
      curr = curr.next;
    }
  }
  return head;
}`;

const program: Program = {
  title: "Remove duplicates from a sorted list",
  code,
  fields: [{ key: "head", label: "list values (sorted)", kind: "array", maxLength: 8 }],
  examples: [
    { label: "Example", input: { head: [1, 1, 2, 3, 3] } },
    { label: "Runs", input: { head: [1, 1, 1, 2, 2, 3] } },
    { label: "No duplicates", input: { head: [1, 2, 3] } },
  ],
  check(input) {
    const a = input.head as number[];
    return a.every((v, i) => i === 0 || a[i - 1] <= v) ? null : "The list must be sorted, so equal values sit next to each other.";
  },
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();
    const next: number[] = values.map((_, i) => (i + 1 < n ? i + 1 : NULL_ID));
    const removed = new Set<number>();

    // Removed nodes drop to a second row so the skipping arrow stays visible.
    const view = (curr: number, tones: Record<number, CellTone> = {}, fresh?: number) => {
      const nodes: ListNodeView[] = [
        ...values.map((value, i) => ({ id: i, value, col: i, row: removed.has(i) ? 1 : 0, tone: removed.has(i) ? ("muted" as const) : tones[i] })),
        { id: NULL_ID, value: null, col: n },
      ];
      const links: ListLink[] = values.map((_, i) => ({ from: i, to: next[i], tone: (removed.has(i) ? "muted" : i === fresh ? "active" : "idle") as EdgeTone }));
      return { name: "list", nodes, links, pointers: tagsAt({ curr }) };
    };

    let curr = 0;
    r.step(2, `The list is sorted, so any duplicates sit **right next to each other**. We only ever compare a node with its neighbour.`, {
      lists: [view(curr, { [curr]: "primary" })],
      vars: { curr: values[curr] },
    });

    while (curr !== NULL_ID && next[curr] !== NULL_ID) {
      const nxt = next[curr];
      if (values[curr] === values[nxt]) {
        r.step(4, `curr (${values[curr]}) and the next node (${values[nxt]}) are equal: the next one is a duplicate.`, {
          lists: [view(curr, { [curr]: "primary", [nxt]: "write" })],
          vars: { curr: values[curr], "curr.next": values[nxt] },
        });
        next[curr] = next[nxt];
        removed.add(nxt);
        r.step(5, `Skip it: \`curr.next = curr.next.next\`. curr **stays put** — the new next node might be another ${values[curr]}.`, {
          lists: [view(curr, { [curr]: "primary" }, curr)],
          vars: { curr: values[curr], "curr.next": next[curr] === NULL_ID ? "null" : values[next[curr]] },
        });
      } else {
        r.step(7, `${values[curr]} ≠ ${values[nxt]}: no duplicate here, so move on: \`curr = curr.next\`.`, {
          lists: [view(nxt, { [nxt]: "primary" })],
          vars: { curr: values[nxt] },
        });
        curr = nxt;
      }
    }

    const kept = values.filter((_, i) => !removed.has(i));
    r.step(10, `curr has no next node, so we're done. Kept: **${kept.join(" → ")}**. One pass, no extra memory: **O(n) time, O(1) space**.`, {
      lists: [view(NULL_ID, Object.fromEntries(values.map((_, i) => [i, "success" as CellTone])))],
      vars: { result: kept.join(" → ") },
      done: true,
    });
    return r.frames;
  },
};

export default program;
