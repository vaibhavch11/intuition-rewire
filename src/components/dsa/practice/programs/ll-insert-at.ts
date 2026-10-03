import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function insertAt(head, pos, x) {
  const node = new ListNode(x);
  if (pos === 0) {
    node.next = head;
    return node;
  }
  let prev = head;
  for (let i = 0; i < pos - 1; i++) {
    prev = prev.next;
  }
  node.next = prev.next;
  prev.next = node;
  return head;
}`;

const NEW = 100;

const program: Program = {
  title: "Insert a value at a position",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 6 },
    { key: "pos", label: "position", kind: "number", min: 0, max: 6 },
    { key: "x", label: "new value", kind: "number" },
  ],
  examples: [
    { label: "Middle", input: { head: [10, 20, 30, 40], pos: 2, x: 25 } },
    { label: "Front", input: { head: [10, 20, 30, 40], pos: 0, x: 5 } },
    { label: "End", input: { head: [10, 20, 30, 40], pos: 4, x: 50 } },
  ],
  check(input) {
    const n = (input.head as number[]).length;
    return (input.pos as number) > n ? `position can be 0 to ${n} (${n} means "after the last node").` : null;
  },
  run(input) {
    const values = input.head as number[];
    const pos = input.pos as number;
    const x = input.x as number;
    const n = values.length;
    const r = recorder();

    // The old list runs along row 0; the new node waits on row 1 under its target gap.
    const next: number[] = values.map((_, i) => (i + 1 < n ? i + 1 : NULL_ID));
    let nodeNext: number | null = null;
    let placed = false;

    const view = (marks: Record<string, number>, tones: Record<number, CellTone> = {}, fresh: number[] = []) => {
      const nodes: ListNodeView[] = [
        ...values.map((value, i) => ({ id: i, value, col: i, tone: tones[i] })),
        { id: NULL_ID, value: null, col: n },
        { id: NEW, value: x, col: Math.max(pos - 0.5, 0), row: 1, tone: tones[NEW] ?? "write" },
      ];
      const links: ListLink[] = values.map((_, i) => ({ from: i, to: next[i], tone: (fresh.includes(i) ? "active" : "idle") as EdgeTone }));
      if (nodeNext !== null) links.push({ from: NEW, to: nodeNext, tone: fresh.includes(NEW) ? "active" : "idle" });
      // The `node` tag only matters until prev points at it.
      const tags = placed ? marks : { ...marks, node: NEW };
      return { name: "list", nodes, links, pointers: tagsAt(tags, { head: "secondary", prev: "tertiary", node: "muted" }) };
    };

    r.step(2, `Create the new node holding **${x}**. It isn't linked to anything yet.`, { lists: [view({ head: 0 })], vars: { pos, x } });

    if (pos === 0) {
      nodeNext = 0;
      r.step(4, `Position 0 means the new node becomes the head: \`node.next = head\`.`, { lists: [view({ head: 0 }, {}, [NEW])], vars: { pos } });
      placed = true;
      r.step(5, `Return the new node as the head. **O(1)**: no walking needed at the front.`, {
        lists: [view({ head: NEW }, { [NEW]: "success" })],
        vars: { head: x },
        done: true,
      });
      return r.frames;
    }

    let prev = 0;
    r.step(7, `To insert at position ${pos}, we need the node **just before** it (position ${pos - 1}). Start \`prev\` at the head.`, {
      lists: [view({ head: 0, prev }, { [prev]: "primary" })],
      vars: { i: 0, prev: values[prev] },
    });
    for (let i = 0; i < pos - 1; i++) {
      prev = prev + 1;
      r.step(9, `Walk one step: \`prev = prev.next\` → ${values[prev]}.`, {
        lists: [view({ head: 0, prev }, { [prev]: "primary" })],
        vars: { i: i + 1, prev: values[prev] },
      });
    }

    nodeNext = next[prev];
    r.step(11, `First, point the new node at what comes after \`prev\`: \`node.next = prev.next\` (${nodeNext === NULL_ID ? "null" : values[nodeNext]}). Doing this **first** means the rest of the list is never lost.`, {
      lists: [view({ head: 0, prev }, { [prev]: "primary" }, [NEW])],
      vars: { prev: values[prev], "node.next": nodeNext === NULL_ID ? "null" : values[nodeNext] },
    });

    next[prev] = NEW;
    placed = true;
    r.step(12, `Then hook it in: \`prev.next = node\`. Two pointer changes — the other nodes didn't move at all.`, {
      lists: [view({ head: 0, prev }, { [prev]: "primary", [NEW]: "success" }, [prev, NEW])],
      vars: { prev: values[prev], "prev.next": x },
    });

    r.step(13, `Return the unchanged head. Walking to the spot cost **O(pos)**; the insert itself is **O(1)**.`, {
      lists: [view({ head: 0 }, { [NEW]: "success" })],
      vars: { inserted: x, at: pos },
      done: placed,
    });
    return r.frames;
  },
};

export default program;
