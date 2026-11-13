import { lineOf } from "../graphs";
import { addNode, checkBst } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function insert(root, val) {
  const fresh = new TreeNode(val);
  if (root === null) return fresh;                 // an empty tree: the new node is the root
  let node = root;
  while (true) {
    if (val < node.val) {
      if (node.left === null) { node.left = fresh; break; }    // empty spot on the left
      node = node.left;
    } else {
      if (node.right === null) { node.right = fresh; break; }  // empty spot on the right
      node = node.right;
    }
  }
  return root;
}`;

const program: Program = {
  title: "Inserting into a BST (with a loop)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "val", label: "value to insert", kind: "number" },
  ],
  examples: [
    { label: "Insert 5", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], val: 5 } },
    { label: "Insert 15", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], val: 15 } },
    { label: "Into a chain", input: { root: [1, null, 2, null, 3], val: 4 } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    const bad = checkBst(values, true);
    if (bad) return bad;
    return values.includes(input.val as number) ? `${input.val} is already in the tree — pick a value that isn't.` : null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const val = input.val as number;
    const r = recorder();
    const view = (tones: Record<number, CellTone> = {}, at: number | null = null) => ({
      trees: [treeView("binary search tree", tree, { tones, pointers: at === null ? {} : tagsAt({ node: at }) })],
      vars: { val },
    });

    r.step(lineOf(code, "const fresh = new TreeNode(val);"), `Insert **${val}**. It will become a leaf: walk down the way a search for ${val} would, and hang it on the first empty side.`, view());
    if (tree.root === null) {
      tree.root = addNode(tree, val);
      r.step(lineOf(code, "if (root === null) return fresh;"), `The tree is empty, so ${val} becomes the root: **${val}**.`, { ...view({ [tree.root]: "success" }), done: true });
      return r.frames;
    }
    const path: Record<number, CellTone> = {};
    let at = tree.root;
    for (;;) {
      const n = node(at);
      const goLeft = val < (n.value as number);
      const next = goLeft ? n.left : n.right;
      path[at] = "primary";
      if (next === null) {
        const id = addNode(tree, val);
        if (goLeft) n.left = id;
        else n.right = id;
        r.step(lineOf(code, goLeft ? "if (node.left === null) { node.left = fresh; break; }" : "if (node.right === null) { node.right = fresh; break; }"), `${val} ${goLeft ? "<" : ">"} ${n.value} and ${n.value} has no ${goLeft ? "left" : "right"} child: **${val}** goes there, as a new leaf.`, view({ ...path, [id]: "success" }, id));
        break;
      }
      r.step(lineOf(code, goLeft ? "node = node.left;" : "node = node.right;"), `${val} ${goLeft ? "<" : ">"} ${n.value}: move **${goLeft ? "left" : "right"}** to ${node(next).value}.`, view({ ...path, [at]: "write" }, at));
      at = next;
    }
    const steps = Object.keys(path).length;
    r.step(lineOf(code, "return root;"), `**${val}** is in place after ${steps} comparison${steps === 1 ? "" : "s"} — one per level, O(h). The tree is still a BST, and no other node moved.`, { ...view({ ...path, [tree.nodes.length - 1]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
