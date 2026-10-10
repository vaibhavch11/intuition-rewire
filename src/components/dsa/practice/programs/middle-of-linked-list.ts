import { chain, NULL_ID, tagsAt } from "../structures";
import { recorder, type Program } from "../types";

const code = `function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`;

const program: Program = {
  title: "Middle of a linked list (slow and fast pointers)",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 8 }],
  examples: [
    { label: "Odd length", input: { head: [1, 2, 3, 4, 5] } },
    { label: "Even length", input: { head: [1, 2, 3, 4, 5, 6] } },
    { label: "One node", input: { head: [9] } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();
    const at = (i: number) => (i < n ? i : NULL_ID);
    const name = (i: number) => (i === NULL_ID ? "null" : String(values[i]));
    let slow = 0;
    let fast = 0;
    const view = () =>
      chain("list", values, {
        tones: { [slow]: "primary", ...(fast !== NULL_ID ? { [fast]: "tertiary" as const } : {}) },
        pointers: tagsAt({ slow, fast }, { fast: "tertiary" }),
      });

    r.step(3, `Both pointers start at the head. **slow** will move 1 node per step, **fast** 2 nodes per step.`, {
      lists: [view()],
      vars: { slow: name(slow), fast: name(fast) },
    });

    let steps = 0;
    while (fast !== NULL_ID && at(fast + 1) !== NULL_ID) {
      slow = slow + 1;
      r.step(5, `slow takes **one** step → ${name(slow)}.`, { lists: [view()], vars: { slow: name(slow), fast: name(fast) } });
      fast = at(fast + 2);
      steps++;
      r.step(6, `fast takes **two** steps → ${name(fast)}. fast has covered twice the distance of slow.`, {
        lists: [view()],
        vars: { slow: name(slow), fast: name(fast), steps },
      });
    }

    r.step(
      8,
      `${fast === NULL_ID ? "fast ran off the end" : "fast is on the last node"}, so it can't take two more steps. slow has gone exactly half as far: **${values[slow]}** is the middle${n % 2 === 0 ? " (with an even length, this is the second of the two middles)" : ""}. One pass: **O(n) time, O(1) space**.`,
      {
        lists: [chain("list", values, { tones: { [slow]: "success" }, pointers: tagsAt({ middle: slow }, { middle: "secondary" }) })],
        vars: { middle: values[slow] },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
