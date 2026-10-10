import { SimHeap, heapTree, lineOf } from "../heap";
import { recorder, type CellTone, type Program } from "../types";

const code = `function minCost(ropes) {
  const heap = Heap.from(ropes);             // a min-heap of rope lengths, built in O(n)
  let cost = 0;
  while (heap.size() > 1) {
    const a = heap.pop(), b = heap.pop();    // the two shortest ropes
    cost += a + b;                           // joining them costs their total length
    heap.push(a + b);                        // the joined rope goes back in
  }
  return cost;
}`;

const L = {
  from: lineOf(code, "Heap.from(ropes)"),
  pop: lineOf(code, "const a = heap.pop(), b = heap.pop();"),
  cost: lineOf(code, "cost += a + b;"),
  push: lineOf(code, "heap.push(a + b);"),
  ret: lineOf(code, "return cost;"),
};

const program: Program = {
  title: "Minimum cost of ropes (a min-heap)",
  code,
  fields: [{ key: "ropes", label: "ropes", kind: "array", maxLength: 8, min: 1, max: 99 }],
  examples: [
    { label: "The lesson's example", input: { ropes: [4, 3, 2, 6] } },
    { label: "Equal pairs", input: { ropes: [2, 2, 3, 3] } },
    { label: "One long rope", input: { ropes: [1, 2, 3, 20] } },
  ],
  check: (input) => ((input.ropes as number[]).length === 0 ? "Enter at least one rope." : null),
  run(input) {
    const ropes = input.ropes as number[];
    const heap = SimHeap.from(ropes, (a: number, b: number) => a - b);
    const joins: number[] = [];
    let cost = 0;
    const r = recorder();

    const views = (tones: Record<number, CellTone> = {}, fresh = false) => ({
      trees: [heapTree("min-heap of rope lengths", heap.items, { tones })],
      arrays: [
        { name: "ropes", values: ropes },
        { name: "heap", values: heap.items, tones },
        ...(joins.length ? [{ name: "cost of each join", values: joins, tones: fresh ? { [joins.length - 1]: "write" as CellTone } : {} }] : []),
      ],
    });

    r.step(L.from, `Build a **min-heap** of the ${ropes.length} lengths in O(n). The shortest rope, **${heap.peek()}**, is on top.`, {
      ...views({ 0: "primary" }),
      vars: { cost, size: heap.size() },
    });

    while (heap.size() > 1) {
      const a = heap.pop()!;
      const b = heap.pop()!;
      r.step(L.pop, `Pop the two shortest ropes: **${a}** and **${b}**.`, {
        ...views(heap.size() ? { 0: "tertiary" } : {}),
        vars: { a, b, cost, size: heap.size() },
      });
      cost += a + b;
      joins.push(a + b);
      r.step(L.cost, `Joining them costs ${a} + ${b} = **${a + b}**. Total so far: **${cost}**.`, {
        ...views({}, true),
        vars: { a, b, cost, size: heap.size() },
      });
      const at = heap.push(a + b);
      r.step(L.push, `Push the joined rope, ${a + b}, back in${at === 0 ? " — it's the shortest left, so it rises to the top" : ""}. ${heap.size() === 1 ? "It's the only rope left." : `${heap.size()} ropes left.`}`, {
        ...views({ [at]: "write" }),
        vars: { a, b, cost, size: heap.size() },
      });
    }

    r.step(L.ret, joins.length ? `One rope is left. The minimum total cost is ${joins.join(" + ")} = **${cost}**.` : `A single rope needs no joins: the cost is **0**.`, {
      ...views(heap.size() ? { 0: "success" } : {}),
      vars: { cost, returned: cost },
      done: true,
    });
    return r.frames;
  },
};

export default program;
