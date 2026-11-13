import { lineOf } from "../graphs";
import { checkBst, subtreeTones } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (node !== null) {
    if (p.val < node.val && q.val < node.val) node = node.left;        // both on the left
    else if (p.val > node.val && q.val > node.val) node = node.right;  // both on the right
    else return node;                                                   // they split here
  }
  return null;
}`;

const program: Program = {
  title: "Lowest common ancestor in a BST",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "p", label: "p (a value in the tree)", kind: "number" },
    { key: "q", label: "q (a value in the tree)", kind: "number" },
  ],
  examples: [
    { label: "p = 3, q = 5", input: { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 3, q: 5 } },
    { label: "p = 2, q = 8", input: { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 } },
    { label: "Ancestor of itself", input: { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 5 } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    const bad = checkBst(values);
    if (bad) return bad;
    for (const k of ["p", "q"]) if (!values.includes(input[k] as number)) return `${k} = ${input[k]} isn't in the tree.`;
    return null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const p = input.p as number;
    const q = input.q as number;
    const r = recorder();
    const ids = Object.fromEntries(tree.nodes.map((n) => [n.value as number, n.id]));
    const marks: Record<number, CellTone> = { [ids[p]]: "primary", [ids[q]]: "primary" };
    const skipped: Record<number, CellTone> = {};
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("BST", tree, { tones: { ...skipped, ...marks, ...extra }, pointers: tagsAt({ node: at, p: ids[p], q: ids[q] }) })],
      vars: { "p.val": p, "q.val": q },
    });

    r.step(lineOf(code, "let node = root;"), `Find the deepest node with both ${p} and ${q} below it. Start at the root and let the values steer.`, view(tree.root));
    let at: number | null = tree.root;
    while (at !== null) {
      const n = node(at);
      const v = n.value as number;
      if (p < v && q < v) {
        Object.assign(skipped, subtreeTones(tree, n.right, "muted"));
        r.step(lineOf(code, "if (p.val < node.val && q.val < node.val) node = node.left;"), `${p} and ${q} are both smaller than ${v}: both live in the **left** subtree, and so does their ancestor.`, view(at, { [at]: "write" }));
        at = n.left;
      } else if (p > v && q > v) {
        Object.assign(skipped, subtreeTones(tree, n.left, "muted"));
        r.step(lineOf(code, "else if (p.val > node.val && q.val > node.val) node = node.right;"), `${p} and ${q} are both bigger than ${v}: go **right**.`, view(at, { [at]: "write" }));
        at = n.right;
      } else {
        const why = v === p || v === q ? `${v} is one of the two nodes, and the other is below it` : `${Math.min(p, q)} < ${v} < ${Math.max(p, q)}: they are on different sides`;
        r.step(lineOf(code, "else return node;"), `${why}. The lowest common ancestor is **${v}**. One path down: O(h) time, O(1) space.`, { ...view(at, { [at]: "success" }), done: true });
        return r.frames;
      }
    }
    r.step(lineOf(code, "return null;"), "Result: **null**.", { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
