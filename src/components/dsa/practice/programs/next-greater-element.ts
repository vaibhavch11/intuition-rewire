import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function nextGreaterElement(nums1, nums2) {
  const ans = new Array(nums1.length).fill(-1);
  const slot = new Map();                 // value -> its index in nums1
  nums1.forEach((x, i) => slot.set(x, i));
  const waiting = [];                     // still looking for something bigger
  for (const x of nums2) {
    while (waiting.length > 0 && waiting[waiting.length - 1] < x) {
      const y = waiting.pop();            // x is y's next greater element
      if (slot.has(y)) ans[slot.get(y)] = x;
    }
    waiting.push(x);
  }
  return ans;
}`;

const distinct = (a: number[]) => new Set(a).size === a.length;

const program: Program = {
  title: "Next greater element I (a waiting stack)",
  code,
  fields: [
    { key: "nums1", label: "nums1", kind: "array", maxLength: 6, min: 0, max: 99 },
    { key: "nums2", label: "nums2", kind: "array", maxLength: 9, min: 0, max: 99 },
  ],
  examples: [
    { label: "Example 1", input: { nums1: [4, 1, 2], nums2: [1, 3, 4, 2] } },
    { label: "Example 2", input: { nums1: [2, 4], nums2: [1, 2, 3, 4] } },
    { label: "One tall answer", input: { nums1: [3, 1, 5], nums2: [6, 5, 4, 3, 2, 1, 7] } },
  ],
  check(input) {
    const a = input.nums1 as number[];
    const b = input.nums2 as number[];
    if (!distinct(b)) return "nums2: every value must be different.";
    if (!distinct(a)) return "nums1: every value must be different.";
    const missing = a.find((x) => !b.includes(x));
    return missing === undefined ? null : `nums1: ${missing} isn't in nums2 — nums1 must be a subset of nums2.`;
  },
  run(input) {
    const nums1 = input.nums1 as number[];
    const nums2 = input.nums2 as number[];
    const r = recorder();
    const ans: number[] = nums1.map(() => -1);
    const slot = new Map(nums1.map((x, i) => [x, i]));
    const waiting: number[] = [];
    const answered = new Set<number>();

    const view = (j: number | undefined, tones2: Record<number, CellTone> = {}, ansTones: Record<number, CellTone> = {}, stackTones: Record<number, CellTone> = {}) => ({
      arrays: [
        {
          name: "nums2",
          values: nums2,
          tones: { ...Object.fromEntries(nums2.map((_, k) => [k, (j !== undefined && k < j ? "done" : "idle") as CellTone])), ...tones2 },
          pointers: pointersAt(nums2.length, { x: j }),
        },
        { name: "nums1", values: nums1, tones: Object.fromEntries([...answered].map((k) => [k, "success" as CellTone])) },
        { name: "ans", values: ans, tones: ansTones },
      ],
      stacks: [{ name: "waiting", values: waiting, tones: stackTones }],
    });

    r.step(5, `Every answer starts as -1. Walk through **nums2** once. Numbers that haven't seen anything bigger yet wait on a stack — and the stack is always **decreasing** from bottom to top.`, {
      ...view(undefined),
      vars: {},
    });

    nums2.forEach((x, j) => {
      while (waiting.length > 0 && waiting[waiting.length - 1] < x) {
        const y = waiting.pop()!;
        const i = slot.get(y);
        if (i !== undefined) {
          ans[i] = x;
          answered.add(i);
          r.step(9, `${x} > ${y}, and ${x} is the first bigger number after ${y}. ${y} is in nums1, so **ans[${i}] = ${x}**. Pop ${y}: it has its answer.`, {
            ...view(j, { [j]: "primary" }, { [i]: "write" }),
            vars: { x, popped: y },
          });
        } else {
          r.step(8, `${x} > ${y}, so ${x} is ${y}'s next greater element. ${y} isn't in nums1, so nobody asked — just pop it.`, {
            ...view(j, { [j]: "primary" }),
            vars: { x, popped: y },
          });
        }
      }
      waiting.push(x);
      r.step(11, waiting.length > 1 ? `${x} isn't bigger than the top (${waiting[waiting.length - 2]}). It waits too: push.` : `Nothing is waiting below ${x}. Push it to wait for a bigger number.`, {
        ...view(j, { [j]: "primary" }, {}, { [waiting.length - 1]: "write" }),
        vars: { x },
      });
    });

    r.step(13, `nums2 is finished. ${waiting.length ? `${waiting.join(", ")} never saw a bigger number, so ${waiting.length === 1 ? "its answer stays" : "their answers stay"} -1. ` : ""}Answer: **[${ans.join(", ")}]**. Every number was pushed and popped at most once: **O(n + m)**.`, {
      ...view(nums2.length, {}, Object.fromEntries(ans.map((_, k) => [k, "success" as CellTone]))),
      vars: {},
      done: true,
    });
    return r.frames;
  },
};

export default program;
