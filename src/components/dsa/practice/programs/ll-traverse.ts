import { chain, NULL_ID, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function printList(head) {
  let curr = head;
  while (curr !== null) {
    console.log(curr.val);
    curr = curr.next;
  }
}`;

const program: Program = {
  title: "Walk a linked list",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 7 }],
  examples: [
    { label: "Example", input: { head: [10, 20, 30, 40] } },
    { label: "One node", input: { head: [7] } },
  ],
  run(input) {
    const values = input.head as number[];
    const r = recorder();
    const printed: number[] = [];
    const view = (curr: number, visited: number) =>
      chain("list", values, {
        tones: { ...toneRange(0, visited - 1, "done"), ...(curr >= 0 ? { [curr]: "primary" as const } : {}) },
        pointers: tagsAt({ head: 0, curr }, { head: "secondary" }),
      });

    r.step(2, `Start at the **head**: \`curr\` points at the first node, ${values[0]}. The head is the only node we can reach directly.`, {
      lists: [view(0, 0)],
      arrays: [{ name: "printed", values: printed }],
      vars: { curr: values[0] },
    });

    for (let i = 0; i < values.length; i++) {
      printed.push(values[i]);
      r.step(4, `\`curr\` is not null, so print its value: **${values[i]}**.`, {
        lists: [view(i, i)],
        arrays: [{ name: "printed", values: printed, tones: { [printed.length - 1]: "write" } }],
        vars: { curr: values[i] },
      });
      const next = i + 1 < values.length ? i + 1 : NULL_ID;
      r.step(
        5,
        next === NULL_ID
          ? `Follow the arrow: \`curr = curr.next\`. The last node points to **null**, so \`curr\` becomes null.`
          : `Follow the arrow: \`curr = curr.next\` moves to ${values[next]}. This is the **only** way to move forward in a list.`,
        {
          lists: [view(next, i + 1)],
          arrays: [{ name: "printed", values: printed }],
          vars: { curr: next === NULL_ID ? "null" : values[next] },
        }
      );
    }

    r.step(3, `\`curr\` is null, so the loop stops. We visited all ${values.length} node${values.length === 1 ? "" : "s"} in order: **O(n) time**, and only one extra pointer: **O(1) space**.`, {
      lists: [view(NULL_ID, values.length)],
      arrays: [{ name: "printed", values: printed, tones: toneRange(0, printed.length - 1, "success") }],
      vars: { curr: "null" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
