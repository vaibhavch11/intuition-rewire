import { heapTree, lineOf } from "../heap";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function isMinHeap(heap) {
  const n = heap.length;
  for (let i = 0; 2 * i + 1 < n; i++) {           // only nodes that have a child
    const left = 2 * i + 1, right = 2 * i + 2;
    if (heap[left] < heap[i]) return false;        // left child smaller than its parent
    if (right < n && heap[right] < heap[i]) return false;   // right child smaller
  }
  return true;                                     // no parent is bigger than a child
}`;

const L = {
  n: lineOf(code, "const n = heap.length"),
  kids: lineOf(code, "const left = 2 * i + 1"),
  left: lineOf(code, "if (heap[left] < heap[i])"),
  right: lineOf(code, "if (right < n &&"),
  yes: lineOf(code, "return true;"),
};

const program: Program = {
  title: "Is this array a min-heap?",
  code,
  fields: [{ key: "heap", label: "heap", kind: "array", maxLength: 12, min: -99, max: 99 }],
  examples: [
    { label: "A min-heap", input: { heap: [1, 3, 2, 7, 4, 6, 5] } },
    { label: "4 below 5", input: { heap: [2, 5, 3, 9, 4, 8] } },
    { label: "A max-heap", input: { heap: [9, 5, 8, 1, 3, 6] } },
    { label: "Ties are fine", input: { heap: [2, 2, 3, 2, 5] } },
  ],
  run(input) {
    const heap = input.heap as number[];
    const n = heap.length;
    const r = recorder();
    const checked = new Set<number>();

    const views = (tones: Record<number, CellTone>, marks: Record<string, number | undefined> = {}) => {
      const all: Record<number, CellTone> = {};
      for (const i of checked) all[i] = "done";
      Object.assign(all, tones);
      const pointers = pointersAt(n, marks, { left: "tertiary", right: "tertiary" });
      return {
        trees: [heapTree("as a tree (index under each node)", heap, { tones: all, pointers })],
        arrays: [{ name: "heap", values: heap, tones: all, pointers }],
      };
    };

    const parents = Math.floor(n / 2);
    r.step(
      L.n,
      n < 2
        ? `n = ${n}. With fewer than two values there is no parent and child to compare.`
        : `n = ${n}. Only nodes with a child need checking: indexes 0 to ${parents - 1} (those with 2i + 1 < ${n}). The rest are leaves.`,
      { ...views({}), vars: { n } }
    );

    for (let i = 0; 2 * i + 1 < n; i++) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      const hasRight = right < n;
      r.step(
        L.kids,
        `Index ${i} holds **${heap[i]}**. Its children: left at 2·${i} + 1 = ${left} (**${heap[left]}**)${hasRight ? `, right at 2·${i} + 2 = ${right} (**${heap[right]}**)` : `; no right child, since ${right} ≥ ${n}`}.`,
        { ...views({ [i]: "primary", [left]: "tertiary", ...(hasRight ? { [right]: "tertiary" } : {}) }, { i, left, right: hasRight ? right : undefined }), vars: { n, i, left, right } }
      );

      if (heap[left] < heap[i]) {
        r.step(L.left, `**${heap[left]} < ${heap[i]}**: the left child is smaller than its parent, so the order rule is broken. **Not a min-heap** — return false.`, {
          ...views({ [i]: "primary", [left]: "write" }, { i, left }),
          vars: { n, i, left, right, returned: "false" },
          done: true,
        });
        return r.frames;
      }
      r.step(L.left, `${heap[left]} ≥ ${heap[i]}: the left child is fine.`, {
        ...views({ [i]: "primary", [left]: "success", ...(hasRight ? { [right]: "tertiary" } : {}) }, { i, left, right: hasRight ? right : undefined }),
        vars: { n, i, left, right },
      });

      if (hasRight && heap[right] < heap[i]) {
        r.step(L.right, `**${heap[right]} < ${heap[i]}**: the right child is smaller than its parent, so the order rule is broken. **Not a min-heap** — return false.`, {
          ...views({ [i]: "primary", [right]: "write" }, { i, right }),
          vars: { n, i, left, right, returned: "false" },
          done: true,
        });
        return r.frames;
      }
      checked.add(i);
      r.step(
        L.right,
        hasRight
          ? `${heap[right]} ≥ ${heap[i]}: the right child is fine too. Index ${i} keeps the rule.`
          : `No right child to check (${right} is past the end). Index ${i} keeps the rule.`,
        { ...views({}, { i }), vars: { n, i, left, right } }
      );
    }

    r.step(
      L.yes,
      n < 2
        ? `Nothing to compare, so the order rule can't be broken: **a min-heap**. Return true.`
        : `Every parent is ≤ both of its children, so the smallest value, **${heap[0]}**, is on top: **a min-heap**. Return true.`,
      { ...views(n ? { 0: "success" } : {}), vars: { n, returned: "true" }, done: true }
    );
    return r.frames;
  },
};

export default program;
