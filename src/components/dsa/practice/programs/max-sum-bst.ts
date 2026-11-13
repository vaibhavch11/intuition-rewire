import { lineOf } from "../graphs";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function maxSumBST(root) {
  let best = 0;
  const post = (node) => {                 // [isBst, min, max, sum] of this subtree
    if (node === null) return [true, Infinity, -Infinity, 0];
    const [lb, lmin, lmax, lsum] = post(node.left);
    const [rb, rmin, rmax, rsum] = post(node.right);
    if (lb && rb && lmax < node.val && node.val < rmin) {
      const sum = lsum + node.val + rsum;
      best = Math.max(best, sum);
      return [true, Math.min(lmin, node.val), Math.max(rmax, node.val), sum];
    }
    return [false, 0, 0, 0];               // not a BST: no ancestor can be one either
  };
  post(root);
  return best;
}`;

type Info = [boolean, number, number, number];

const program: Program = {
  title: "Maximum sum BST in a binary tree (post-order summaries)",
  code,
  fields: [{ key: "root", label: "Binary tree (level order)", kind: "tree", maxLength: 15 }],
  examples: [
    { label: "Example", input: { root: [1, 4, 3, 2, 4, 2, 5, null, null, null, null, null, null, 4, 6] } },
    { label: "Just a leaf", input: { root: [4, 3, null, 1, 2] } },
    { label: "All negative", input: { root: [-4, -2, -5] } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    return values.length === 0 || values[0] === null ? "Enter at least the root value." : null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const tones: Record<number, CellTone> = {};
    const calls: string[] = [];
    let best = 0;
    let bestId: number | null = null;
    const view = (at: number | null) => ({
      trees: [treeView("binary tree", tree, { tones: { ...tones, ...(at === null ? {} : { [at]: "write" as CellTone }) }, pointers: tagsAt({ node: at, best: bestId }, { best: "tertiary" }) })],
      stacks: [{ name: "call stack", values: [...calls] }],
      vars: { best },
    });

    r.step(lineOf(code, "post(root);"), "Visit the tree bottom-up. Each subtree reports four facts — is it a BST, its smallest value, its largest value, its sum — built from its children's reports.", view(tree.root));
    const post = (id: number | null): Info => {
      if (id === null) return [true, Infinity, -Infinity, 0];
      const n = node(id);
      const v = n.value as number;
      calls.push(`post(${v})`);
      const L = post(n.left);
      const R = post(n.right);
      if (L[0] && R[0] && L[2] < v && v < R[1]) {
        const sum = L[3] + v + R[3];
        const better = sum > best;
        if (better) {
          best = sum;
          bestId = id;
        }
        tones[id] = "success";
        const why = n.left === null && n.right === null ? "a leaf is always a BST" : `${n.left === null ? "no left side" : `left max ${L[2]} < ${v}`} and ${n.right === null ? "no right side" : `${v} < right min ${R[1]}`}`;
        r.step(lineOf(code, "best = Math.max(best, sum);"), `Subtree at ${v}: ${why}, so it **is a BST** with sum ${sum}${better ? ` — the best so far` : ` (best stays ${best})`}.`, view(id));
        calls.pop();
        return [true, Math.min(L[1], v), Math.max(R[2], v), sum];
      }
      tones[id] = "tertiary";
      const why = !L[0] || !R[0] ? `a child's subtree isn't a BST` : L[2] >= v ? `the left side holds ${L[2]}, which is not smaller than ${v}` : `the right side holds ${R[1]}, which is not bigger than ${v}`;
      r.step(lineOf(code, "return [false, 0, 0, 0];"), `Subtree at ${v}: ${why}. **Not a BST** — and no ancestor's subtree can be one either.`, view(id));
      calls.pop();
      return [false, 0, 0, 0];
    };
    post(tree.root);
    r.step(lineOf(code, "return best;"), best === 0 && bestId === null
      ? "No BST subtree has a positive sum, so the answer is the empty BST: **0**."
      : `The largest BST sum is **${best}**${bestId === null ? "" : `, from the subtree at ${node(bestId).value}`}. Each node did O(1) work with its children's reports: O(n) time.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
