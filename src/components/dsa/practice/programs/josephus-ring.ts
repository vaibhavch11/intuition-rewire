import { lineOf } from "../graphs";
import { ring, tagsAt } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function findTheWinner(n, k) {
  const head = new ListNode(1);        // friends 1..n sitting in a ring
  let tail = head;
  for (let i = 2; i <= n; i++) {
    tail.next = new ListNode(i);
    tail = tail.next;
  }
  tail.next = head;
  let prev = tail;                     // the node before whoever counts "1"
  while (prev.next !== prev) {         // until one friend is left
    for (let i = 0; i < k - 1; i++) prev = prev.next;   // count k - 1 friends
    prev.next = prev.next.next;        // the k-th friend leaves the circle
  }
  return prev.val;
}`;

const program: Program = {
  title: "The circular game on a circular linked list",
  code,
  fields: [
    { key: "n", label: "n (friends)", kind: "number", min: 1, max: 8 },
    { key: "k", label: "k (count)", kind: "number", min: 1, max: 6 },
  ],
  examples: [
    { label: "Example", input: { n: 5, k: 2 } },
    { label: "k = 3", input: { n: 6, k: 3 } },
    { label: "k = 1", input: { n: 4, k: 1 } },
  ],
  run(input) {
    const n = input.n as number;
    const k = input.k as number;
    const r = recorder();
    let alive = Array.from({ length: n }, (_, i) => i + 1);
    const out: number[] = [];

    // Positions in `alive`; the ring is redrawn with only the friends still playing.
    const frame = (prev: number, counted: number[] = [], leaving: number | null = null) => {
      const tones: Record<number, CellTone> = {};
      counted.forEach((p) => (tones[p] = "tertiary"));
      if (leaving !== null) tones[leaving] = "write";
      return {
        lists: [ring("circle", alive, { tones, pointers: tagsAt({ prev }, { prev: "tertiary" }), linkTones: leaving !== null ? { [prev]: "active" } : {} })],
        arrays: [{ name: "left the circle", values: [...out] }],
        vars: { k, "still playing": alive.length },
      };
    };

    let prev = n - 1; // the tail: the node before friend 1
    r.step(lineOf(code, "let prev = tail;"), `Seat friends 1 to ${n} in a **circular linked list** — after friend ${n} comes friend 1 again. \`prev\` waits on the node **before** whoever counts "1", because removing a node needs the one before it.`, frame(prev));
    while (alive.length > 1) {
      const counted: number[] = [];
      let p = prev;
      for (let i = 0; i < k - 1; i++) {
        p = (p + 1) % alive.length;
        counted.push(p);
      }
      const leaving = (p + 1) % alive.length;
      r.step(
        lineOf(code, "for (let i = 0; i < k - 1; i++) prev = prev.next"),
        k === 1
          ? `k = 1: the next friend, **${alive[leaving]}**, is counted "1" and leaves at once.`
          : `Count round the circle: ${[...counted, leaving].map((q) => alive[q]).join(", ")}. prev stops on ${alive[p]}, so friend **${alive[leaving]}** is number ${k}.`,
        frame(p, counted, leaving)
      );
      out.push(alive[leaving]);
      const gone = alive[leaving];
      alive = alive.filter((_, i) => i !== leaving);
      // prev keeps its node; its position only shifts if the removed friend sat before it (the wrap-around).
      prev = leaving === 0 ? p - 1 : p;
      r.step(lineOf(code, "prev.next = prev.next.next;"), `Friend ${gone} leaves: prev skips over that node in one pointer change. Counting restarts from the friend after them.`, frame(prev));
    }
    r.step(lineOf(code, "return prev.val;"), `Only friend **${alive[0]}** is left — the winner. Each of the ${n - 1} rounds counts ${k} step${k === 1 ? "" : "s"}: **O(n · k) time, O(n) space**.`, { ...frame(0), done: true });
    return r.frames;
  },
};

export default program;
