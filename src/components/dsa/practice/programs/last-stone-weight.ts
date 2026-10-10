import { SimHeap, heapTree, lineOf } from "../heap";
import { recorder, type CellTone, type Program } from "../types";

const code = `function lastStoneWeight(stones) {
  const heap = Heap.from(stones, (a, b) => b - a);   // a max-heap of the stones, built in O(n)
  while (heap.size() > 1) {
    const y = heap.pop();                    // the heaviest
    const x = heap.pop();                    // the second heaviest
    if (y !== x) heap.push(y - x);           // the difference survives
  }
  return heap.size() ? heap.peek() : 0;
}`;

const L = {
  from: lineOf(code, "Heap.from(stones"),
  loop: lineOf(code, "while (heap.size() > 1)"),
  y: lineOf(code, "const y = heap.pop();"),
  x: lineOf(code, "const x = heap.pop();"),
  push: lineOf(code, "if (y !== x) heap.push(y - x);"),
  ret: lineOf(code, "return heap.size() ? heap.peek() : 0;"),
};

const program: Program = {
  title: "Last stone weight (a max-heap)",
  code,
  fields: [{ key: "stones", label: "stones", kind: "array", maxLength: 10, min: 1, max: 999 }],
  examples: [
    { label: "The lesson's example", input: { stones: [2, 7, 4, 1, 8, 1] } },
    { label: "Two equal", input: { stones: [3, 3] } },
    { label: "10 and 10 vanish", input: { stones: [10, 4, 2, 10] } },
  ],
  check: (input) => ((input.stones as number[]).length === 0 ? "Enter at least one stone." : null),
  run(input) {
    const stones = input.stones as number[];
    const heap = SimHeap.from(stones, (a: number, b: number) => b - a);
    const smashed: string[] = [];
    const r = recorder();

    const views = (tones: Record<number, CellTone> = {}) => ({
      trees: [heapTree("max-heap of stones", heap.items, { tones })],
      arrays: [
        { name: "stones", values: stones },
        { name: "heap", values: heap.items, tones },
        ...(smashed.length ? [{ name: "turns so far", values: smashed }] : []),
      ],
    });

    r.step(L.from, `Build a **max-heap** of the ${stones.length} stones in O(n). The heaviest, **${heap.peek()}**, is on top.`, {
      ...views({ 0: "primary" }),
      vars: { size: heap.size() },
    });

    let turn = 0;
    while (heap.size() > 1) {
      turn++;
      const y = heap.pop()!;
      r.step(L.y, `Turn ${turn}: pop the heaviest stone, **${y}**. The heap repairs itself; ${heap.peek()} rises to the top.`, {
        ...views({ 0: "tertiary" }),
        vars: { y, size: heap.size() },
      });
      const x = heap.pop()!;
      r.step(L.x, `Pop the next heaviest, **${x}**.`, {
        ...views(heap.size() ? { 0: "tertiary" } : {}),
        vars: { y, x, size: heap.size() },
      });
      if (y !== x) {
        const at = heap.push(y - x);
        smashed.push(`${y}-${x}=${y - x}`);
        r.step(L.push, `Smash ${y} and ${x}: ${y} − ${x} = **${y - x}** survives. Push it back${at === 0 ? " — it's the heaviest now, so it rises to the top" : ""}.`, {
          ...views({ [at]: "write" }),
          vars: { y, x, size: heap.size() },
        });
      } else {
        smashed.push(`${y}=${x}`);
        r.step(L.push, `${y} = ${x}: **both stones are destroyed**. Nothing goes back.`, {
          ...views(),
          vars: { y, x, size: heap.size() },
        });
      }
    }

    const answer = heap.size() ? heap.peek()! : 0;
    r.step(
      L.ret,
      heap.size() ? `Only one stone is left: return **${answer}**.` : `No stones are left: return **0**.`,
      { ...views(heap.size() ? { 0: "success" } : {}), vars: { size: heap.size(), returned: answer }, done: true }
    );
    return r.frames;
  },
};

export default program;
