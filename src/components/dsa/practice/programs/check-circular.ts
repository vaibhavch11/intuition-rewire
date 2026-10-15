import { lineOf } from "../graphs";
import { chain, NULL_ID, ring, tagsAt } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function isCircular(head) {
  if (head === null) return false;     // an empty list has no ring
  let curr = head.next;
  while (curr !== null && curr !== head) curr = curr.next;   // until the end, or back at the start
  return curr === head;                // back at the head: circular; fell off at null: not
}`;

const program: Program = {
  title: "Is the linked list circular?",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 6 },
    { key: "last", label: "last node points to", kind: "text", maxLength: 4, hint: "head or null" },
  ],
  examples: [
    { label: "Circular", input: { head: [1, 2, 3, 4], last: "head" } },
    { label: "Ends in null", input: { head: [1, 2, 3, 4], last: "null" } },
    { label: "One node, circular", input: { head: [5], last: "head" } },
  ],
  check: (input) => (input.last === "head" || input.last === "null" ? null : 'last node points to: type "head" or "null".'),
  run(input) {
    const values = input.head as number[];
    const n = values.length;
    const circular = input.last === "head";
    const r = recorder();
    const view = (curr: number, visited: number) => {
      const opts = { tones: { ...toneRange(0, visited - 1, "done"), ...(curr >= 0 ? { [curr]: "primary" as const } : {}) }, pointers: tagsAt({ head: 0, curr }, { head: "secondary", curr: "tertiary" }) };
      return circular ? ring("list", values, opts) : chain("list", values, opts);
    };

    // curr starts at head.next.
    let curr = n > 1 ? 1 : circular ? 0 : NULL_ID;
    r.step(lineOf(code, "let curr = head.next;"), `Start one step past the head and keep walking. Only two things can happen: we reach **null** (the list ends — not circular) or we arrive **back at the head** (circular).`, { lists: [view(curr, 1)] });
    while (curr !== NULL_ID && curr !== 0) {
      const next = curr + 1 < n ? curr + 1 : circular ? 0 : NULL_ID;
      r.step(
        lineOf(code, "while (curr !== null && curr !== head)"),
        `${values[curr]} is neither null nor the head: move on to ${next === NULL_ID ? "**null**" : next === 0 ? `**the head** (${values[0]})` : values[next]}.`,
        { lists: [view(next, curr + 1)] }
      );
      curr = next;
    }
    r.step(
      lineOf(code, "return curr === head;"),
      curr === 0
        ? `**true** — curr is back at the head: following next from the head returns to it, so the list is circular. ${n} step${n === 1 ? "" : "s"}: O(n) time, O(1) space.`
        : `**false** — curr is null: the list has an end, so it isn't circular. O(n) time, O(1) space.`,
      { lists: [view(curr, n)], done: true }
    );
    return r.frames;
  },
};

export default program;
