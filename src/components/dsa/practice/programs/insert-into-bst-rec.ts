import { lineOf } from "../graphs";
import { addNode, checkBst } from "../bst";
import { buildTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function insertIntoBST(root, val) {
  if (root === null) return new TreeNode(val);             // the empty spot: the new leaf
  if (val < root.val) root.left = insertIntoBST(root.left, val);
  else root.right = insertIntoBST(root.right, val);
  return root;                                             // this subtree's root is unchanged
}`;

const program: Program = {
  title: "Insert into a BST (recursion re-attaches each child)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "val", label: "val (not in the tree)", kind: "number" },
  ],
  examples: [
    { label: "Insert 5", input: { root: [4, 2, 7, 1, 3], val: 5 } },
    { label: "Insert 25", input: { root: [40, 20, 60, 10, 30, 50, 70], val: 25 } },
    { label: "Empty tree", input: { root: [], val: 5 } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    const bad = checkBst(values, true);
    if (bad) return bad;
    return values.includes(input.val as number) ? `${input.val} is already in the tree — pick a value that isn't.` : null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const node = (id: number) => tree.nodes[id];
    const val = input.val as number;
    const r = recorder();
    const calls: string[] = [];
    const path: Record<number, CellTone> = {};
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("binary search tree", tree, { tones: { ...path, ...extra }, pointers: at === null ? {} : tagsAt({ root: at }) })],
      stacks: [{ name: "call stack", values: [...calls] }],
      vars: { val },
    });

    let fresh = -1;
    const insert = (id: number | null): number => {
      calls.push(id === null ? "insert(null)" : `insert(${node(id).value})`);
      if (id === null) {
        fresh = addNode(tree, val);
        r.step(lineOf(code, "if (root === null) return new TreeNode(val);"), `An empty subtree: this is where ${val} belongs. Create the node **${val}** and return it to the caller.`, view(null, { [fresh]: "success" }));
        calls.pop();
        return fresh;
      }
      const n = node(id);
      const goLeft = val < (n.value as number);
      path[id] = "primary";
      r.step(lineOf(code, goLeft ? "if (val < root.val) root.left" : "else root.right = insertIntoBST"), `${val} ${goLeft ? "<" : ">"} ${n.value}: insert into the **${goLeft ? "left" : "right"}** subtree, and set ${n.value}.${goLeft ? "left" : "right"} to whatever comes back.`, view(id, { [id]: "write" }));
      const child = insert(goLeft ? n.left : n.right);
      if (goLeft) n.left = child;
      else n.right = child;
      r.step(lineOf(code, "return root;"), `Back at ${n.value}: its ${goLeft ? "left" : "right"} child is ${node(child).value}${child === fresh ? " — the new leaf, now attached" : " (unchanged)"}. Return ${n.value} itself.`, view(id, { [id]: "write", [fresh]: "success" }));
      calls.pop();
      return id;
    };
    tree.root = insert(tree.root);
    r.step(lineOf(code, "return root;"), `**${val}** is in the tree as a new leaf, and the original root comes back from the first call. O(h) time, O(h) stack.`, { ...view(null, { [fresh]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
