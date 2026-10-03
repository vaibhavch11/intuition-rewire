import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`;

const program: Program = {
  title: "Linked list cycle (Floyd's tortoise and hare)",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 7 },
    { key: "pos", label: "tail links to index (-1 = no cycle)", kind: "number", min: -1, max: 6 },
  ],
  examples: [
    { label: "Cycle", input: { head: [3, 2, 0, -4], pos: 1 } },
    { label: "Long cycle", input: { head: [1, 2, 3, 4, 5, 6], pos: 2 } },
    { label: "No cycle", input: { head: [1, 2, 3, 4], pos: -1 } },
  ],
  check(input) {
    const n = (input.head as number[]).length;
    return (input.pos as number) >= n ? `pos must be -1 or an index from 0 to ${n - 1}.` : null;
  },
  run(input) {
    const values = input.head as number[];
    const pos = input.pos as number;
    const n = values.length;
    const r = recorder();
    const next = (i: number) => (i === NULL_ID ? NULL_ID : i + 1 < n ? i + 1 : pos >= 0 ? pos : NULL_ID);
    const name = (i: number) => (i === NULL_ID ? "null" : String(values[i]));

    const view = (slow: number, fast: number, tones: Record<number, CellTone> = {}) => {
      const nodes: ListNodeView[] = values.map((value, i) => ({ id: i, value, col: i, tone: tones[i] }));
      const links: ListLink[] = values.map((_, i) => ({ from: i, to: next(i), tone: i === n - 1 && pos >= 0 ? "active" : "idle" }));
      if (pos < 0) nodes.push({ id: NULL_ID, value: null, col: n });
      return { name: "list", nodes, links, pointers: tagsAt({ slow, fast }, { fast: "tertiary" }) };
    };

    let slow = 0;
    let fast = 0;
    r.step(
      3,
      pos >= 0
        ? `The last node (${values[n - 1]}) points back to ${values[pos]} — a **cycle**. A normal walk would go round forever, so we send two runners: **slow** (1 step) and **fast** (2 steps).`
        : `Two runners start at the head: **slow** moves 1 node per step, **fast** moves 2.`,
      { lists: [view(slow, fast, { 0: "primary" })], vars: { slow: name(slow), fast: name(fast) } }
    );

    let steps = 0;
    while (fast !== NULL_ID && next(fast) !== NULL_ID && steps < 40) {
      slow = next(slow);
      fast = next(next(fast));
      steps++;
      const tones: Record<number, CellTone> = { [slow]: "primary" };
      if (fast !== NULL_ID) tones[fast] = "tertiary";
      r.step(6, `Step ${steps}: slow → ${name(slow)}, fast → ${name(fast)}.${pos >= 0 && fast !== slow ? " Inside the loop, fast gains one node on slow every step." : ""}`, {
        lists: [view(slow, fast, tones)],
        vars: { slow: name(slow), fast: name(fast), steps },
      });
      if (slow === fast) {
        r.step(7, `slow and fast landed on the **same node** (${values[slow]}). Two runners on a straight road never meet, so the list must loop: return **true**. **O(n) time, O(1) space**.`, {
          lists: [view(slow, fast, { [slow]: "success" })],
          vars: { answer: "true" },
          done: true,
        });
        return r.frames;
      }
    }

    r.step(9, `fast reached the end (null), so there's no loop to trap it: return **false**. **O(n) time, O(1) space**.`, {
      lists: [view(slow, fast)],
      vars: { answer: "false" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
