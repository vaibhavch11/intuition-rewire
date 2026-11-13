import { lineOf } from "../graphs";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function isValidBST(root) {
  const fits = (node, low, high) => {        // every value here must be strictly between low and high
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;
    return fits(node.left, low, node.val) && fits(node.right, node.val, high);
  };
  return fits(root, -Infinity, Infinity);
}`;

const bound = (v: number) => (v === -Infinity ? "-inf" : v === Infinity ? "inf" : String(v));

const program: Program = {
  title: "Validate a BST (pass down the allowed range)",
  code,
  fields: [{ key: "root", label: "Binary tree (level order)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Valid", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] } },
    { label: "Grandchild trap", input: { root: [5, 1, 6, null, null, 3, 7] } },
    { label: "Duplicate", input: { root: [2, 2, 3] } },
  ],
  check: (input) => {
    const values = input.root as (number | null)[];
    return values.length === 0 || values[0] === null ? "Enter at least the root value." : null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const tones: Record<number, CellTone> = {};
    const calls: string[] = [];
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("binary tree", tree, { tones: { ...tones, ...extra }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      stacks: [{ name: "call stack", values: [...calls] }],
    });

    r.step(lineOf(code, "return fits(root, -Infinity, Infinity);"), "Start at the root with no limits. Going left, the node's value becomes the new upper limit; going right, the new lower limit.", view(tree.root));
    const fits = (id: number | null, low: number, high: number): boolean => {
      if (id === null) return true;
      const n = node(id);
      const v = n.value as number;
      calls.push(`fits(${v}, ${bound(low)}, ${bound(high)})`);
      if (v <= low || v >= high) {
        tones[id] = "tertiary";
        r.step(lineOf(code, "if (node.val <= low || node.val >= high) return false;"), `${v} must lie strictly between ${bound(low)} and ${bound(high)} — it doesn't (${v <= low ? `${v} ≤ ${bound(low)}` : `${v} ≥ ${bound(high)}`}). Return false, and every waiting call fails too.`, view(id));
        calls.pop();
        return false;
      }
      tones[id] = "success";
      r.step(lineOf(code, "return fits(node.left, low, node.val)"), `${bound(low)} < ${v} < ${bound(high)}: fits. Its left side must be in (${bound(low)}, ${v}), its right side in (${v}, ${bound(high)}).`, view(id, { [id]: "write" }));
      const ok = fits(n.left, low, v) && fits(n.right, v, high);
      calls.pop();
      return ok;
    };
    const ok = fits(tree.root, -Infinity, Infinity);
    r.step(lineOf(code, "return fits(root, -Infinity, Infinity);"), ok
      ? `Every node fit its range: the tree is a BST — **true**. O(n) time, O(h) stack.`
      : `One node broke its range: not a BST — **false**. Checking only parent and child would have missed a grandchild like this.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
