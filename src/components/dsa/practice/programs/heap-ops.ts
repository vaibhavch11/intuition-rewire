import { heapTree, lineOf, parentOf, pathUp } from "../heap";
import { parseOps, type Op } from "../structures";
import { pointersAt, recorder, type CellTone, type EdgeTone, type Program } from "../types";

const code = `class MinHeap {
  constructor() {
    this.heap = [];
  }
  size() {
    return this.heap.length;
  }
  peek() {
    return this.heap[0];                         // the smallest value; undefined if empty
  }
  push(x) {
    this.heap.push(x);                           // 1. add at the end
    let i = this.heap.length - 1;
    while (i > 0) {                              // 2. sift up
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;   // parent is smaller or equal: done
      this.swap(i, parent);
      i = parent;
    }
  }
  pop() {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];                    // 1. the smallest value
    const last = this.heap.pop();                // 2. take the last value off the end
    if (this.heap.length > 0) {
      this.heap[0] = last;                       //    and put it on top
      let i = 0;
      while (true) {                             // 3. sift down
        const left = 2 * i + 1, right = 2 * i + 2;
        let smallest = i;
        if (left < this.heap.length && this.heap[left] < this.heap[smallest]) smallest = left;
        if (right < this.heap.length && this.heap[right] < this.heap[smallest]) smallest = right;
        if (smallest === i) break;               // both children are bigger or equal: done
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }
  swap(a, b) {
    [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];
  }
}`;

const L = {
  init: lineOf(code, "this.heap = [];"),
  size: lineOf(code, "return this.heap.length;"),
  peek: lineOf(code, "return this.heap[0];"),
  pushEnd: lineOf(code, "this.heap.push(x);"),
  upLoop: lineOf(code, "while (i > 0)"),
  upStop: lineOf(code, "if (this.heap[parent] <= this.heap[i]) break;"),
  upSwap: lineOf(code, "this.swap(i, parent);"),
  empty: lineOf(code, "if (this.heap.length === 0) return undefined;"),
  top: lineOf(code, "const top = this.heap[0];"),
  last: lineOf(code, "const last = this.heap.pop();"),
  toTop: lineOf(code, "this.heap[0] = last;"),
  pickRight: lineOf(code, "if (right < this.heap.length"),
  downStop: lineOf(code, "if (smallest === i) break;"),
  downSwap: lineOf(code, "this.swap(i, smallest);"),
  ret: lineOf(code, "return top;"),
};

const WITH_ARG = ["push"];
const NO_ARG = ["pop", "peek", "size"];

