import { lineOf } from "../graphs";
import { checkBst } from "../bst";
import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function inorder(root) {
  const out = [];
  const stack = [];
  let node = root;
  while (node !== null || stack.length > 0) {
    while (node !== null) {       // go left as far as possible,
      stack.push(node);           // remembering each node on the way
      node = node.left;
    }
    node = stack.pop();           // the smallest value not visited yet
    out.push(node.val);
    node = node.right;            // then everything just bigger than it
  }
  return out;
}`;

const program: Program = {
  title: "In-order with a stack: the values come out sorted",
  code,
  fields: [{ key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Example", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] } },
    { label: "Balanced", input: { root: [4, 2, 6, 1, 3, 5, 7] } },
    { label: "Left chain", input: { root: [5, 4, null, 3, null, 2] } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const stack: number[] = [];
    const out: number[] = [];
    const visited: number[] = [];
    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("binary search tree", tree, { tones: { ...toneIds(visited, "done"), ...toneIds(stack, "primary"), ...tones }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      stacks: [{ name: "stack (waiting nodes)", values: stack.map((id) => node(id).value) }],
      arrays: [{ name: "out (in-order)", values: [...out], tones: out.length ? { [out.length - 1]: "write" as CellTone } : {} }],
    });

    r.step(lineOf(code, "let node = root;"), `Walk the BST in-order — left subtree, node, right subtree — using an explicit **stack** instead of recursion. Watch the output: it comes out **sorted**.`, view(tree.root));
    let at: number | null = tree.root;
    while (at !== null || stack.length > 0) {
      const pushed: number[] = [];
      while (at !== null) {
        stack.push(at);
        pushed.push(at);
        at = node(at).left;
      }
      if (pushed.length) {
        r.step(lineOf(code, "stack.push(node);"), `Go left as far as possible, pushing ${pushed.map((id) => node(id).value).join(", ")}. Nothing smaller is left below ${node(pushed[pushed.length - 1]).value}.`, view(pushed[pushed.length - 1]));
      }
      const id = stack.pop()!;
      out.push(node(id).value as number);
      visited.push(id);
      r.step(lineOf(code, "out.push(node.val);"), `Pop **${node(id).value}**: the smallest value not visited yet. Output so far: ${out.join(", ")}.`, view(id, { [id]: "write" }));
      at = node(id).right;
      if (at !== null) {
        r.step(lineOf(code, "node = node.right;"), `${node(id).value} has a right subtree (${node(at).value}…): everything just bigger than ${node(id).value} is there, so go on from ${node(at).value}.`, view(at, { [at]: "tertiary" }));
      }
    }
    r.step(lineOf(code, "return out;"), `Done: **${out.join(", ")}** — sorted, because a BST keeps smaller values on the left. O(n) time; the stack never held more than one node per level, O(h).`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
