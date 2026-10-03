import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast !== null) {
    slow = slow.next;
    fast = fast.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}`;

const DUMMY = 100;

const program: Program = {
  title: "Remove the nth node from the end (one pass, two pointers)",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 7 },
    { key: "n", label: "n (from the end)", kind: "number", min: 1, max: 7 },
  ],
  examples: [
    { label: "Example", input: { head: [1, 2, 3, 4, 5], n: 2 } },
    { label: "Remove the head", input: { head: [1, 2, 3], n: 3 } },
    { label: "Remove the tail", input: { head: [1, 2, 3, 4], n: 1 } },
  ],
  check(input) {
    const len = (input.head as number[]).length;
    return (input.n as number) > len ? `n can be at most ${len}, the length of the list.` : null;
  },
  run(input) {
    const values = input.head as number[];
    const n = input.n as number;
    const len = values.length;
    const r = recorder();
    const next = new Map<number, number>([[DUMMY, 0]]);
    values.forEach((_, i) => next.set(i, i + 1 < len ? i + 1 : NULL_ID));
    let removed = -1;
    const name = (id: number) => (id === NULL_ID ? "null" : id === DUMMY ? "dummy" : String(values[id]));

    const view = (slow: number, fast: number, tones: Record<number, CellTone> = {}, fresh?: number) => {
      const nodes: ListNodeView[] = [
        { id: DUMMY, value: 0, col: 0, tone: "muted" },
        ...values.map((value, i) => ({ id: i, value, col: i + 1, row: i === removed ? 1 : 0, tone: i === removed ? ("muted" as const) : tones[i] })),
        { id: NULL_ID, value: null, col: len + 1 },
      ];
      const links: ListLink[] = [...next].map(([from, to]) => ({ from, to, tone: (from === removed ? "muted" : from === fresh ? "active" : "idle") as EdgeTone }));
      return { name: "list", nodes, links, pointers: tagsAt({ dummy: DUMMY, slow, fast }, { dummy: "muted", fast: "tertiary" }) };
    };

    let fast = DUMMY;
    let slow = DUMMY;
    r.step(4, `Put a **dummy** node before the head (so even the head can be removed the same way), and start both pointers on it.`, {
      lists: [view(slow, fast)],
      vars: { n },
    });
    for (let i = 0; i <= n; i++) {
      fast = next.get(fast)!;
      r.step(5, `Give fast a head start: step ${i + 1} of ${n + 1} → ${name(fast)}.`, {
        lists: [view(slow, fast, fast >= 0 && fast !== DUMMY ? { [fast]: "tertiary" } : {})],
        vars: { n, gap: i + 1 },
      });
    }
    r.step(6, `Now fast is **n + 1 = ${n + 1}** nodes ahead of slow. Keep that gap and move both together.`, {
      lists: [view(slow, fast)],
      vars: { slow: name(slow), fast: name(fast) },
    });
    while (fast !== NULL_ID) {
      slow = next.get(slow)!;
      fast = next.get(fast)!;
      r.step(8, `slow → ${name(slow)}, fast → ${name(fast)}.`, {
        lists: [view(slow, fast, { ...(slow >= 0 && slow !== DUMMY ? { [slow]: "primary" as const } : {}) })],
        vars: { slow: name(slow), fast: name(fast) },
      });
    }

    const target = next.get(slow)!;
    r.step(10, `fast fell off the end, so slow is exactly **one node before** the ${n === 1 ? "last node" : `${n}th node from the end`} (${values[target]}).`, {
      lists: [view(slow, fast, { ...(slow !== DUMMY ? { [slow]: "primary" as const } : {}), [target]: "write" })],
      vars: { slow: name(slow), remove: values[target] },
    });
    next.set(slow, next.get(target)!);
    removed = target;
    r.step(10, `Skip it: \`slow.next = slow.next.next\`.`, {
      lists: [view(slow, fast, slow !== DUMMY ? { [slow]: "primary" } : {}, slow)],
      vars: { removed: values[target] },
    });
    const kept = values.filter((_, i) => i !== target);
    r.step(11, `Return \`dummy.next\`: **${kept.join(" → ") || "empty"}**. One pass, two pointers: **O(n) time, O(1) space**.`, {
      lists: [view(DUMMY, NULL_ID)],
      vars: { result: kept.join(" → ") || "empty" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
