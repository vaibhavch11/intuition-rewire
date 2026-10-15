import { lineOf } from "../graphs";
import { ring, tagsAt } from "../structures";
import { recorder, type Program } from "../types";

const code = `function insert(head, insertVal) {
  const node = new ListNode(insertVal);
  if (head === null) {                 // empty: a ring of one
    node.next = node;
    return node;
  }
  let prev = head, curr = head.next;
  do {
    if (prev.val <= insertVal && insertVal <= curr.val) break;   // fits between two values
    if (prev.val > curr.val && (insertVal >= prev.val || insertVal <= curr.val)) break;   // at the drop: a new max or min
    prev = curr;
    curr = curr.next;
  } while (prev !== head);             // all the way round: every value is equal, so anywhere works
  prev.next = node;                    // insert between prev and curr
  node.next = curr;
  return head;
}`;

/** Sorted when read round the ring: at most one place where a value drops. */
const isSortedRing = (a: number[]) => a.filter((v, i) => v > a[(i + 1) % a.length]).length <= 1;

const program: Program = {
  title: "Insert into a sorted circular list",
  code,
  fields: [
    { key: "head", label: "ring, from the given node", kind: "array", maxLength: 6 },
    { key: "x", label: "insertVal", kind: "number" },
  ],
  examples: [
    { label: "Fits in between", input: { head: [3, 4, 1], x: 2 } },
    { label: "New maximum", input: { head: [3, 5, 1], x: 6 } },
    { label: "All equal", input: { head: [3, 3, 3], x: 4 } },
  ],
  check: (input) => (isSortedRing(input.head as number[]) ? null : "The ring must be sorted when read round from some node, like 3 4 1 (1 3 4 starting at 3)."),
  run(input) {
    const values = input.head as number[];
    const x = input.x as number;
    const n = values.length;
    const r = recorder();
    const view = (prev: number, curr: number, tones: Record<number, "primary" | "tertiary" | "write" | "success"> = {}) =>
      ring("ring", values, { tones: { [prev]: "tertiary", [curr]: "primary", ...tones }, pointers: tagsAt({ head: 0, prev, curr }, { head: "secondary", prev: "tertiary" }), linkTones: { [prev]: "active" } });

    let prev = 0;
    let curr = 1 % n;
    let why = "";
    let whyLine = "";
    r.step(lineOf(code, "let prev = head, curr = head.next;"), `The ring is sorted, but the given node needn't be the smallest. Walk round with **prev** and **curr** and look for the gap where ${x} belongs.`, { lists: [view(prev, curr)], vars: { insertVal: x } });
    for (;;) {
      const a = values[prev];
      const b = values[curr];
      if (a <= x && x <= b) {
        why = `${a} ≤ ${x} ≤ ${b}: ${x} fits **between** them.`;
        whyLine = "if (prev.val <= insertVal";
        break;
      }
      if (a > b && (x >= a || x <= b)) {
        why = `${a} > ${b} is the **drop** — from the largest value back to the smallest. ${x} is ${x >= a ? "a new largest" : "a new smallest"} value, so it goes right here.`;
        whyLine = "if (prev.val > curr.val";
        break;
      }
      r.step(
        lineOf(code, "prev = curr;"),
        a > b ? `${a} → ${b} is the drop, but ${x} is neither a new largest nor a new smallest value. Keep going.` : `${x} isn't between ${a} and ${b}. Move both pointers on.`,
        { lists: [view(curr, (curr + 1) % n)], vars: { insertVal: x } }
      );
      prev = curr;
      curr = (curr + 1) % n;
      if (prev === 0) {
        why = `We went all the way round without a gap: every value is equal, so ${x} can go anywhere.`;
        whyLine = "} while (prev !== head)";
        break;
      }
    }
    r.step(lineOf(code, whyLine), why, { lists: [view(prev, curr, { [prev]: "success", [curr]: "success" })], vars: { insertVal: x } });

    const after = [...values.slice(0, prev + 1), x, ...values.slice(prev + 1)];
    r.step(lineOf(code, "prev.next = node;"), `Link it in: ${values[prev]} → **${x}** → ${values[curr]}. The ring is still sorted, and we return the node we were given. One walk round at most: **O(n) time, O(1) space**.`, {
      lists: [ring("ring", after, { tones: { [prev + 1]: "write" }, pointers: tagsAt({ head: 0, node: prev + 1 }, { head: "secondary", node: "tertiary" }), linkTones: { [prev]: "active", [prev + 1]: "active" } })],
      vars: { insertVal: x },
      done: true,
    });
    return r.frames;
  },
};

export default program;
