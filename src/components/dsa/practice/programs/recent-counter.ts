import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `class RecentCounter {
  constructor() {
    this.times = [];           // every ping, oldest first
    this.head = 0;             // the front: the oldest ping still counted
  }
  ping(t) {
    this.times.push(t);                          // the new ping joins at the back
    while (this.times[this.head] < t - 3000) {
      this.head++;                               // too old: it leaves from the front
    }
    return this.times.length - this.head;        // pings in [t - 3000, t]
  }
}`;

const program: Program = {
  title: "Recent calls (a queue as a time window)",
  code,
  fields: [{ key: "pings", label: "ping times (ms)", kind: "array", maxLength: 10, min: 1, max: 99999 }],
  examples: [
    { label: "LeetCode example", input: { pings: [1, 100, 3001, 3002] } },
    { label: "A long gap", input: { pings: [500, 1200, 2900, 7000, 7100, 9500] } },
  ],
  check(input) {
    const pings = input.pings as number[];
    if (pings.length === 0) return "Enter at least one ping time, like 1, 100, 3001.";
    for (let i = 1; i < pings.length; i++) {
      if (pings[i] <= pings[i - 1]) return "Each ping must come later than the one before it (strictly increasing times).";
    }
    return null;
  },
  run(input) {
    const pings = input.pings as number[];
    const r = recorder();
    const times: number[] = [];
    let head = 0;

    const view = (tones: Record<number, CellTone> = {}) => {
      const all: Record<number, CellTone> = {};
      for (let i = 0; i < head; i++) all[i] = "muted";
      Object.assign(all, tones);
      const live = times.length - head;
      const marks = live === 0 ? {} : live === 1 ? { "front = back": head } : { front: head, back: times.length - 1 };
      return { arrays: [{ name: "times", values: times, tones: all, pointers: pointersAt(times.length, marks, { back: "tertiary" }) }] };
    };

    r.step(3, `Each ping is a request at time **t** (in ms). We must answer: how many requests arrived in the last **3000 ms**, i.e. in **[t − 3000, t]**? Times only grow, so the oldest request is always the first to fall out of the window — a **queue**.`, {
      ...view(),
      vars: { counted: 0 },
    });

    for (const t of pings) {
      times.push(t);
      r.step(7, `**ping(${t})** — ${t} joins at the **back**. The window is now [${t - 3000}, ${t}].`, {
        ...view({ [times.length - 1]: "write" }),
        vars: { t, "window starts": t - 3000, counted: times.length - head },
      });
      const dropped: number[] = [];
      while (times[head] < t - 3000) dropped.push(times[head++]);
      if (dropped.length) {
        r.step(9, `${dropped.join(", ")} ${dropped.length === 1 ? "is" : "are"} older than ${t - 3000}, so ${dropped.length === 1 ? "it leaves" : "they leave"} from the **front**. The loop stops at ${times[head]}, the first time still inside the window.`, {
          ...view(),
          vars: { t, "window starts": t - 3000, counted: times.length - head },
        });
      }
      r.step(11, `Everything still in the queue is inside the window: return **${times.length - head}**.`, {
        ...view(Object.fromEntries(Array.from({ length: times.length - head }, (_, k) => [head + k, "success" as CellTone]))),
        vars: { t, "window starts": t - 3000, returned: times.length - head },
      });
    }

    r.step(3, `Done. Every time joined the queue once and left it at most once, so all the pings together cost **O(n)** — **O(1) amortized** per ping.`, {
      ...view(),
      vars: { counted: times.length - head },
      done: true,
    });
    return r.frames;
  },
};

export default program;
