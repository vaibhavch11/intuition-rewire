import { lineOf } from "../graphs";
import { ring, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function walkCircular(head) {
  const values = [];
  if (head === null) return values;   // an empty ring has nothing to visit
  let curr = head;
  do {
    values.push(curr.val);
    curr = curr.next;
  } while (curr !== head);            // stop when we're back at the start
  return values;
}`;

const program: Program = {
  title: "Walk a circular linked list",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 6 }],
  examples: [
    { label: "Example", input: { head: [10, 20, 30, 40] } },
    { label: "One node", input: { head: [7] } },
  ],
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const r = recorder();
    const out: number[] = [];

    const frame = (curr: number, visited: number, hot = -1) => ({
      lists: [
        ring("ring", values, {
          tones: { ...toneRange(0, visited - 1, "done"), [curr]: visited === n ? "success" : "primary" },
          pointers: tagsAt({ head: 0, curr }, { head: "secondary" }),
          linkTones: hot >= 0 ? { [hot]: "active" } : {},
        }),
      ],
      arrays: [{ name: "values", values: [...out] }],
      vars: { curr: values[curr] },
    });

    r.step(lineOf(code, "let curr = head;"), `A circular list has **no null** at the end: the last node points back to the head. So \`while (curr !== null)\` would loop forever. Instead, remember where we started and stop when we get back there.`, frame(0, 0));
    for (let i = 0; i < n; i++) {
      out.push(values[i]);
      r.step(lineOf(code, "values.push(curr.val)"), `Visit ${values[i]}.`, { ...frame(i, i), arrays: [{ name: "values", values: [...out], tones: { [i]: "write" } }] });
      const next = (i + 1) % n;
      r.step(
        lineOf(code, "curr = curr.next;"),
        next === 0
          ? `${values[i]} is the last node, and its next is **the head** again (the curved arrow). \`curr\` is back where it started.`
          : `Follow next to ${values[next]}. It isn't the head, so keep going.`,
        frame(next, i + 1, i)
      );
    }
    r.step(lineOf(code, "} while (curr !== head)"), `\`curr === head\`: every node has been visited **exactly once**: **${out.join(", ")}**. O(n) time, O(1) extra space. A \`do … while\` is used so the head itself is visited before the first check.`, {
      ...frame(0, n),
      arrays: [{ name: "values", values: [...out], tones: toneRange(0, n - 1, "success") }],
      done: true,
    });
    return r.frames;
  },
};

export default program;
