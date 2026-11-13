import { lineOf } from "../graphs";
import { checkBst } from "../bst";
import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `class BSTIterator {
  constructor(root) {
    this.stack = [];
    this.pushLeft(root);
  }

  pushLeft(node) {                         // the node and its whole left spine
    while (node !== null) {
      this.stack.push(node);
      node = node.left;
    }
  }

  next() {
    const node = this.stack.pop();         // the smallest value not yet returned
    this.pushLeft(node.right);             // its right subtree comes next
    return node.val;
  }

  hasNext() {
    return this.stack.length > 0;
  }
}`;

const program: Program = {
  title: "BST iterator (a stack of the left spine)",
  code,
  fields: [{ key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Example", input: { root: [7, 3, 15, null, null, 9, 20] } },
    { label: "Bigger tree", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] } },
    { label: "Left chain", input: { root: [5, 4, null, 3, null, 2] } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const stack: number[] = [];
    const returned: number[] = [];
    let maxStack = 0;
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("BST", tree, { tones: { ...toneIds(returned, "done"), ...toneIds(stack, "primary"), ...extra }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      stacks: [{ name: "stack", values: stack.map((id) => node(id).value) }],
      arrays: [{ name: "next() returned", values: returned.map((id) => node(id).value), tones: returned.length ? { [returned.length - 1]: "write" as CellTone } : {} }],
    });
    const pushLeft = (start: number | null) => {
      const pushed: number[] = [];
      for (let at = start; at !== null; at = node(at).left) {
        stack.push(at);
        pushed.push(at);
      }
      maxStack = Math.max(maxStack, stack.length);
      return pushed;
    };

    const first = pushLeft(tree.root);
    r.step(lineOf(code, "this.pushLeft(root);"), `The constructor pushes the root's left spine: ${first.map((id) => node(id).value).join(", ")}. The top, ${node(first[first.length - 1]).value}, is the smallest value in the tree.`, view(first[first.length - 1]));
    while (stack.length > 0) {
      r.step(lineOf(code, "return this.stack.length > 0;"), `hasNext(): the stack holds ${stack.length} node${stack.length === 1 ? "" : "s"}, so yes. Call next().`, view(stack[stack.length - 1]));
      const id = stack.pop()!;
      returned.push(id);
      const right = node(id).right;
      const pushed = pushLeft(right);
      r.step(lineOf(code, "this.pushLeft(node.right);"), `next() pops **${node(id).value}**${pushed.length ? ` and pushes the left spine of its right child: ${pushed.map((x) => node(x).value).join(", ")}` : " (no right child, nothing to push)"}. It returns ${node(id).value}.`, view(id, { [id]: "write" }));
    }
    r.step(lineOf(code, "return this.stack.length > 0;"), `hasNext() is false: the iterator returned **${returned.map((id) => node(id).value).join(", ")}** in sorted order. The stack never held more than ${maxStack} node${maxStack === 1 ? "" : "s"} (the height bounds it), and each node was pushed and popped once.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
