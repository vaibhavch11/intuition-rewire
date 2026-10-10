import { heapTree, lineOf } from "../heap";
import { recorder, type CellTone, type Program } from "../types";

const code = `function treatmentOrder(severity) {
  // [severity, arrival]: higher severity first; on a tie, whoever arrived first
  const heap = new Heap((a, b) => b[0] - a[0] || a[1] - b[1]);
  severity.forEach((s, i) => heap.push([s, i]));
  const order = [];
  while (heap.size() > 0) order.push(heap.pop()[1]);   // arrival numbers, in treatment order
  return order;
}`;

const L = {
  heap: lineOf(code, "const heap = new Heap("),
  push: lineOf(code, "heap.push([s, i])"),
  pop: lineOf(code, "order.push(heap.pop()[1])"),
  ret: lineOf(code, "return order;"),
};

type Entry = [number, number];
const compare = (a: Entry, b: Entry) => b[0] - a[0] || a[1] - b[1];

/** Pushes into an array heap ordered by `compare`; returns where the entry settled and how many swaps it took. */
function push(heap: Entry[], e: Entry) {
  heap.push(e);
  let i = heap.length - 1;
  let swaps = 0;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (compare(heap[parent], heap[i]) <= 0) break;
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
    swaps++;
  }
  return { at: i, swaps };
}

function pop(heap: Entry[]) {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let first = i;
      if (l < heap.length && compare(heap[l], heap[first]) < 0) first = l;
      if (r < heap.length && compare(heap[r], heap[first]) < 0) first = r;
      if (first === i) break;
      [heap[i], heap[first]] = [heap[first], heap[i]];
      i = first;
    }
  }
  return top;
}

const program: Program = {
  title: "Treatment order: a heap with a custom compare",
  code,
  fields: [{ key: "severity", label: "severity of each arrival (1-9)", kind: "array", maxLength: 9, min: 1, max: 9 }],
  examples: [
    { label: "A tie on 5", input: { severity: [2, 5, 3, 5, 1] } },
    { label: "All equal", input: { severity: [4, 4, 4, 4] } },
    { label: "Worst first", input: { severity: [9, 1, 7, 3, 8, 2] } },
  ],
  run(input) {
    const severity = input.severity as number[];
    const heap: Entry[] = [];
    const order: number[] = [];
    const r = recorder();

    const views = (tones: Record<number, CellTone> = {}, fresh = false) => ({
      trees: [
        heapTree("heap: severity in the node, #arrival under it", heap.map(([s]) => s), {
          tones,
          captions: Object.fromEntries(heap.map(([, a], i) => [i, `#${a}`])),
        }),
      ],
      arrays: [
        { name: "severity", values: severity, tones: Object.fromEntries(order.map((a) => [a, "muted" as CellTone])) },
        { name: "heap: severity", values: heap.map(([s]) => s), tones },
        { name: "heap: arrival", values: heap.map(([, a]) => `#${a}`), tones },
        ...(order.length ? [{ name: "order", values: order.map((a) => `#${a}`), tones: fresh ? { [order.length - 1]: "write" as CellTone } : {} }] : []),
      ],
    });

    r.step(L.heap, `An empty heap whose compare puts **higher severity** first, and on a tie the **smaller arrival number**. Each entry is a pair [severity, arrival].`, {
      ...views(),
      vars: { size: 0 },
    });

    severity.forEach((s, i) => {
      const { at, swaps } = push(heap, [s, i]);
      r.step(
        L.push,
        `Patient **#${i}** arrives with severity **${s}**: push [${s}, ${i}]. ${
          swaps === 0
            ? at === 0
              ? "It's the only entry, so it's on top."
              : "Its parent comes first by the compare, so it stays at the bottom."
            : `It comes before its parent, so it rises ${swaps} level${swaps > 1 ? "s" : ""}${at === 0 ? " — to the top" : ""}.`
        }`,
        { ...views({ [at]: "write" }), vars: { s, i, size: heap.length } }
      );
    });

    while (heap.length > 0) {
      const [s, a] = heap[0];
      const tie = heap.length > 1 && [1, 2].some((k) => k < heap.length && heap[k][0] === s);
      r.step(
        L.pop,
        `The top is **#${a}** (severity ${s})${tie ? `. Another patient also has severity ${s}, but #${a} arrived first` : ""}. Treat them: pop.`,
        { ...views({ 0: "primary" }), vars: { size: heap.length } }
      );
      pop(heap);
      order.push(a);
      r.step(
        L.pop,
        heap.length ? `#${a} added to the order. The heap repairs itself and **#${heap[0][1]}** (severity ${heap[0][0]}) is on top now.` : `#${a} added to the order. Everyone has been treated.`,
        { ...views(heap.length ? { 0: "tertiary" } : {}, true), vars: { size: heap.length } }
      );
    }

    r.step(L.ret, `Return **[${order.join(", ")}]** — most severe first, and among equals, in arrival order.`, {
      ...views({}, false),
      vars: { returned: `[${order.join(", ")}]` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
