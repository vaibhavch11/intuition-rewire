import { lineOf } from "../graphs";
import { chain, tagsAt } from "../structures";
import { recorder, toneRange, type CellTone, type ListView, type Program } from "../types";

const code = `function sortList(head) {
  if (head === null || head.next === null) return head;   // 0 or 1 nodes: sorted
  let slow = head, fast = head.next;                      // find the middle
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  const right = slow.next;
  slow.next = null;                                       // cut the list in two
  return mergeLists(sortList(head), sortList(right));
}

function mergeLists(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a !== null && b !== null) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a !== null ? a : b;                         // attach whatever is left
  return dummy.next;
}`;

const program: Program = {
  title: "Sort a linked list (merge sort)",
  code,
  fields: [{ key: "head", label: "list values", kind: "array", maxLength: 6, min: -99, max: 99 }],
  examples: [
    { label: "Example", input: { head: [4, 2, 1, 3] } },
    { label: "Odd length", input: { head: [-1, 5, 3, 4, 0] } },
  ],
  run(input) {
    const values = input.head as number[];
    const r = recorder();

    // Each list is drawn as its own chain of values.
    const row = (name: string, vals: number[], tones: Record<number, CellTone> = {}, marks: Record<string, number> = {}): ListView =>
      chain(name, vals, { tones, pointers: tagsAt(marks) });

    const sort = (vals: number[], depth: number): number[] => {
      if (vals.length <= 1) return vals;
      // slow stops on the last node of the left half.
      const mid = Math.floor((vals.length - 1) / 2);
      const left = vals.slice(0, mid + 1);
      const right = vals.slice(mid + 1);
      r.step(lineOf(code, "slow.next = null;"), `slow and fast find the middle of [${vals.join(" → ")}]: **cut** after ${vals[mid]}, leaving [${left.join(" → ")}] and [${right.join(" → ")}]. Sort each half the same way.`, {
        lists: [row("list", vals, { ...toneRange(0, mid, "primary"), ...toneRange(mid + 1, vals.length - 1, "tertiary") }, { slow: mid })],
        vars: { depth },
      });
      const a = sort(left, depth + 1);
      const b = sort(right, depth + 1);
      const merged: number[] = [];
      let i = 0;
      let j = 0;
      const show = (note: string, line: string) =>
        r.step(lineOf(code, line), note, {
          lists: [
            row("a", a, toneRange(0, i - 1, "muted"), i < a.length ? { a: i } : {}),
            row("b", b, toneRange(0, j - 1, "muted"), j < b.length ? { b: j } : {}),
            row("merged", merged, merged.length ? { [merged.length - 1]: "write" } : {}),
          ],
          vars: { depth },
        });
      show(`Merge the sorted halves [${a.join(" → ")}] and [${b.join(" → ")}]: keep taking the smaller front node and linking it after \`tail\`. No new nodes are made — only next pointers change.`, "function mergeLists(a, b)");
      while (i < a.length && j < b.length) {
        if (a[i] <= b[j]) {
          merged.push(a[i++]);
          show(`${a[i - 1]} ≤ ${b[j]}: link ${a[i - 1]} from list a.`, "if (a.val <= b.val)");
        } else {
          merged.push(b[j++]);
          show(`${b[j - 1]} < ${a[i]}: link ${b[j - 1]} from list b.`, "else { tail.next = b; b = b.next; }");
        }
      }
      const rest = i < a.length ? a.slice(i) : b.slice(j);
      if (rest.length) {
        merged.push(...rest);
        i = a.length;
        j = b.length;
        show(`One list is used up: attach the rest (${rest.join(" → ")}) in one pointer change.`, "tail.next = a !== null ? a : b;");
      }
      return merged;
    };

    r.step(lineOf(code, "function sortList(head)"), `Merge sort suits linked lists perfectly: finding the middle takes a slow and a fast pointer, cutting is one \`next = null\`, and merging only relinks nodes — **no extra array**. Start with [${values.join(" → ")}].`, { lists: [row("list", values)] });
    const sorted = sort(values, 0);
    r.step(lineOf(code, "return mergeLists(sortList(head), sortList(right));"), `Sorted: **[${sorted.join(", ")}]**. log n levels of splitting, each merging n nodes: **O(n log n)** time, and **O(log n)** space for the recursion.`, {
      lists: [row("sorted", sorted, toneRange(0, sorted.length - 1, "success"))],
      done: true,
    });
    return r.frames;
  },
};

export default program;