const program: Program = {
  title: "Push, pop and peek on a min-heap",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "push 5, push 3, push 8, pop, peek" }],
  examples: [
    { label: "Push and pop", input: { ops: "push 5, push 3, push 8, push 1, push 4, pop, pop, peek" } },
    { label: "The lesson's example", input: { ops: "push 1, push 4, push 2, push 7, push 5, push 6, push 8, push 3, pop" } },
    { label: "Sorted order out", input: { ops: "push 4, push 1, push 3, push 2, pop, pop, pop, pop" } },
    { label: "Empty heap", input: { ops: "push 7, pop, pop, peek, size" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG);
    if (typeof ops === "string") return ops;
    const wide = ops.find((op) => op.arg !== undefined && (op.arg < -99 || op.arg > 999));
    return wide ? `Keep pushed numbers between -99 and 999 so they fit in the tree's circles.` : null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, WITH_ARG, NO_ARG) as Op[];
    const heap: number[] = [];
    const r = recorder();
    const out: number[] = [];

    const views = (
      tones: Record<number, CellTone> = {},
      marks: Record<string, number | undefined> = {},
      edgeTones: Record<number, EdgeTone> = {},
      fresh = false
    ) => {
      const pointers = pointersAt(heap.length, marks, { parent: "tertiary", left: "muted", right: "muted", smallest: "tertiary" });
      return {
        trees: [heapTree("min-heap", heap, { tones, pointers, edgeTones })],
        arrays: [
          { name: "heap", values: heap, tones, pointers },
          ...(out.length ? [{ name: "popped, in order", values: out, tones: fresh ? { [out.length - 1]: "write" as CellTone } : {} }] : []),
        ],
      };
    };
    const swap = (a: number, b: number) => ([heap[a], heap[b]] = [heap[b], heap[a]]);

    r.step(L.init, `An empty min-heap: just an array. The smallest value will always sit at index 0.`, { ...views(), vars: { size: 0 } });

    for (const op of ops) {
      if (op.name === "push") {
        const x = op.arg!;
        heap.push(x);
        let i = heap.length - 1;
        r.step(L.pushEnd, `**push ${x}** — add it at the **end**, index ${i}${i > 0 ? `, under its parent ${heap[parentOf(i)]} (index ${parentOf(i)})` : ", which is the root"}. The tree is still complete.`, {
          ...views({ [i]: "write" }, { i }),
          vars: { x, i, size: heap.length },
        });
        while (i > 0) {
          const parent = parentOf(i);
          if (heap[parent] <= heap[i]) {
            r.step(L.upStop, `Its parent ${heap[parent]} ≤ ${x}: the order rule holds. **Stop** — ${x} stays at index ${i}.`, {
              ...views({ [i]: "success", [parent]: "tertiary" }, { i, parent }),
              vars: { x, i, parent, size: heap.length },
            });
            break;
          }
          swap(i, parent);
          r.step(L.upSwap, `${x} < ${heap[i]}, its parent: **swap**. ${x} rises to index ${parent}.`, {
            ...views({ [parent]: "write", [i]: "tertiary" }, { i: parent }, pathUp(i)),
            vars: { x, i: parent, parent, size: heap.length },
          });
          i = parent;
        }
        if (i === 0 && heap.length > 1) {
          r.step(L.upLoop, `${x} reached the **root** (i = 0): it's the new smallest value. Stop.`, {
            ...views({ 0: "success" }, { i: 0 }),
            vars: { x, i: 0, size: heap.length },
          });
        }
      } else if (op.name === "pop") {
        if (heap.length === 0) {
          r.step(L.empty, `**pop** on an empty heap — there is no top. Return \`undefined\`.`, { ...views(), vars: { returned: "undefined", size: 0 } });
          continue;
        }
        const top = heap[0];
        r.step(L.top, `**pop** — the root, **${top}**, is the smallest value. That's the answer; remember it.`, {
          ...views({ 0: "primary", [heap.length - 1]: heap.length > 1 ? "tertiary" : "primary" }),
          vars: { top, size: heap.length },
        });
        const last = heap.pop()!;
        if (heap.length === 0) {
          out.push(top);
          r.step(L.last, `Take the last value off the end — it was the root itself, so the heap is now **empty**. Return ${top}.`, {
            ...views({}, {}, {}, true),
            vars: { top, returned: top, size: 0 },
          });
          continue;
        }
        r.step(L.last, `Take the **last** value, ${last}, off the end of the array.`, {
          ...views({ 0: "primary" }),
          vars: { top, last, size: heap.length },
        });
        heap[0] = last;
        r.step(L.toTop, `Put ${last} on top, in the root's place. The tree is complete again, but the order may be broken at the top.`, {
          ...views({ 0: "write" }, { i: 0 }),
          vars: { top, last, i: 0, size: heap.length },
        });
        let i = 0;
        for (;;) {
          const left = 2 * i + 1;
          const right = 2 * i + 2;
          let smallest = i;
          if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
          if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
          const kids = [left, right].filter((k) => k < heap.length);
          const kidTones: Record<number, CellTone> = Object.fromEntries(kids.map((k) => [k, "muted" as CellTone]));
          if (smallest === i) {
            r.step(
              L.downStop,
              kids.length === 0
                ? `${last} is at a **leaf** (index ${i}): no children. **Stop.**`
                : `${last} ≤ ${kids.map((k) => heap[k]).join(" and ")}, its ${kids.length === 1 ? "only child" : "children"}. **Stop** — the order rule holds.`,
              { ...views({ ...kidTones, [i]: "success" }, { i }), vars: { top, i, size: heap.length } }
            );
            break;
          }
          r.step(
            L.pickRight,
            kids.length === 2
              ? `Children ${heap[left]} and ${heap[right]}: the smaller is **${heap[smallest]}**, at index ${smallest}.`
              : `Only one child: ${heap[left]}, at index ${left}.`,
            { ...views({ ...kidTones, [i]: "primary", [smallest]: "tertiary" }, { i, smallest }), vars: { top, i, smallest, size: heap.length } }
          );
          swap(i, smallest);
          r.step(L.downSwap, `${last} > ${heap[i]}: **swap**. ${heap[i]} moves up and ${last} sinks to index ${smallest}.`, {
            ...views({ [smallest]: "write", [i]: "tertiary" }, { i: smallest }, { [smallest]: "active" }),
            vars: { top, i: smallest, size: heap.length },
          });
          i = smallest;
        }
        out.push(top);
        r.step(L.ret, `Return **${top}**. The heap is valid again, with ${heap[0]} on top.`, {
          ...views({ 0: "success" }, {}, {}, true),
          vars: { returned: top, size: heap.length },
        });
      } else if (op.name === "peek") {
        r.step(L.peek, heap.length ? `**peek** → **${heap[0]}**, the value at index 0. Nothing moves: O(1).` : `**peek** on an empty heap returns \`undefined\`.`, {
          ...views(heap.length ? { 0: "tertiary" } : {}),
          vars: { returned: heap.length ? heap[0] : "undefined", size: heap.length },
        });
      } else {
        r.step(L.size, `**size** → **${heap.length}**.`, { ...views(), vars: { returned: heap.length, size: heap.length } });
      }
    }

    r.step(
      L.init,
      out.length > 1
        ? `Done. The pops came out as ${out.join(", ")} — always the smallest value left. Each push and pop walked one path: **O(log n)**.`
        : `Done. Each push and pop walks one root-to-leaf path: **O(log n)**. peek is **O(1)**.`,
      { ...views(), vars: { size: heap.length }, done: true }
    );
    return r.frames;
  },
};

export default program;
