import { lineOf } from "../graphs";
import { dchain, NULL_ID, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function walkBothWays(head) {
  const forward = [];
  let curr = head, tail = null;
  while (curr !== null) {          // forward: follow next until null
    forward.push(curr.val);
    tail = curr;                   // remember the last node we saw
    curr = curr.next;
  }
  const backward = [];
  curr = tail;
  while (curr !== null) {          // backward: follow prev from the tail
    backward.push(curr.val);
    curr = curr.prev;
  }
  return [forward, backward];
}`;

const program: Program = {
  title: "Walk a doubly linked list both ways",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 6 }],
  examples: [
    { label: "Example", input: { head: [10, 20, 30, 40] } },
    { label: "One node", input: { head: [7] } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();
    const forward: number[] = [];
    const backward: number[] = [];
    const END = NULL_ID - 1; // the null after the tail

    const frame = (curr: number, tail: number | null, done: number[], backwardPhase: boolean) => ({
      lists: [
        dchain("list", values, {
          tones: { ...Object.fromEntries(done.map((i) => [i, "done" as const])), ...(curr >= 0 ? { [curr]: "primary" as const } : {}) },
          pointers: tagsAt({ head: 0, curr, ...(tail !== null ? { tail } : {}) }, { head: "secondary", tail: "tertiary" }),
          linkTones: backwardPhase ? {} : Object.fromEntries(done.map((i) => [i, "active" as const])),
          backTones: backwardPhase ? Object.fromEntries(done.map((i) => [i, "active" as const])) : {},
        }),
      ],
      arrays: [
        { name: "forward", values: [...forward] },
        { name: "backward", values: [...backward] },
      ],
      vars: { curr: curr >= 0 ? values[curr] : "null", tail: tail === null ? "null" : values[tail] },
    });

    r.step(lineOf(code, "let curr = head, tail = null"), `Start at the **head**. Each node has two arrows: **next** (top) and **prev** (bottom). First walk forward with next, exactly like a singly linked list.`, frame(0, null, [], false));
    const seen: number[] = [];
    for (let i = 0; i < n; i++) {
      forward.push(values[i]);
      r.step(lineOf(code, "forward.push(curr.val)"), `Visit ${values[i]}: add it to **forward**, and remember this node as the tail so far.`, { ...frame(i, i, seen, false), arrays: [{ name: "forward", values: [...forward], tones: { [i]: "write" } }, { name: "backward", values: [] }] });
      seen.push(i);
      r.step(
        lineOf(code, "curr = curr.next;"),
        i + 1 < n ? `Follow **next** to ${values[i + 1]}.` : `${values[i]}'s next is **null**: the forward walk is over, and \`tail\` is the last node, ${values[i]}.`,
        frame(i + 1 < n ? i + 1 : END, i, seen, false)
      );
    }

    const back: number[] = [];
    r.step(lineOf(code, "curr = tail;"), `Now walk **backward**. A singly linked list can't do this — a doubly linked one starts at the tail and follows **prev**.`, frame(n - 1, n - 1, [], true));
    for (let i = n - 1; i >= 0; i--) {
      backward.push(values[i]);
      r.step(lineOf(code, "backward.push(curr.val)"), `Visit ${values[i]}: add it to **backward**.`, { ...frame(i, n - 1, back, true), arrays: [{ name: "forward", values: [...forward] }, { name: "backward", values: [...backward], tones: { [backward.length - 1]: "write" } }] });
      back.push(i);
      r.step(lineOf(code, "curr = curr.prev;"), i > 0 ? `Follow **prev** back to ${values[i - 1]}.` : `${values[0]} is the head: its prev is **null**, so the backward walk stops.`, frame(i > 0 ? i - 1 : NULL_ID, n - 1, back, true));
    }

    r.step(lineOf(code, "return [forward, backward]"), `Forward gave **${forward.join(", ")}**; backward gave ${backward.join(", ")}. Each walk is **O(n)** time and **O(1)** extra space — the prev arrows are what make the second walk possible.`, {
      ...frame(NULL_ID, n - 1, [...Array(n).keys()], true),
      arrays: [
        { name: "forward", values: [...forward], tones: toneRange(0, n - 1, "success") },
        { name: "backward", values: [...backward], tones: toneRange(0, n - 1, "success") },
      ],
      done: true,
    });
    return r.frames;
  },
};

export default program;
