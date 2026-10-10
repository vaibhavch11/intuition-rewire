import { SimHeap, heapTree, lineOf } from "../heap";
import { parseOps, type Op } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `class MedianFinder {
  constructor() {
    this.low = new Heap((a, b) => b - a);    // max-heap: the smaller half
    this.high = new Heap();                  // min-heap: the larger half
  }
  addNum(num) {
    this.low.push(num);                      // 1. join the smaller half...
    this.high.push(this.low.pop());          // 2. ...whose largest moves to the larger half
    if (this.high.size() > this.low.size()) this.low.push(this.high.pop());   // 3. low keeps the extra one
  }
  findMedian() {
    if (this.low.size() > this.high.size()) return this.low.peek();
    return (this.low.peek() + this.high.peek()) / 2;
  }
}`;

const L = {
  init: lineOf(code, "this.high = new Heap();"),
  join: lineOf(code, "this.low.push(num);"),
  move: lineOf(code, "this.high.push(this.low.pop());"),
  balance: lineOf(code, "if (this.high.size() > this.low.size())"),
  odd: lineOf(code, "if (this.low.size() > this.high.size()) return this.low.peek();"),
  even: lineOf(code, "return (this.low.peek() + this.high.peek()) / 2;"),
};

const program: Program = {
  title: "Find the median of a stream (two heaps)",
  code,
  fields: [{ key: "ops", label: "operations", kind: "text", maxLength: 160, hint: "add 5, add 2, median, add 8, median" }],
  examples: [
    { label: "The lesson's numbers", input: { ops: "add 5, add 2, median, add 8, add 1, add 9, median, add 3, median" } },
    { label: "Sorted input", input: { ops: "add 1, add 2, add 3, add 4, median, add 5, median" } },
    { label: "LeetCode's example", input: { ops: "add 1, add 2, median, add 3, median" } },
  ],
  check(input) {
    const ops = parseOps(input.ops as string, ["add"], ["median"]);
    if (typeof ops === "string") return ops;
    let size = 0;
    for (const op of ops) {
      if (op.name === "add") {
        if (op.arg! < -99 || op.arg! > 999) return "Keep numbers between -99 and 999 so they fit in the tree's circles.";
        size++;
      } else if (size === 0) return "Add at least one number before asking for the median.";
    }
    return null;
  },
  run(input) {
    const ops = parseOps(input.ops as string, ["add"], ["median"]) as Op[];
    const low = new SimHeap((a: number, b: number) => b - a);
    const high = new SimHeap((a: number, b: number) => a - b);
    const added: number[] = [];
    const r = recorder();

    const views = (lowTones: Record<number, CellTone> = {}, highTones: Record<number, CellTone> = {}) => ({
      trees: [
        heapTree(`low: the smaller half (max-heap, ${low.size()})`, low.items, { tones: lowTones }),
        heapTree(`high: the larger half (min-heap, ${high.size()})`, high.items, { tones: highTones }),
      ],
      arrays: [{ name: "added so far, sorted", values: [...added].sort((a, b) => a - b) }],
    });
    const sizes = () => ({ low: low.size(), high: high.size() });

    r.step(L.init, `Two empty heaps. \`low\` will hold the smaller half with its **largest** on top; \`high\` the larger half with its **smallest** on top.`, {
      ...views(),
      vars: sizes(),
    });

    for (const op of ops) {
      if (op.name === "add") {
        const num = op.arg!;
        added.push(num);
        const at = low.push(num);
        r.step(L.join, `**addNum(${num})** — 1. push ${num} into \`low\`${at === 0 && low.size() > 1 ? `: it's the largest there, so it rises to the top` : ""}.`, {
          ...views({ [at]: "write" }),
          vars: { num, ...sizes() },
        });
        const moved = low.pop()!;
        const at2 = high.push(moved);
        r.step(
          L.move,
          moved === num
            ? `2. \`low\`'s top is **${moved}**, the new number itself, so it moves straight to \`high\`. Now everything in \`low\` is ≤ everything in \`high\`.`
            : `2. \`low\`'s top, **${moved}**, is the largest of the smaller half: it moves to \`high\`. Now everything in \`low\` is ≤ everything in \`high\`.`,
          { ...views({}, { [at2]: "write" }), vars: { num, ...sizes() } }
        );
        if (high.size() > low.size()) {
          const back = high.pop()!;
          const at3 = low.push(back);
          r.step(L.balance, `3. \`high\` has more (${high.size() + 1} > ${low.size() - 1}): move its smallest, **${back}**, back to \`low\`. Sizes ${low.size()} and ${high.size()}.`, {
            ...views({ [at3]: "write" }),
            vars: { num, ...sizes() },
          });
        } else {
          r.step(L.balance, `3. Sizes ${low.size()} and ${high.size()}: \`low\` has the extra one (or they're equal) — balanced.`, {
            ...views(),
            vars: { num, ...sizes() },
          });
        }
      } else if (low.size() > high.size()) {
        const m = low.peek()!;
        r.step(L.odd, `**findMedian()** — ${low.size() + high.size()} numbers, an odd count: the middle one is \`low\`'s top, **${m}**.`, {
          ...views({ 0: "success" }),
          vars: { ...sizes(), returned: m },
        });
      } else {
        const m = (low.peek()! + high.peek()!) / 2;
        r.step(L.even, `**findMedian()** — ${low.size() + high.size()} numbers, an even count: average the two tops, (${low.peek()} + ${high.peek()}) / 2 = **${m}**.`, {
          ...views({ 0: "success" }, { 0: "success" }),
          vars: { ...sizes(), returned: m },
        });
      }
    }

    r.step(L.init, `Done. Each addNum made three heap moves, O(log n); each findMedian only read the tops, O(1).`, {
      ...views(),
      vars: sizes(),
      done: true,
    });
    return r.frames;
  },
};

export default program;
