import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function eliminationOrder(n, k) {
  const q = [];
  let head = 0;                              // the front of the queue
  for (let i = 1; i <= n; i++) q.push(i);    // players 1..n stand in line
  const out = [];
  while (q.length - head > 0) {
    for (let pass = 1; pass < k; pass++) {
      q.push(q[head++]);                     // pass the potato: the front player goes to the back
    }
    out.push(q[head++]);                     // the k-th holder leaves the game
  }
  return out;
}`;

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th"];

const program: Program = {
  title: "Hot potato (a queue that goes round in a circle)",
  code,
  fields: [
    { key: "n", label: "players n", kind: "number", min: 1, max: 8 },
    { key: "k", label: "k (holder who leaves)", kind: "number", min: 1, max: 6 },
  ],
  examples: [
    { label: "n = 5, k = 2", input: { n: 5, k: 2 } },
    { label: "n = 6, k = 3", input: { n: 6, k: 3 } },
    { label: "k = 1: plain order", input: { n: 4, k: 1 } },
  ],
  run(input) {
    const n = input.n as number;
    const k = input.k as number;
    const r = recorder();
    let line = Array.from({ length: n }, (_, i) => i + 1); // the live queue, front first
    const out: number[] = [];

    const views = (tones: Record<number, CellTone> = {}, fresh = false) => ({
      arrays: [
        {
          name: "queue",
          values: line,
          tones,
          pointers: pointersAt(line.length, line.length > 1 ? { front: 0, back: line.length - 1 } : { "front = back": 0 }, { back: "tertiary" }),
        },
        ...(out.length ? [{ name: "out, in order", values: out, tones: fresh ? { [out.length - 1]: "write" as CellTone } : {} }] : []),
      ],
    });

    r.step(4, `${n} players stand in a circle, which a queue models perfectly: the **front** holds the potato, and passing it on means **dequeue the front, enqueue them at the back**. ${k === 1 ? "With k = 1 the first holder leaves at once, so players leave in plain line order." : `Each round the potato is passed ${k - 1} time${k === 2 ? "" : "s"}, and whoever then holds it — the **${ORDINAL[k]}** holder — leaves.`}`, {
      ...views(),
      vars: { n, k },
    });

    while (line.length > 0) {
      if (k > 1) {
        const passes = k - 1;
        const moved: number[] = [];
        for (let p = 0; p < passes; p++) {
          const front = line[0];
          line = [...line.slice(1), front];
          moved.push(front);
        }
        r.step(8, `Pass the potato ${passes} time${passes === 1 ? "" : "s"}: ${moved.join(", then ")} ${passes === 1 ? "goes" : "go"} from the front to the back. ${line.length > 1 && passes >= line.length ? "(With fewer players than passes, someone goes round more than once.)" : ""}`.trim(), {
          ...views({ 0: "tertiary", ...Object.fromEntries(Array.from({ length: Math.min(passes, line.length - 1) }, (_, j) => [line.length - 1 - j, "write" as CellTone])) }),
          vars: { n, k, left: line.length },
        });
      }
      const gone = line[0];
      line = line.slice(1);
      out.push(gone);
      r.step(10, `Player **${gone}** is holding the potato on pass ${k}, so they **leave**: dequeue, and this time don't enqueue them again.${line.length === 1 ? ` Only player ${line[0]} is left.` : ""}`, {
        ...views({}, true),
        vars: { n, k, left: line.length },
      });
    }

    r.step(12, `Everyone has left. The order was **[${out.join(", ")}]** — the last player out, **${out[out.length - 1]}**, is the winner. Each pass is one dequeue and one enqueue, both O(1), so the whole game is **O(n · k)**.`, {
      ...views(),
      vars: { n, k, returned: `[${out.join(", ")}]` },
      done: true,
    });
    return r.frames;
  },
};

export default program;
