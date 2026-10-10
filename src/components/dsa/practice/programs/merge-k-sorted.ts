import { SimHeap, heapTree, lineOf } from "../heap";
import { chain } from "../structures";
import { recorder, type CellTone, type Input, type Program } from "../types";

const code = `function mergeKLists(lists) {
  const heap = new Heap((a, b) => a.val - b.val);   // the current head of each list
  for (const head of lists) if (head) heap.push(head);
  const dummy = new ListNode(0);
  let tail = dummy;
  while (heap.size() > 0) {
    const node = heap.pop();                // the smallest head of all
    tail.next = node;
    tail = node;
    if (node.next) heap.push(node.next);    // its list moves forward
  }
  return dummy.next;
}`;

const L = {
  heap: lineOf(code, "const heap = new Heap("),
  heads: lineOf(code, "for (const head of lists) if (head) heap.push(head);"),
  dummy: lineOf(code, "const dummy = new ListNode(0);"),
  pop: lineOf(code, "const node = heap.pop();"),
  link: lineOf(code, "tail = node;"),
  next: lineOf(code, "if (node.next) heap.push(node.next);"),
  ret: lineOf(code, "return dummy.next;"),
};

/** A node of one input list: its value, which list, and its position in that list. */
type Node = { val: number; list: number; pos: number };

/** "1 4 5; 1 3 4; 2 6" -> [[1,4,5],[1,3,4],[2,6]], or a reason it can't be read. */
function parseLists(text: string): number[][] | string {
  const parts = text.split(/[;|\n]/).map((s) => s.trim());
  if (parts.length > 4) return "Use at most 4 lists, separated by semicolons.";
  const lists: number[][] = [];
  for (const [i, part] of parts.entries()) {
    if (part === "" || part === "[]") {
      lists.push([]);
      continue;
    }
    const tokens = part.replace(/[[\]]/g, " ").split(/[\s,]+/).filter(Boolean);
    if (!tokens.every((t) => /^-?\d+$/.test(t))) return `List ${i}: use whole numbers, like 1 4 5.`;
    const values = tokens.map(Number);
    if (values.length > 4) return `List ${i}: use at most 4 values per list.`;
    if (values.some((v) => v < -99 || v > 999)) return `List ${i}: keep values between -99 and 999.`;
    if (values.some((v, j) => j > 0 && values[j - 1] > v)) return `List ${i} isn't sorted: every list must be in ascending order.`;
    lists.push(values);
  }
  return lists;
}

const program: Program = {
  title: "Merge k sorted lists (a min-heap of the heads)",
  code,
  fields: [{ key: "lists", label: "lists (separate them with ;)", kind: "text", maxLength: 80, hint: "1 4 5; 1 3 4; 2 6" }],
  examples: [
    { label: "The lesson's example", input: { lists: "1 4 5; 1 3 4; 2 6" } },
    { label: "An empty list", input: { lists: "2 9; ; 1 3 5" } },
    { label: "Four lists", input: { lists: "5 10; 1 2 20; 3 8; 4" } },
  ],
  check(input: Input) {
    const lists = parseLists(input.lists as string);
    return typeof lists === "string" ? lists : null;
  },
  run(input) {
    const lists = parseLists(input.lists as string) as number[][];
    const heap = new SimHeap((a: Node, b: Node) => a.val - b.val);
    const merged: number[] = [];
    const taken = lists.map(() => 0);
    const r = recorder();

    const views = (opts: { tones?: Record<number, CellTone>; popped?: Node; fresh?: boolean } = {}) => {
      const heads = new Set(heap.items.map((n) => `${n.list},${n.pos}`));
      return {
        trees: [heapTree("min-heap of the heads: value in the node, list under it", heap.items.map((n) => n.val), {
          tones: opts.tones ?? {},
          captions: Object.fromEntries(heap.items.map((n, j) => [j, `list ${n.list}`])),
        })],
        lists: [
          ...lists.map((values, li) =>
            chain(`list ${li}`, values, {
              tones: Object.fromEntries(
                values.map((_, j): [number, CellTone] => [
                  j,
                  opts.popped && opts.popped.list === li && opts.popped.pos === j ? "write" : j < taken[li] ? "muted" : heads.has(`${li},${j}`) ? "primary" : "idle",
                ])
              ),
            })
          ),
          ...(merged.length
            ? [chain("merged so far", merged, { tones: opts.fresh ? { [merged.length - 1]: "success" as CellTone } : {} })]
            : []),
        ],
      };
    };

    r.step(L.heap, `A **min-heap of list nodes**, ordered by value. It will hold the current **head** of each list — the only nodes that can be the next smallest.`, {
      ...views(),
      vars: { k: lists.length, size: 0 },
    });
    lists.forEach((values, li) => {
      if (values.length === 0) {
        r.step(L.heads, `List ${li} is empty: its head is null, so it's skipped.`, { ...views(), vars: { k: lists.length, size: heap.size() } });
        return;
      }
      const at = heap.push({ val: values[0], list: li, pos: 0 });
      r.step(L.heads, `Push list ${li}'s head, **${values[0]}**.`, {
        ...views({ tones: { [at]: "write" } }),
        vars: { k: lists.length, size: heap.size() },
      });
    });
    r.step(L.dummy, `A dummy node starts the result; \`tail\` is where the next node gets linked.`, { ...views(), vars: { k: lists.length, size: heap.size() } });

    while (heap.size() > 0) {
      const node = heap.pop()!;
      taken[node.list] = node.pos + 1;
      merged.push(node.val);
      r.step(L.pop, `Pop **${node.val}** (list ${node.list}): the smallest head of all.`, {
        ...views({ popped: node, tones: heap.size() ? { 0: "tertiary" } : {} }),
        vars: { node: node.val, size: heap.size() },
      });
      r.step(L.link, `Link it after \`tail\`: the merged list now ends in ${node.val}.`, {
        ...views({ fresh: true }),
        vars: { node: node.val, size: heap.size() },
      });
      const values = lists[node.list];
      if (node.pos + 1 < values.length) {
        const at = heap.push({ val: values[node.pos + 1], list: node.list, pos: node.pos + 1 });
        r.step(L.next, `List ${node.list} moves forward: push its next node, **${values[node.pos + 1]}**${at === 0 ? " — the smallest head now" : ""}.`, {
          ...views({ tones: { [at]: "write" } }),
          vars: { node: node.val, size: heap.size() },
        });
      } else {
        r.step(L.next, `${node.val} was the last node of list ${node.list}: nothing to push.`, {
          ...views(),
          vars: { node: node.val, size: heap.size() },
        });
      }
    }

    r.step(
      L.ret,
      merged.length ? `The heap is empty: every node is linked. Return the merged list: **${merged.join(" → ")}**.` : `Every list was empty: return **null**.`,
      { ...views(), vars: { returned: merged.length ? `[${merged.join(", ")}]` : "null" }, done: true }
    );
    return r.frames;
  },
};

export default program;
