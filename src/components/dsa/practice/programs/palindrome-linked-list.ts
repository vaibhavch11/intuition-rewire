import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type EdgeTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function isPalindrome(head) {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let prev = null;
  while (slow !== null) {
    const next = slow.next;
    slow.next = prev;
    prev = slow;
    slow = next;
  }
  let left = head, right = prev;
  while (right !== null) {
    if (left.val !== right.val) return false;
    left = left.next;
    right = right.next;
  }
  return true;
}`;

// The second half's own null hangs below the middle once it is reversed.
const MID_NULL = -3;

const program: Program = {
  title: "Palindrome linked list (reverse the second half)",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 8 }],
  examples: [
    { label: "Palindrome", input: { head: [1, 2, 2, 1] } },
    { label: "Odd length", input: { head: [1, 2, 3, 2, 1] } },
    { label: "Not one", input: { head: [1, 2, 3, 1] } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();
    const next: number[] = values.map((_, i) => (i + 1 < n ? i + 1 : NULL_ID));
    const flipped = new Set<number>();
    const name = (i: number) => (i === NULL_ID || i === MID_NULL ? "null" : String(values[i]));

    let midStart = -1;
    const view = (marks: Record<string, number>, tones: Record<number, CellTone> = {}, fresh?: number) => {
      const nodes: ListNodeView[] = [
        ...values.map((value, i) => ({ id: i, value, col: i, tone: tones[i] ?? (flipped.has(i) ? ("done" as const) : undefined) })),
        { id: NULL_ID, value: null, col: n },
      ];
      if (midStart >= 0) nodes.push({ id: MID_NULL, value: null, col: midStart, row: 1 });
      const links: ListLink[] = values.map((_, i) => ({ from: i, to: next[i], tone: (i === fresh ? "active" : flipped.has(i) ? "done" : "idle") as EdgeTone }));
      return { name: "list", nodes, links, pointers: tagsAt(marks, { fast: "tertiary", prev: "tertiary", right: "tertiary" }) };
    };

    // Phase 1: find the middle.
    let slow = 0;
    let fast = 0;
    r.step(2, `**Phase 1 — find the middle.** slow moves 1 node per step, fast moves 2.`, { lists: [view({ slow, fast })], vars: {} });
    while (fast !== NULL_ID && next[fast] !== NULL_ID) {
      slow = next[slow];
      fast = next[next[fast]];
      r.step(5, `slow → ${name(slow)}, fast → ${name(fast)}.`, {
        lists: [view({ slow, fast }, { [slow]: "primary" })],
        vars: { slow: name(slow), fast: name(fast) },
      });
    }

    // Phase 2: reverse from slow to the end.
    midStart = slow;
    let prev: number = MID_NULL;
    r.step(7, `**Phase 2 — reverse the second half**, starting at slow (${name(slow)}). \`prev\` starts as null.`, {
      lists: [view({ slow }, { [slow]: "primary" })],
      vars: { slow: name(slow), prev: "null" },
    });
    while (slow !== NULL_ID) {
      const nxt = next[slow];
      next[slow] = prev;
      flipped.add(slow);
      r.step(10, `Flip ${values[slow]}'s arrow back to ${name(prev)}.`, {
        lists: [view({ slow, prev: prev === MID_NULL ? MID_NULL : prev }, { [slow]: "write" }, slow)],
        vars: { slow: name(slow), prev: name(prev) },
      });
      prev = slow;
      slow = nxt;
    }

    // Phase 3: compare.
    let left = 0;
    let right = prev;
    r.step(14, `**Phase 3 — compare.** \`left\` walks in from the head, \`right\` walks in from the old tail (now the head of the reversed half).`, {
      lists: [view({ left, right }, { [left]: "primary", [right]: "tertiary" })],
      vars: { left: name(left), right: name(right) },
    });
    while (right !== MID_NULL) {
      if (values[left] !== values[right]) {
        r.step(16, `${values[left]} ≠ ${values[right]}: the two ends don't match, so this is **not** a palindrome. Return false.`, {
          lists: [view({ left, right }, { [left]: "write", [right]: "write" })],
          vars: { left: values[left], right: values[right], answer: "false" },
          done: true,
        });
        return r.frames;
      }
      r.step(16, `${values[left]} = ${values[right]}. Match — step both inward.`, {
        lists: [view({ left, right }, { [left]: "success", [right]: "success" })],
        vars: { left: values[left], right: values[right] },
      });
      left = next[left];
      right = next[right];
    }

    r.step(20, `\`right\` ran out and every pair matched: it **is** a palindrome. Three linear passes and a few pointers: **O(n) time, O(1) space**. (In real code, reverse the second half back afterwards so the caller gets their list unchanged.)`, {
      lists: [view({}, Object.fromEntries(values.map((_, i) => [i, "success" as CellTone])))],
      vars: { answer: "true" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
