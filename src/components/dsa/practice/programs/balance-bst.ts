import { lineOf } from "../graphs";
import { addNode, checkBst, inorderIds } from "../bst";
import { buildTree, tagsAt, toneIds, treeView, type Tree } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function balanceBST(root) {
  const values = [];
  const inorder = (node) => {
    if (node === null) return;
    inorder(node.left);
    values.push(node.val);
    inorder(node.right);
  };
  inorder(root);
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const mid = Math.floor((lo + hi) / 2);
    return new TreeNode(values[mid], build(lo, mid - 1), build(mid + 1, hi));
  };
  return build(0, values.length - 1);
}`;

const heightOf = (tree: Tree, id: number | null): number => (id === null ? 0 : 1 + Math.max(heightOf(tree, tree.nodes[id].left), heightOf(tree, tree.nodes[id].right)));

const program: Program = {
  title: "Balance a BST (in-order, then build from the middle)",
  code,
  fields: [{ key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Right chain", input: { root: [1, null, 2, null, 3, null, 4] } },
    { label: "Lopsided", input: { root: [10, 8, null, 6, 9, 3, 7, 1] } },
    { label: "Zig-zag", input: { root: [1, null, 7, 2, null, null, 6, 3, null, null, 5] } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const old = buildTree(input.root as (number | null)[]);
    const fresh: Tree = { nodes: [], root: null };
    const r = recorder();
    const order = inorderIds(old);
    const values = order.map((id) => old.nodes[id].value as number);
    const read: number[] = [];
    const used: Record<number, CellTone> = {};
    const view = (at: number | null, lo?: number, hi?: number, mid?: number) => {
      const tones: Record<number, CellTone> = { ...used };
      if (lo !== undefined && hi !== undefined) for (let k = lo; k <= hi; k++) if (tones[k] === undefined) tones[k] = "primary";
      if (mid !== undefined) tones[mid] = "write";
      return {
        trees: [
          treeView("balanced BST", fresh, { tones: at === null ? {} : { [at]: "write" } }),
          treeView(`old tree (height ${heightOf(old, old.root)})`, old, { tones: toneIds(read, "done") }),
        ],
        arrays: [{ name: "values (in-order)", values: read.length ? values : [], tones, pointers: lo !== undefined && hi !== undefined && lo <= hi ? tagsAt({ lo, hi, ...(mid === undefined ? {} : { mid }) }, { mid: "tertiary" }) : {} }],
      };
    };

    r.step(lineOf(code, "inorder(root);"), `The old tree has height ${heightOf(old, old.root)}. Step 1: walk it in-order to list its values — sorted, because it's a BST.`, view(null));
    for (const id of order) read.push(id);
    r.step(lineOf(code, "values.push(node.val);"), `In-order gives ${values.join(", ")}. Step 2: build a new tree from the middle out, exactly like Convert Sorted Array to BST.`, view(null, 0, values.length - 1));
    const build = (lo: number, hi: number): number | null => {
      if (lo > hi) return null;
      const mid = Math.floor((lo + hi) / 2);
      const id = addNode(fresh, values[mid]);
      if (fresh.root === null) fresh.root = id;
      used[mid] = "done";
      r.step(lineOf(code, "const mid = Math.floor((lo + hi) / 2);"), `Values [${lo}..${hi}]: the middle one, **${values[mid]}**, becomes the root of this part.`, view(id, lo, hi, mid));
      fresh.nodes[id].left = build(lo, mid - 1);
      fresh.nodes[id].right = build(mid + 1, hi);
      return id;
    };
    build(0, values.length - 1);
    r.step(lineOf(code, "return build(0, values.length - 1);"), `The new tree has root **${fresh.nodes[fresh.root!].value}** and height ${heightOf(fresh, fresh.root)} (it was ${heightOf(old, old.root)}), with the same ${values.length} values. O(n) time, O(n) space for the list.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
