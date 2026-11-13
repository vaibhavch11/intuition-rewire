import { lineOf } from "../graphs";
import { addNode } from "../bst";
import { tagsAt, treeView, type Tree } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function bstFromPreorder(preorder) {
  let i = 0;
  const build = (bound) => {               // the next subtree: values below bound
    if (i === preorder.length || preorder[i] > bound) return null;
    const node = new TreeNode(preorder[i++]);
    node.left = build(node.val);           // smaller than this node
    node.right = build(bound);             // bigger than it, but still below bound
    return node;
  };
  return build(Infinity);
}`;

const show = (b: number) => (b === Infinity ? "inf" : String(b));

/** True when `pre` is the pre-order walk of some BST with distinct values. */
function isBstPreorder(pre: number[]): boolean {
  const stack: number[] = [];
  let low = -Infinity;
  for (const v of pre) {
    if (v <= low) return false;
    while (stack.length && stack[stack.length - 1] < v) low = stack.pop()!;
    stack.push(v);
  }
  return new Set(pre).size === pre.length;
}

const program: Program = {
  title: "BST from pre-order (one pass with an upper bound)",
  code,
  fields: [{ key: "preorder", label: "preorder", kind: "array", maxLength: 12 }],
  examples: [
    { label: "Example", input: { preorder: [8, 5, 1, 7, 10, 12] } },
    { label: "Deeper", input: { preorder: [10, 5, 2, 1, 7, 6, 15, 12, 20] } },
    { label: "Increasing", input: { preorder: [1, 2, 3, 4] } },
  ],
  check(input) {
    const pre = input.preorder as number[];
    if (pre.length === 0) return "Enter at least one value.";
    return isBstPreorder(pre) ? null : "That isn't the pre-order of a BST with distinct values.";
  },
  run(input) {
    const pre = input.preorder as number[];
    const tree: Tree = { nodes: [], root: null };
    const r = recorder();
    const calls: string[] = [];
    let i = 0;
    const view = (at: number | null, bound: number | null) => ({
      arrays: [{ name: "preorder", values: pre, tones: Object.fromEntries(pre.map((_, k) => [k, k < i ? "done" : "idle"])) as Record<number, CellTone>, pointers: i < pre.length ? tagsAt({ i }) : {} }],
      trees: [treeView("BST being built", tree, { tones: at === null ? {} : { [at]: "write" }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      stacks: [{ name: "call stack", values: [...calls] }],
      vars: bound === null ? {} : { bound: show(bound) },
    });

    r.step(lineOf(code, "return build(Infinity);"), "Read the values left to right. build(bound) builds the next subtree, which may only use values below bound. The first value has no limit: it's the root.", view(null, Infinity));
    const build = (bound: number, parent: number | null): number | null => {
      calls.push(`build(${show(bound)})`);
      if (i === pre.length || pre[i] > bound) {
        r.step(lineOf(code, "if (i === preorder.length || preorder[i] > bound) return null;"), i === pre.length ? `No values left: this subtree is empty.` : `Next value ${pre[i]} > bound ${show(bound)}: it belongs higher up, so this subtree is **empty**.`, view(parent, bound));
        calls.pop();
        return null;
      }
      const id = addNode(tree, pre[i]);
      if (tree.root === null) tree.root = id;
      i++;
      r.step(lineOf(code, "const node = new TreeNode(preorder[i++]);"), `${pre[i - 1]} < ${show(bound)}: take it as the next node. Its left subtree uses values below ${pre[i - 1]}; its right subtree values between ${pre[i - 1]} and ${show(bound)}.`, view(id, bound));
      tree.nodes[id].left = build(tree.nodes[id].value as number, id);
      tree.nodes[id].right = build(bound, id);
      calls.pop();
      return id;
    };
    build(Infinity, null);
    r.step(lineOf(code, "return build(Infinity);"), `All ${pre.length} values used: the tree has root **${pre[0]}**. Each value was read once: O(n) time, O(h) stack.`, { ...view(null, null), done: true });
    return r.frames;
  },
};

export default program;
