import { chain, NULL_ID, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function addTwoNumbers(l1, l2) {
  const dummy = new ListNode(0);
  let tail = dummy;
  let carry = 0;
  while (l1 !== null || l2 !== null || carry !== 0) {
    const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    if (l1) l1 = l1.next;
    if (l2) l2 = l2.next;
  }
  return dummy.next;
}`;

const program: Program = {
  title: "Add two numbers stored as linked lists",
  code,
  fields: [
    { key: "l1", label: "l1 digits (ones first)", kind: "array", maxLength: 6, min: 0, max: 9 },
    { key: "l2", label: "l2 digits (ones first)", kind: "array", maxLength: 6, min: 0, max: 9 },
  ],
  examples: [
    { label: "342 + 465", input: { l1: [2, 4, 3], l2: [5, 6, 4] } },
    { label: "Carries", input: { l1: [9, 9, 9], l2: [1] } },
    { label: "Different lengths", input: { l1: [1, 8], l2: [0] } },
  ],
  run(input) {
    const a = input.l1 as number[];
    const b = input.l2 as number[];
    const r = recorder();
    const result: number[] = [];
    const number = (d: number[]) => [...d].reverse().join("") || "0";

    const views = (i: number) => [
      chain("l1", a, { tones: toneRange(0, Math.min(i, a.length) - 1, "done", i < a.length ? { [i]: "primary" } : {}), pointers: tagsAt({ l1: i < a.length ? i : NULL_ID }) }),
      chain("l2", b, { tones: toneRange(0, Math.min(i, b.length) - 1, "done", i < b.length ? { [i]: "tertiary" } : {}), pointers: tagsAt({ l2: i < b.length ? i : NULL_ID }, { l2: "tertiary" }) }),
      chain("result", [0, ...result], { tones: { 0: "muted", ...(result.length ? { [result.length]: "success" as const } : {}) }, pointers: tagsAt({ dummy: 0, tail: result.length }, { dummy: "muted", tail: "secondary" }) }),
    ];

    r.step(4, `The digits are stored **ones first**: l1 is ${number(a)} and l2 is ${number(b)}. That's lucky — it's the order you add in on paper, right to left. Start with carry = 0.`, {
      lists: views(0),
      vars: { carry: 0 },
    });

    let carry = 0;
    let i = 0;
    while (i < a.length || i < b.length || carry !== 0) {
      const x = a[i] ?? 0;
      const y = b[i] ?? 0;
      const sum = x + y + carry;
      const before = carry;
      carry = Math.floor(sum / 10);
      result.push(sum % 10);
      r.step(8, `${i < a.length ? x : "0 (l1 ran out)"} + ${i < b.length ? y : "0 (l2 ran out)"} + carry ${before} = **${sum}**. Write ${sum % 10} in a new node, carry ${carry}.`, {
        lists: views(i),
        vars: { sum, digit: sum % 10, carry },
      });
      i++;
    }

    r.step(13, `Both lists and the carry are used up. The result reads **${number(result)}** (${number(a)} + ${number(b)}). One pass over the longer list: **O(max(m, n)) time**, O(1) extra space besides the answer.`, {
      lists: [chain("result", result, { tones: toneRange(0, result.length - 1, "success"), pointers: tagsAt({ head: 0 }, { head: "secondary" }) })],
      vars: { answer: number(result) },
      done: true,
    });
    return r.frames;
  },
};

export default program;
