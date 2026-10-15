import { lineOf } from "../graphs";
import { chain, ring, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function rotateRight(head, k) {
  if (head === null || head.next === null) return head;
  let n = 1, tail = head;
  while (tail.next !== null) {         // count the nodes and find the tail
    tail = tail.next;
    n++;
  }
  k %= n;                              // rotating by n changes nothing
  if (k === 0) return head;
  tail.next = head;                    // close the list into a ring
  let newTail = head;
  for (let i = 0; i < n - k - 1; i++) newTail = newTail.next;   // n - k - 1 steps from the head
  const newHead = newTail.next;
  newTail.next = null;                 // cut the ring after the new tail
  return newHead;
}`;

const program: Program = {
  title: "Rotate a list right by k (close it into a ring, then cut)",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 6 },
    { key: "k", label: "k", kind: "number", min: 0, max: 20 },
  ],
  examples: [
    { label: "Example", input: { head: [1, 2, 3, 4, 5], k: 2 } },
    { label: "k bigger than n", input: { head: [0, 1, 2], k: 4 } },
    { label: "k = n", input: { head: [1, 2, 3], k: 3 } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const k0 = input.k as number;
    const r = recorder();
    const line = (snippet: string) => lineOf(code, snippet);
    const chainView = (marks: Record<string, number>, upto = -1) => chain("list", values, { tones: toneRange(0, upto, "done"), pointers: tagsAt(marks, { head: "secondary", tail: "tertiary", newTail: "tertiary", newHead: "secondary" }) });

    if (n <= 1) {
      r.step(line("if (head === null || head.next === null) return head"), `With ${n === 0 ? "no nodes" : "one node"}, every rotation gives the same list: **[${values.join(", ")}]**.`, { lists: [chainView({ head: 0 })], done: true });
      return r.frames;
    }
    r.step(line("let n = 1, tail = head;"), `Rotating right by k moves the last k nodes to the front. First walk to the **tail**, counting the nodes.`, { lists: [chainView({ head: 0, tail: 0 }, 0)], vars: { n: 1 } });
    for (let i = 1; i < n; i++) r.step(line("tail = tail.next;"), `tail moves to ${values[i]}: n = ${i + 1}.`, { lists: [chainView({ head: 0, tail: i }, i)], vars: { n: i + 1 } });
    const k = k0 % n;
    r.step(line("k %= n;"), `n = ${n}. Rotating by ${n} puts every node back where it started, so only k mod n matters: ${k0} mod ${n} = **${k}**.`, { lists: [chainView({ head: 0, tail: n - 1 })], vars: { n, k } });
    if (k === 0) {
      r.step(line("if (k === 0) return head;"), `k is 0: the list doesn't change. **[${values.join(", ")}]**.`, { lists: [chainView({ head: 0 })], done: true });
      return r.frames;
    }
    r.step(line("tail.next = head;"), `**Close the list into a ring**: the tail points back at the head. Now a rotation is just choosing where to cut.`, { lists: [ring("ring", values, { pointers: tagsAt({ head: 0, tail: n - 1 }, { head: "secondary", tail: "tertiary" }), linkTones: { [n - 1]: "active" } })], vars: { n, k } });
    const stepsToTail = n - k - 1;
    for (let i = 0; i <= stepsToTail; i++) {
      r.step(
        line(i === 0 ? "let newTail = head;" : "for (let i = 0; i < n - k - 1; i++)"),
        i === 0 ? `The new tail is the node **${n - k - 1} steps** from the head (n − k − 1). Start at the head.` : `newTail moves to ${values[i]}.`,
        { lists: [ring("ring", values, { tones: { [i]: "tertiary" }, pointers: tagsAt({ head: 0, newTail: i }, { head: "secondary", newTail: "tertiary" }) })], vars: { n, k } }
      );
    }
    const t = stepsToTail;
    const h = (t + 1) % n;
    const rotated = [...values.slice(h), ...values.slice(0, h)];
    r.step(line("newTail.next = null;"), `The node after the new tail, ${values[h]}, is the **new head**. Cut the ring after ${values[t]}: its next becomes null.`, { lists: [ring("ring", values, { tones: { [t]: "tertiary", [h]: "primary" }, pointers: tagsAt({ newTail: t, newHead: h }, { newTail: "tertiary", newHead: "secondary" }), linkTones: { [t]: "write" } })] });
    r.step(line("return newHead;"), `Rotated right by ${k0}: **[${rotated.join(", ")}]**. One walk to count, one partial walk to the cut: **O(n) time, O(1) space**.`, {
      lists: [chain("rotated", rotated, { tones: toneRange(0, n - 1, "success"), pointers: tagsAt({ head: 0 }, { head: "secondary" }) })],
      done: true,
    });
    return r.frames;
  },
};

export default program;
