import { lineOf } from "../graphs";
import { checkBst } from "../bst";
import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function kthSmallest(root, k) {
  const stack = [];
  let node = root;
  while (true) {
    while (node !== null) {                // go as far left as possible
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();                    // the next smallest value
    k--;
    if (k === 0) return node.val;
    node = node.right;
  }
}`;

const program: Program = {
  title: "Kth smallest in a BST (stop the in-order walk early)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "k", label: "k (1 = smallest)", kind: "number" },
  ],
  examples: [
    { label: "k = 3", input: { root: [5, 3, 6, 2, 4, null, null, 1], k: 3 } },
    { label: "k = 1", input: { root: [3, 1, 4, null, 2], k: 1 } },
    { label: "k = 5", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], k: 5 } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    const bad = checkBst(values);
    if (bad) return bad;
    const n = values.filter((v) => v !== null).length;
    const k = input.k as number;
    return k >= 1 && k <= n ? null : `k must be between 1 and ${n}.`;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    let k = input.k as number;
    const r = recorder();
    const stack: number[] = [];
    const counted: number[] = [];
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("BST", tree, { tones: { ...toneIds(counted, "done"), ...toneIds(stack, "primary"), ...extra }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      stacks: [{ name: "stack", values: stack.map((id) => node(id).value) }],
      vars: { k, counted: counted.length },
    });

    r.step(lineOf(code, "let node = root;"), `Walk in-order, counting values as they pop out (smallest first). The ${k}-th one popped is the answer — no need to finish the walk.`, view(tree.root));
    let at: number | null = tree.root;
    for (;;) {
      const pushed: number[] = [];
      while (at !== null) {
        stack.push(at);
        pushed.push(at);
        at = node(at).left;
      }
      if (pushed.length) r.step(lineOf(code, "stack.push(node);"), `Go left as far as possible, pushing ${pushed.map((id) => node(id).value).join(", ")}.`, view(pushed[pushed.length - 1]));
      const id = stack.pop()!;
      counted.push(id);
      k--;
      if (k === 0) {
        r.step(lineOf(code, "if (k === 0) return node.val;"), `Pop ${node(id).value} — value number ${counted.length}. That's the one: the answer is **${node(id).value}**. Only ${counted.length} of ${tree.nodes.length} values were counted: O(h + k).`, { ...view(id, { [id]: "success" }), done: true });
        return r.frames;
      }
      r.step(lineOf(code, "k--;"), `Pop ${node(id).value}: the ${counted.length === 1 ? "1st" : counted.length === 2 ? "2nd" : counted.length === 3 ? "3rd" : `${counted.length}th`} smallest. ${k} more to go.`, view(id, { [id]: "write" }));
      at = node(id).right;
    }
  },
};

export default program;
