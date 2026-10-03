import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function getIntersectionNode(headA, headB) {
  let a = headA;
  let b = headB;
  while (a !== b) {
    a = a === null ? headB : a.next;
    b = b === null ? headA : b.next;
  }
  return a;
}`;

const A0 = 0;
const B0 = 100;
const S0 = 200;
const NULL_B = -2;

const program: Program = {
  title: "Intersection of two lists (switching pointers)",
  code,
  fields: [
    { key: "aOnly", label: "only in list A", kind: "array", maxLength: 4 },
    { key: "bOnly", label: "only in list B", kind: "array", maxLength: 4 },
    { key: "shared", label: "shared tail (empty = no intersection)", kind: "text", maxLength: 20, hint: "e.g. 8, 4, 5 — or leave as none" },
  ],
  examples: [
    { label: "Example", input: { aOnly: [4, 1], bOnly: [5, 6, 1], shared: "8, 4, 5" } },
    { label: "Same length", input: { aOnly: [1, 2], bOnly: [3, 4], shared: "9" } },
    { label: "No intersection", input: { aOnly: [2, 6, 4], bOnly: [1, 5], shared: "none" } },
  ],
  check(input) {
    const text = String(input.shared).trim().toLowerCase();
    if (text === "none" || text === "") return null;
    return /^-?\d+([\s,]+-?\d+)*$/.test(text) && text.split(/[\s,]+/).length <= 4 ? null : "shared tail: up to 4 numbers like 8, 4, 5 — or none.";
  },
  run(input) {
    const aOnly = input.aOnly as number[];
    const bOnly = input.bOnly as number[];
    const text = String(input.shared).trim().toLowerCase();
    const shared = text === "none" || text === "" ? [] : text.split(/[\s,]+/).map(Number);
    const p = aOnly.length;
    const q = bOnly.length;
    const s = shared.length;
    const base = Math.max(p, q);
    const r = recorder();

    const nodes: ListNodeView[] = [
      ...aOnly.map((value, i) => ({ id: A0 + i, value, col: base - p + i })),
      ...bOnly.map((value, i) => ({ id: B0 + i, value, col: base - q + i, row: 1 })),
      ...shared.map((value, i) => ({ id: S0 + i, value, col: base + i })),
      { id: NULL_ID, value: null, col: base + s },
    ];
    if (s === 0) nodes.push({ id: NULL_B, value: null, col: base, row: 1 });
    const nextOf = new Map<number, number>();
    const chainUp = (ids: number[], end: number) => ids.forEach((id, i) => nextOf.set(id, i + 1 < ids.length ? ids[i + 1] : end));
    const sharedIds = shared.map((_, i) => S0 + i);
    chainUp(sharedIds, NULL_ID);
    chainUp(aOnly.map((_, i) => A0 + i), s ? S0 : NULL_ID);
    chainUp(bOnly.map((_, i) => B0 + i), s ? S0 : NULL_B);
    const links: ListLink[] = [...nextOf].map(([from, to]) => ({ from, to }));
    const headA = p ? A0 : s ? S0 : NULL_ID;
    const headB = q ? B0 : s ? S0 : NULL_B;
    const value = (id: number) => (id < 0 ? "null" : String(nodes.find((n) => n.id === id)!.value));
    const isNull = (id: number) => id < 0;

    const view = (a: number, b: number, tones: Record<number, CellTone> = {}) => ({
      name: "lists A (top) and B (bottom)",
      nodes: nodes.map((n) => ({ ...n, tone: tones[n.id] ?? (sharedIds.includes(n.id) ? ("done" as const) : undefined) })),
      links,
      pointers: tagsAt({ a, b }, { b: "tertiary" }),
    });

    let a = headA;
    let b = headB;
    r.step(
      3,
      `A has ${p + s} nodes and B has ${q + s}, so walking both at the same speed, they'd reach the shared part at different times. The trick: when a pointer runs off the end, **restart it on the other list**.`,
      { lists: [view(a, b)], vars: { a: value(a), b: value(b) } }
    );

    let guard = 0;
    // Two different null boxes still both mean null.
    const same = (x: number, y: number) => x === y || (isNull(x) && isNull(y));
    while (!same(a, b) && guard++ < 30) {
      const wrapA = isNull(a);
      const wrapB = isNull(b);
      a = wrapA ? headB : nextOf.get(a)!;
      b = wrapB ? headA : nextOf.get(b)!;
      const notes = [wrapA ? "a hit null and **jumps to headB**" : `a → ${value(a)}`, wrapB ? "b hit null and **jumps to headA**" : `b → ${value(b)}`];
      r.step(6, `${notes.join(", ")}.`, {
        lists: [view(a, b, { ...(isNull(a) ? {} : { [a]: "primary" as const }), ...(isNull(b) ? {} : { [b]: "tertiary" as const }) })],
        vars: { a: value(a), b: value(b) },
      });
    }

    r.step(
      8,
      isNull(a)
        ? `Both pointers reached **null** at the same moment: each walked A + B nodes, and no node was shared. Return null. **O(m + n) time, O(1) space**.`
        : `a and b meet at **${value(a)}**. Each pointer walked (its own part) + (the other's part) + (shared), the same total, so they arrive together. **O(m + n) time, O(1) space**.`,
      { lists: [view(a, b, isNull(a) ? {} : { [a]: "success" })], vars: { answer: value(a) }, done: true }
    );
    return r.frames;
  },
};

export default program;
