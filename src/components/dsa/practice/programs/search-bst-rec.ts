import { lineOf } from "../graphs";
import { checkBst, plural, subtreeTones } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function searchBST(root, val) {
  if (root === null || root.val === val) return root;      // not there, or found
  return val < root.val ? searchBST(root.left, val) : searchBST(root.right, val);
}`;

const program: Program = {
  title: "Search in a BST (recursion)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "val", label: "val", kind: "number" },
  ],
  examples: [
    { label: "Find 2", input: { root: [4, 2, 7, 1, 3], val: 2 } },
    { label: "Find 13", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], val: 13 } },
    { label: "Missing 5", input: { root: [4, 2, 7, 1, 3], val: 5 } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const val = input.val as number;
    const r = recorder();
    const calls: string[] = [];
    let skipped: Record<number, CellTone> = {};
    const path: Record<number, CellTone> = {};
    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("binary search tree", tree, { tones: { ...skipped, ...path, ...tones }, pointers: at === null ? {} : tagsAt({ root: at }) })],
      stacks: [{ name: "call stack", values: [...calls] }],
      vars: { val },
    });

    let at: number | null = tree.root;
    let result = "null";
    for (;;) {
      calls.push(at === null ? "searchBST(null)" : `searchBST(${node(at).value})`);
      if (at === null) {
        r.step(lineOf(code, "if (root === null || root.val === val) return root;"), `This call got an empty subtree: ${val} isn't in the tree. Return **null**, and every call above passes it straight back up.`, view(null));
        break;
      }
      const v = node(at).value as number;
      if (v === val) {
        result = String(v);
        r.step(lineOf(code, "if (root === null || root.val === val) return root;"), `${v} = ${val}: **found**. Return this node — the subtree rooted at ${v} — up through ${plural(calls.length - 1, "waiting call")}.`, view(at, { ...subtreeTones(tree, at, "success") }));
        break;
      }
      const goLeft = val < v;
      skipped = { ...skipped, ...subtreeTones(tree, goLeft ? node(at).right : node(at).left, "muted") };
      path[at] = "primary";
      r.step(lineOf(code, "return val < root.val ? searchBST(root.left, val)"), `${val} ${goLeft ? "<" : ">"} ${v}: call searchBST on the **${goLeft ? "left" : "right"}** child. The ${goLeft ? "right" : "left"} side can't hold ${val}, so it's never visited.`, view(at, { [at]: "write" }));
      at = goLeft ? node(at).left : node(at).right;
    }
    r.step(lineOf(code, "return val < root.val ? searchBST(root.left, val)"), `Result: **${result}**. ${calls.length} call${calls.length === 1 ? "" : "s"} deep — one per level on a single path: O(h) time and O(h) stack. A loop would do the same walk in O(1) space.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
