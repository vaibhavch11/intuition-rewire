import { chain, NULL_ID, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function mergeTwoLists(list1, list2) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      tail.next = list1;
      list1 = list1.next;
    } else {
      tail.next = list2;
      list2 = list2.next;
    }
    tail = tail.next;
  }
  tail.next = list1 !== null ? list1 : list2;
  return dummy.next;
}`;

const sorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);

const program: Program = {
  title: "Merge two sorted lists (splice with a dummy node)",
  code,
  fields: [
    { key: "list1", label: "list1 (sorted)", kind: "array", maxLength: 5 },
    { key: "list2", label: "list2 (sorted)", kind: "array", maxLength: 5 },
  ],
  examples: [
    { label: "Example", input: { list1: [1, 2, 4], list2: [1, 3, 4] } },
    { label: "Uneven", input: { list1: [2, 6], list2: [1, 3, 4, 5] } },
    { label: "One runs out", input: { list1: [1, 2, 3], list2: [7, 8] } },
  ],
  check(input) {
    if (!sorted(input.list1 as number[])) return "list1 must be sorted from smallest to largest.";
    if (!sorted(input.list2 as number[])) return "list2 must be sorted from smallest to largest.";
    return null;
  },
  run(input) {
    const a = [...(input.list1 as number[])];
    const b = [...(input.list2 as number[])];
    const merged: number[] = [];
    const r = recorder();

    // The merged chain starts with the dummy (id 0); taken nodes follow it.
    const views = (highlight: { a?: boolean; b?: boolean } = {}, fresh = false) => [
      chain("list1", a, { tones: highlight.a ? { 0: "primary" } : {}, pointers: tagsAt({ list1: a.length ? 0 : NULL_ID }) }),
      chain("list2", b, { tones: highlight.b ? { 0: "tertiary" } : {}, pointers: tagsAt({ list2: b.length ? 0 : NULL_ID }, { list2: "tertiary" }) }),
      chain("merged", [0, ...merged], {
        tones: { 0: "muted", ...toneRange(1, merged.length, "done"), ...(fresh ? { [merged.length]: "success" as const } : {}) },
        pointers: tagsAt({ dummy: 0, tail: merged.length }, { dummy: "muted", tail: "secondary" }),
      }),
    ];

    r.step(3, `Start a **dummy** node and a \`tail\` pointer on it. The dummy gives the first real node something to attach to, so there's no special case.`, {
      lists: views(),
      vars: {},
    });

    while (a.length && b.length) {
      const takeA = a[0] <= b[0];
      r.step(5, `Compare the two fronts: ${a[0]} vs ${b[0]}. ${takeA ? `${a[0]} ≤ ${b[0]}, so list1's node goes next.` : `${b[0]} < ${a[0]}, so list2's node goes next.`}`, {
        lists: views({ a: true, b: true }),
        vars: { "list1.val": a[0], "list2.val": b[0] },
      });
      const value = takeA ? a.shift()! : b.shift()!;
      merged.push(value);
      r.step(takeA ? 7 : 10, `Splice it on: \`tail.next = ${takeA ? "list1" : "list2"}\`, move ${takeA ? "list1" : "list2"} forward, and move \`tail\` to the node we just added (${value}). No node is copied — only arrows change.`, {
        lists: views({}, true),
        vars: { tail: value },
      });
    }

    const rest = a.length ? "list1" : "list2";
    const leftovers = a.length ? a.splice(0) : b.splice(0);
    if (leftovers.length) {
      merged.push(...leftovers);
      r.step(14, `${rest === "list1" ? "list2" : "list1"} is empty. Whatever is left in ${rest} is already sorted and bigger than everything merged so far, so attach it **all at once**: \`tail.next = ${rest}\`.`, {
        lists: views({}, false),
        vars: { attached: leftovers.join(" → ") },
      });
    } else {
      r.step(14, `Both lists are used up, so there is nothing left to attach.`, { lists: views(), vars: {} });
    }

    r.step(15, `Return \`dummy.next\`, the first real node. Each node was spliced once: **O(n + m) time, O(1) extra space**.`, {
      lists: [chain("merged", merged, { tones: toneRange(0, merged.length - 1, "success"), pointers: tagsAt({ head: merged.length ? 0 : NULL_ID }, { head: "secondary" }) })],
      vars: { result: merged.join(" → ") || "empty" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
