import { chain, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function reorderList(head) {
  let slow = head, fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let prev = null, curr = slow.next;
  slow.next = null;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  let first = head, second = prev;
  while (second !== null) {
    const next1 = first.next, next2 = second.next;
    first.next = second;
    second.next = next1;
    first = next1;
    second = next2;
  }
}`;

const program: Program = {
  title: "Reorder list (middle, reverse, weave)",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 8 }],
  examples: [
    { label: "Even length", input: { head: [1, 2, 3, 4] } },
    { label: "Odd length", input: { head: [1, 2, 3, 4, 5] } },
    { label: "Longer", input: { head: [1, 2, 3, 4, 5, 6, 7] } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();

    // Phase 1: find the middle.
    let slow = 0;
    let fast = 0;
    r.step(2, `Goal: L0 → Ln → L1 → Ln-1 → … The plan has three phases. **Phase 1 — find the middle** with slow (1 step) and fast (2 steps).`, {
      lists: [chain("list", values, { pointers: tagsAt({ slow, fast }, { fast: "tertiary" }) })],
      vars: {},
    });
    while (fast + 1 < n && fast + 2 < n) {
      slow++;
      fast += 2;
      r.step(5, `slow → ${values[slow]}, fast → ${values[fast]}.`, {
        lists: [chain("list", values, { tones: { [slow]: "primary" }, pointers: tagsAt({ slow, fast }, { fast: "tertiary" }) })],
        vars: { slow: values[slow], fast: values[fast] },
      });
    }

    const firstHalf = values.slice(0, slow + 1);
    const secondHalf = values.slice(slow + 1);
    r.step(8, `Cut after slow (\`slow.next = null\`): the first half is ${firstHalf.join(" → ")}, the second half is ${secondHalf.join(" → ") || "empty"}.`, {
      lists: [chain("first half", firstHalf, { tones: toneRange(0, firstHalf.length - 1, "done") }), chain("second half", secondHalf)],
      vars: {},
    });

    // Phase 2: reverse the second half.
    const reversed: number[] = [];
    const rest = [...secondHalf];
    while (rest.length) {
      reversed.unshift(rest.shift()!);
      r.step(11, `**Phase 2 — reverse the second half**, one arrow at a time: ${reversed[0]} now points to ${reversed.length > 1 ? reversed[1] : "null"}.`, {
        lists: [
          chain("first half", firstHalf, { tones: toneRange(0, firstHalf.length - 1, "done") }),
          chain("reversed", reversed, { tones: { 0: "write" }, pointers: tagsAt({ prev: 0 }, { prev: "tertiary" }) }),
          chain("still to reverse", rest, { pointers: rest.length ? tagsAt({ curr: 0 }) : {} }),
        ],
        vars: { prev: reversed[0] },
      });
    }

    // Phase 3: weave the halves together.
    const woven: number[] = [];
    const a = [...firstHalf];
    const b = [...reversed];
    r.step(15, `**Phase 3 — weave**: take one node from the first half, then one from the reversed second half, and repeat.`, {
      lists: [chain("first", a, { pointers: tagsAt({ first: 0 }) }), chain("second", b, { pointers: tagsAt({ second: 0 }, { second: "tertiary" }) }), chain("result", woven)],
      vars: {},
    });
    while (b.length) {
      woven.push(a.shift()!, b.shift()!);
      r.step(19, `Link ${woven[woven.length - 2]} → ${woven[woven.length - 1]} → (the next node of the first half).`, {
        lists: [
          chain("first", a, { pointers: a.length ? tagsAt({ first: 0 }) : {} }),
          chain("second", b, { pointers: b.length ? tagsAt({ second: 0 }, { second: "tertiary" }) : {} }),
          chain("result", woven, { tones: { [woven.length - 2]: "success", [woven.length - 1]: "success" } }),
        ],
        vars: {},
      });
    }
    woven.push(...a);

    r.step(16, `second is null, so the weave is finished: **${woven.join(" → ")}**. Three linear passes, only pointer changes: **O(n) time, O(1) space**.`, {
      lists: [chain("list", woven, { tones: toneRange(0, woven.length - 1, "success") })],
      vars: { result: woven.join(" → ") },
      done: true,
    });
    return r.frames;
  },
};

export default program;
