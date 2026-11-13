import { lineOf } from "../graphs";
import { checkBst } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function getMinimumDifference(root) {
  let prev = null;
  let best = Infinity;
  const inorder = (node) => {
    if (node === null) return;
    inorder(node.left);
    if (prev !== null) best = Math.min(best, node.val - prev);   // sorted, so the gap is never negative
    prev = node.val;
    inorder(node.right);
  };
  inorder(root);
  return best;
}`;

const program: Program = {
  title: "Minimum difference in a BST (in-order neighbours)",
  code,
  fields: [{ key: "root", label: "BST (level order, 2+ nodes)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Example", input: { root: [4, 2, 6, 1, 3] } },
    { label: "Far-apart pair", input: { root: [1, 0, 48, null, null, 12, 49] } },
    { label: "Bigger tree", input: { root: [27, 12, 40, 5, 20, 33, 52, null, null, 18, 24] } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    const bad = checkBst(values);
    if (bad) return bad;
    return values.filter((v) => v !== null).length < 2 ? "Enter at least two nodes." : null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const order: number[] = [];
    const tones: Record<number, CellTone> = {};
    let prev: number | null = null;
    let prevId: number | null = null;
    let best = Infinity;
    let bestPair = "";
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("BST", tree, { tones: { ...tones, ...extra }, pointers: tagsAt({ node: at, prev: prevId }, { prev: "secondary" }) })],
      arrays: [{ name: "in-order so far", values: order.map((id) => node(id).value), tones: order.length ? { [order.length - 1]: "write" as CellTone } : {} }],
      vars: { prev: prev ?? "null", best: best === Infinity ? "Infinity" : best },
    });

    r.step(lineOf(code, "inorder(root);"), "Walk the tree in-order: the values come out sorted, so the closest pair must be two values that come one after the other.", view(tree.root));
    const inorder = (id: number | null) => {
      if (id === null) return;
      const n = node(id);
      inorder(n.left);
      const v = n.value as number;
      order.push(id);
      if (prev === null) {
        r.step(lineOf(code, "prev = node.val;"), `${v} is the smallest value — nothing before it to compare with. Remember it as prev.`, view(id, { [id]: "write" }));
      } else {
        const gap = v - prev;
        const better = gap < best;
        if (better) {
          best = gap;
          bestPair = `${prev} and ${v}`;
        }
        r.step(lineOf(code, "if (prev !== null) best = Math.min(best, node.val - prev);"), `${v} − ${prev} = ${gap}${better ? `: the **smallest gap so far**` : `, not smaller than ${best}`}.`, view(id, { [id]: better ? "success" : "write" }));
      }
      tones[id] = "done";
      prev = v;
      prevId = id;
      inorder(n.right);
    };
    inorder(tree.root);
    prevId = null;
    r.step(lineOf(code, "return best;"), `The minimum difference is **${best}** (${bestPair}). Only n − 1 neighbouring gaps were checked instead of every pair: O(n) time, O(h) stack.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
