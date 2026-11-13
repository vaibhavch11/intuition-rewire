import { lineOf } from "../graphs";
import { checkBst, plural, subtreeTones } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function rangeSumBST(node, low, high) {
  if (node === null) return 0;
  if (node.val < low) return rangeSumBST(node.right, low, high);    // node and its left side are too small
  if (node.val > high) return rangeSumBST(node.left, low, high);    // node and its right side are too big
  return node.val + rangeSumBST(node.left, low, high) + rangeSumBST(node.right, low, high);
}`;

const program: Program = {
  title: "Range sum of a BST (prune what can't be in range)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "low", label: "low", kind: "number" },
    { key: "high", label: "high", kind: "number" },
  ],
  examples: [
    { label: "Example", input: { root: [10, 5, 15, 3, 7, null, 18], low: 7, high: 15 } },
    { label: "Bigger tree", input: { root: [10, 5, 15, 3, 7, 13, 18, 1, null, 6], low: 6, high: 10 } },
    { label: "Narrow range", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], low: 13, high: 14 } },
  ],
  check(input) {
    const bad = checkBst(input.root as (number | null)[]);
    if (bad) return bad;
    return (input.low as number) > (input.high as number) ? "low must not be bigger than high." : null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const low = input.low as number;
    const high = input.high as number;
    const r = recorder();
    const tones: Record<number, CellTone> = {};
    const added: number[] = [];
    let visited = 0;
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView(`BST, range [${low}, ${high}]`, tree, { tones: { ...tones, ...extra }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      vars: { low, high, sum: added.reduce((s, v) => s + v, 0), visited },
    });

    r.step(lineOf(code, "function rangeSumBST(node, low, high) {"), `Add up every value in [${low}, ${high}]. A node outside the range rules out a whole side: everything left of it is smaller, everything right of it is bigger.`, view(tree.root));
    const walk = (id: number | null) => {
      if (id === null) return;
      visited++;
      const n = node(id);
      const v = n.value as number;
      if (v < low) {
        Object.assign(tones, subtreeTones(tree, n.left, "muted"));
        tones[id] = "muted";
        r.step(lineOf(code, "if (node.val < low) return rangeSumBST(node.right"), `${v} < ${low}: too small — and so is everything on its left${n.left === null ? "" : " (skipped)"}. Only the **right** side can hold values in range.`, view(id, { [id]: "tertiary" }));
        walk(n.right);
        return;
      }
      if (v > high) {
        Object.assign(tones, subtreeTones(tree, n.right, "muted"));
        tones[id] = "muted";
        r.step(lineOf(code, "if (node.val > high) return rangeSumBST(node.left"), `${v} > ${high}: too big — and so is everything on its right${n.right === null ? "" : " (skipped)"}. Only the **left** side can help.`, view(id, { [id]: "tertiary" }));
        walk(n.left);
        return;
      }
      added.push(v);
      tones[id] = "success";
      r.step(lineOf(code, "return node.val + rangeSumBST(node.left"), `${v} is in range: **add ${v}** (sum ${added.reduce((s, x) => s + x, 0)}), then search both sides.`, view(id, { [id]: "write" }));
      walk(n.left);
      walk(n.right);
    };
    walk(tree.root);
    const sum = added.reduce((s, v) => s + v, 0);
    r.step(lineOf(code, "return node.val + rangeSumBST(node.left"), `The sum is **${sum}**${added.length ? ` (${added.join(" + ")})` : ""}. Visited ${plural(visited, "node")} of ${tree.nodes.length} — the greyed-out ones were never touched.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
