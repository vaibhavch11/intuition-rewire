import { chain, NULL_ID, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function getAt(head, k) {
  let curr = head;
  for (let i = 0; i < k && curr !== null; i++) {
    curr = curr.next;
  }
  return curr === null ? null : curr.val;
}`;

const program: Program = {
  title: "Get the kth node of a linked list",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 7 },
    { key: "k", label: "k (index)", kind: "number", min: 0, max: 10 },
  ],
  examples: [
    { label: "Example", input: { head: [10, 20, 30, 40, 50], k: 3 } },
    { label: "First node", input: { head: [10, 20, 30, 40, 50], k: 0 } },
    { label: "Past the end", input: { head: [10, 20, 30], k: 5 } },
  ],
  run(input) {
    const values = input.head as number[];
    const k = input.k as number;
    const r = recorder();
    const view = (curr: number, walked: number) =>
      chain("list", values, {
        tones: { ...toneRange(0, walked - 1, "done"), ...(curr >= 0 ? { [curr]: "primary" as const } : {}) },
        pointers: tagsAt({ head: 0, curr }, { head: "secondary" }),
      });

    r.step(2, `An array would jump straight to index ${k}. A linked list can't: the only node we can reach directly is the **head**, so \`curr\` starts there.`, {
      lists: [view(0, 0)],
      vars: { k, i: 0, curr: values[0] },
    });

    let curr = 0;
    let i = 0;
    for (; i < k && curr !== NULL_ID; i++) {
      curr = curr + 1 < values.length ? curr + 1 : NULL_ID;
      r.step(4, `Step ${i + 1}: follow \`next\` to ${curr === NULL_ID ? "**null**" : values[curr]}.`, {
        lists: [view(curr, i + 1)],
        vars: { k, i: i + 1, curr: curr === NULL_ID ? "null" : values[curr] },
      });
    }

    r.step(
      6,
      curr === NULL_ID
        ? `We ran off the end after ${i} step${i === 1 ? "" : "s"}: the list has only ${values.length} nodes, so index ${k} doesn't exist. Return **null**.`
        : `Index ${k} holds **${values[curr]}**. Reaching it took **${k} step${k === 1 ? "" : "s"}** — reading index k costs O(k), and O(n) in the worst case.`,
      {
        lists: [chain("list", values, { tones: curr >= 0 ? { ...toneRange(0, curr - 1, "done"), [curr]: "success" } : toneRange(0, values.length - 1, "muted"), pointers: tagsAt({ curr }) })],
        vars: { answer: curr === NULL_ID ? "null" : values[curr] },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
