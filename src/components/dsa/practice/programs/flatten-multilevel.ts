import { lineOf } from "../graphs";
import { tagsAt } from "../structures";
import { recorder, type ListLink, type ListNodeView, type ListView, type Program } from "../types";

const code = `function flatten(head) {
  let curr = head;
  while (curr !== null) {
    if (curr.child !== null) {
      let tail = curr.child;
      while (tail.next !== null) tail = tail.next;   // the end of the child level
      tail.next = curr.next;                         // child level's tail -> curr's old next
      if (curr.next !== null) curr.next.prev = tail;
      curr.next = curr.child;                        // curr -> the child level
      curr.child.prev = curr;
      curr.child = null;
    }
    curr = curr.next;                                // the spliced level is walked next
  }
  return head;
}`;

interface MNode {
  value: number;
  prev: number | null;
  next: number | null;
  child: number | null;
}

/** "1 2 3(7 8(11 12) 9) 4" — a number in brackets after a value is that node's child level. */
function parse(text: string): MNode[] | string {
  const tokens = text.match(/-?\d+|[()]/g) ?? [];
  if (text.replace(/-?\d+|[()\s,]/g, "") !== "") return "Use numbers, spaces and brackets, like 1 2 3(7 8) 4.";
  const nodes: MNode[] = [];
  let k = 0;
  const level = (): number | string | null => {
    let head: number | null = null;
    let tail: number | null = null;
    while (k < tokens.length && tokens[k] !== ")") {
      const t = tokens[k++];
      if (t === "(") return "A bracket must follow a value: 3(7 8) gives 3 the child level 7 8.";
      const id = nodes.length;
      nodes.push({ value: Number(t), prev: tail, next: null, child: null });
      if (tail !== null) nodes[tail].next = id;
      else head = id;
      tail = id;
      if (tokens[k] === "(") {
        k++;
        const child = level();
        if (typeof child === "string") return child;
        if (child === null) return "A child level needs at least one value.";
        if (tokens[k] !== ")") return "Every ( needs a matching ).";
        k++;
        nodes[id].child = child;
      }
    }
    return head;
  };
  const head = level();
  if (typeof head === "string") return head;
  if (k < tokens.length) return "There's a ) without a matching (.";
  if (head === null) return "Enter at least one value.";
  if (nodes.length > 8) return "Use at most 8 values so the levels stay readable.";
  return nodes;
}

const program: Program = {
  title: "Flatten a multilevel doubly linked list (splice in place)",
  code,
  fields: [{ key: "list", label: "multilevel list", kind: "text", maxLength: 60, hint: "1 2(5 6) 3 — brackets hold a node's child level" }],
  examples: [
    { label: "Example", input: { list: "1 2 3(7 8(11 12)) 4" } },
    { label: "Two children", input: { list: "1(4 5) 2(6) 3" } },
    { label: "No children", input: { list: "1 2 3" } },
  ],
  check(input) {
    const nodes = parse(input.list as string);
    return typeof nodes === "string" ? nodes : null;
  },
  run(input) {
    const nodes = parse(input.list as string) as MNode[];
    const r = recorder();
    const head = 0;

    // Lay out each level on its own row: a level starts under its parent and
    // drops to a lower row if that space is taken.
    const view = (marks: Record<string, number | null>, hot: string[] = [], done = false): ListView => {
      const place = new Map<number, { col: number; row: number }>();
      const used = new Set<string>();
      const lay = (start: number, col: number, minRow: number) => {
        const level: number[] = [];
        for (let x: number | null = start; x !== null && !place.has(x) && !level.includes(x); x = nodes[x].next) level.push(x);
        let row = minRow;
        while (level.some((_, i) => used.has(`${row},${col + i}`))) row++;
        level.forEach((id, i) => {
          place.set(id, { col: col + i, row });
          used.add(`${row},${col + i}`);
        });
        level.forEach((id, i) => {
          const c = nodes[id].child;
          if (c !== null && !place.has(c)) lay(c, col + i, row + 1);
        });
      };
      lay(head, 0, 0);
      const shown: ListNodeView[] = [];
      for (const [id, at] of place) shown.push({ id, value: nodes[id].value, col: at.col, row: at.row, tone: done ? "success" : id === marks.curr ? "primary" : id === marks.tail ? "tertiary" : undefined });
      const links: ListLink[] = [];
      for (const id of place.keys()) {
        const node = nodes[id];
        if (node.next !== null) links.push({ from: id, to: node.next, tone: hot.includes(`${id}.next`) ? "active" : undefined });
        if (node.prev !== null) links.push({ from: id, to: node.prev, tone: hot.includes(`${id}.prev`) ? "active" : undefined, kind: "prev" });
        if (node.child !== null) links.push({ from: id, to: node.child, tone: hot.includes(`${id}.child`) ? "active" : undefined, kind: "child" });
      }
      return { name: "list", nodes: shown, links, pointers: tagsAt({ head, ...marks }, { head: "secondary", tail: "tertiary" }), doubly: true };
    };

    r.step(lineOf(code, "let curr = head;"), `Some nodes have a **child** pointer (the downward arrows) to a whole lower level. Flattening means splicing each child level into the main list **right after its parent**, in depth-first order. Walk the top level with curr.`, { lists: [view({ curr: head })] });
    for (let curr: number | null = head; curr !== null; ) {
      const node: MNode = nodes[curr];
      if (node.child !== null) {
        const child = node.child;
        let tail = child;
        r.step(lineOf(code, "let tail = curr.child;"), `${node.value} has a child level starting at ${nodes[child].value}. First find that level's **tail**.`, { lists: [view({ curr, tail })] });
        while (nodes[tail].next !== null) {
          tail = nodes[tail].next!;
          r.step(lineOf(code, "while (tail.next !== null) tail = tail.next"), `Move tail to ${nodes[tail].value}.`, { lists: [view({ curr, tail })] });
        }
        const after = node.next;
        nodes[tail].next = after;
        if (after !== null) nodes[after].prev = tail;
        r.step(
          lineOf(code, "tail.next = curr.next;"),
          after === null
            ? `${node.value} was the last node of its level, so the child level's tail ${nodes[tail].value} keeps next = null.`
            : `Connect the end of the child level to what came after ${node.value}: ${nodes[tail].value} ⇄ ${nodes[after].value}.`,
          { lists: [view({ curr, tail }, after === null ? [] : [`${tail}.next`, `${after}.prev`])] }
        );
        node.next = child;
        nodes[child].prev = curr;
        node.child = null;
        r.step(lineOf(code, "curr.next = curr.child;"), `Now ${node.value}'s **next** is the child level, which points back with **prev**, and the child pointer is cleared. That level is part of the main list.`, { lists: [view({ curr }, [`${curr}.next`, `${child}.prev`])] });
      }
      const nxt: number | null = node.next;
      r.step(
        lineOf(code, "curr = curr.next;"),
        nxt === null ? `${node.value} is the last node: done.` : `Move on to ${nodes[nxt].value} — if it has a child of its own, it's spliced in the same way.`,
        { lists: [view({ curr: nxt })] }
      );
      curr = nxt;
    }
    const order: number[] = [];
    for (let x: number | null = head; x !== null; x = nodes[x].next) order.push(nodes[x].value);
    r.step(lineOf(code, "return head;"), `One flat doubly linked list: **${order.join(" ⇄ ")}**. Each node is passed once by curr and once by a tail search: **O(n) time, O(1) space**.`, { lists: [view({}, [], true)], done: true });
    return r.frames;
  },
};

export default program;
