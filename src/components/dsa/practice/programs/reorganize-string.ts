import { SimHeap, heapTree, lineOf } from "../heap";
import { recorder, type CellTone, type Program } from "../types";

const code = `function reorganizeString(s) {
  const count = new Map();
  for (const ch of s) count.set(ch, (count.get(ch) ?? 0) + 1);
  const heap = Heap.from([...count], (a, b) => b[1] - a[1]);   // [letter, count]: most left first
  let out = "";
  let held = null;                           // the letter just used: it must sit out one turn
  while (heap.size() > 0) {
    const [ch, c] = heap.pop();              // the most frequent letter that isn't the last one
    out += ch;
    if (held) heap.push(held);               // the previous letter may be used again
    held = c > 1 ? [ch, c - 1] : null;
  }
  return held ? "" : out;                    // a letter still waiting had nowhere to go
}`;

const L = {
  count: lineOf(code, "for (const ch of s) count.set("),
  heap: lineOf(code, "const heap = Heap.from("),
  pop: lineOf(code, "const [ch, c] = heap.pop();"),
  back: lineOf(code, "if (held) heap.push(held);"),
  hold: lineOf(code, "held = c > 1 ? [ch, c - 1] : null;"),
  ret: lineOf(code, "return held ? \"\" : out;"),
};

type Letter = [string, number];

const program: Program = {
  title: "Reorganize string (a max-heap, holding the last letter back)",
  code,
  fields: [{ key: "s", label: "s (lowercase letters)", kind: "text", maxLength: 12, hint: "aaabbc" }],
  examples: [
    { label: "aaabbc", input: { s: "aaabbc" } },
    { label: "Impossible", input: { s: "aaab" } },
    { label: "vvvlo", input: { s: "vvvlo" } },
  ],
  check: (input) => (/^[a-z]{1,12}$/.test((input.s as string).trim()) ? null : "Write 1 to 12 lowercase letters, like aaabbc."),
  run(input) {
    const s = (input.s as string).trim();
    const count = new Map<string, number>();
    for (const ch of s) count.set(ch, (count.get(ch) ?? 0) + 1);
    const heap = SimHeap.from([...count] as Letter[], (a: Letter, b: Letter) => b[1] - a[1]);
    let out = "";
    let held: Letter | null = null;
    const r = recorder();

    const views = (tones: Record<number, CellTone> = {}, fresh = false) => ({
      trees: [heapTree("max-heap by copies left (letter under each node)", heap.items.map(([, c]) => c), {
        tones,
        captions: Object.fromEntries(heap.items.map(([ch], j) => [j, ch])),
      })],
      arrays: [
        { name: "s", values: [...s] },
        ...(out ? [{ name: "out", values: [...out], tones: fresh ? { [out.length - 1]: "write" as CellTone } : {} }] : []),
        ...(held ? [{ name: "held (sits out one turn)", values: [`${held[0]}:${held[1]}`], tones: { 0: "tertiary" as CellTone } }] : []),
      ],
    });

    r.step(L.count, `Count the letters: ${[...count].map(([ch, c]) => `${ch} × ${c}`).join(", ")}.`, { ...views(), vars: { out: '""' } });
    r.step(L.heap, `Put them in a **max-heap by count**. Nothing is held yet.`, { ...views({ 0: "primary" }), vars: { out: '""', held: "null" } });

    while (heap.size() > 0) {
      const [ch, c] = heap.pop()!;
      out += ch;
      r.step(L.pop, `Pop **${ch}** (${c} left) — the most frequent letter that isn't the one just written. Write it: out = "${out}".`, {
        ...views({}, true),
        vars: { out: `"${out}"`, held: held ? held[0] : "null" },
      });
      if (held) {
        const at = heap.push(held);
        r.step(L.back, `${held[0]} has sat out its turn: push it back into the heap${at === 0 ? " — it's the most frequent again" : ""}.`, {
          ...views({ [at]: "write" }),
          vars: { out: `"${out}"`, held: held[0] },
        });
      }
      held = c > 1 ? [ch, c - 1] : null;
      r.step(L.hold, held ? `Hold **${ch}** back with ${c - 1} cop${c - 1 === 1 ? "y" : "ies"} left: it can't be the next letter.` : `That was the last ${ch}: nothing to hold.`, {
        ...views(),
        vars: { out: `"${out}"`, held: held ? held[0] : "null" },
      });
    }

    r.step(
      L.ret,
      held
        ? `The heap is empty, but **${held[0]}** is still waiting with ${held[1]} left — the only letters left are ${held[0]}s, and they would have to touch. Return **""**.`
        : `Every letter is placed and none is waiting: return **"${out}"** — no two neighbours are equal.`,
      { ...views(), vars: { returned: held ? '""' : `"${out}"` }, done: true }
    );
    return r.frames;
  },
};

export default program;
