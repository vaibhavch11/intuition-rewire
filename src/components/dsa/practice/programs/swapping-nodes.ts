import { chain, tagsAt } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function swapNodes(head, k) {
  let first = head;
  for (let i = 1; i < k; i++) first = first.next;
  let second = head;
  let fast = first;
  while (fast.next !== null) {
    fast = fast.next;
    second = second.next;
  }
  [first.val, second.val] = [second.val, first.val];
  return head;
}`;

const program: Program = {
  title: "Swap the kth node from the start and the end",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 8 },
    { key: "k", label: "k", kind: "number", min: 1, max: 8 },
  ],
  examples: [
    { label: "Example", input: { head: [1, 2, 3, 4, 5], k: 2 } },
    { label: "Ends", input: { head: [10, 20, 30, 40], k: 1 } },
    { label: "Same node", input: { head: [1, 2, 3, 4, 5], k: 3 } },
  ],
  check(input) {
    const len = (input.head as number[]).length;
    return (input.k as number) > len ? `k can be at most ${len}, the length of the list.` : null;
  },
  run(input) {
    const values = [...(input.head as number[])];
    const k = input.k as number;
    const n = values.length;
    const r = recorder();
    const view = (marks: Record<string, number>, tones: Record<number, CellTone> = {}) =>
      chain("list", values, { tones, pointers: tagsAt(marks, { second: "tertiary", fast: "muted" }) });

    let first = 0;
    r.step(2, `Walk \`first\` from the head to the **kth node from the start** (k = ${k}).`, { lists: [view({ first }, { 0: "primary" })], vars: { k } });
    for (let i = 1; i < k; i++) {
      first++;
      r.step(3, `first → ${values[first]} (node ${i + 1}).`, { lists: [view({ first }, { [first]: "primary" })], vars: { k, position: i + 1 } });
    }

    let second = 0;
    let fast = first;
    r.step(5, `Here's the trick: \`fast\` starts at first, which is **k − 1 nodes ahead** of the head. Start \`second\` at the head. When fast reaches the last node, second will be k − 1 nodes behind it — the kth from the end.`, {
      lists: [view({ first, second, fast }, { [first]: "primary", [second]: "tertiary" })],
      vars: { first: values[first], second: values[second] },
    });
    while (fast + 1 < n) {
      fast++;
      second++;
      r.step(8, `fast → ${values[fast]}, second → ${values[second]}.`, {
        lists: [view({ first, second, fast }, { [first]: "primary", [second]: "tertiary" })],
        vars: { first: values[first], second: values[second] },
      });
    }

    r.step(10, `fast is on the last node, so second is the **kth node from the end** (${values[second]}). Swap the two values.`, {
      lists: [view({ first, second }, { [first]: "write", [second]: "write" })],
      vars: { first: values[first], second: values[second] },
    });
    [values[first], values[second]] = [values[second], values[first]];
    r.step(11, `Swapped: **${values.join(" → ")}**. One pass, no extra memory: **O(n) time, O(1) space**.${first === second ? " (Here both pointers were the same node, so nothing changed.)" : ""}`, {
      lists: [view({ first, second }, { [first]: "success", [second]: "success" })],
      vars: { result: values.join(" → ") },
      done: true,
    });
    return r.frames;
  },
};

export default program;
