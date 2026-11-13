import { lineOf } from "../graphs";
import { checkBst, inorderIds, subtreeTones } from "../bst";
import { buildTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function trimBST(root, low, high) {
  if (root === null) return null;
  if (root.val < low) return trimBST(root.right, low, high);    // root and its left side are too small
  if (root.val > high) return trimBST(root.left, low, high);    // root and its right side are too big
  root.left = trimBST(root.left, low, high);
  root.right = trimBST(root.right, low, high);
  return root;
}`;

const program: Program = {
  title: "Trim a BST to [low, high]",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "low", label: "low", kind: "number" },
    { key: "high", label: "high", kind: "number" },
  ],
  examples: [
    { label: "Example", input: { root: [3, 0, 4, null, 2, null, null, 1], low: 1, high: 3 } },
    { label: "Root removed", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], low: 9, high: 13 } },
    { label: "Middle band", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], low: 4, high: 10 } },
  ],
  check(input) {
    const bad = checkBst(input.root as (number | null)[]);
    if (bad) return bad;
    return (input.low as number) > (input.high as number) ? "low must not be bigger than high." : null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const node = (id: number) => tree.nodes[id];
    const low = input.low as number;
    const high = input.high as number;
    const r = recorder();
    const tones: Record<number, CellTone> = {};
    const calls: string[] = [];
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView(`BST, keep [${low}, ${high}]`, tree, { tones: { ...tones, ...extra }, pointers: at === null ? {} : tagsAt({ root: at }) })],
      stacks: [{ name: "call stack", values: [...calls] }],
      vars: { low, high },
    });

    r.step(lineOf(code, "function trimBST(root, low, high) {"), `Keep only values in [${low}, ${high}]. A node that's too small takes its whole left side with it; a node that's too big takes its whole right side.`, view(tree.root));
    const trim = (id: number | null): number | null => {
      if (id === null) return null;
      const n = node(id);
      const v = n.value as number;
      calls.push(`trim(${v})`);
      if (v < low) {
        Object.assign(tones, subtreeTones(tree, n.left, "muted"));
        tones[id] = "muted";
        r.step(lineOf(code, "if (root.val < low) return trimBST(root.right"), `${v} < ${low}: drop ${v}${n.left === null ? "" : " and its left side"}. What replaces it is its **trimmed right** subtree.`, view(id, { [id]: "tertiary" }));
        const res = trim(n.right);
        calls.pop();
        return res;
      }
      if (v > high) {
        Object.assign(tones, subtreeTones(tree, n.right, "muted"));
        tones[id] = "muted";
        r.step(lineOf(code, "if (root.val > high) return trimBST(root.left"), `${v} > ${high}: drop ${v}${n.right === null ? "" : " and its right side"}. What replaces it is its **trimmed left** subtree.`, view(id, { [id]: "tertiary" }));
        const res = trim(n.left);
        calls.pop();
        return res;
      }
      tones[id] = "success";
      r.step(lineOf(code, "root.left = trimBST(root.left, low, high);"), `${v} is in range: keep it, and trim its left side.`, view(id, { [id]: "write" }));
      n.left = trim(n.left);
      r.step(lineOf(code, "root.right = trimBST(root.right, low, high);"), `Back at ${v}: its left child is now ${n.left === null ? "empty" : node(n.left).value}. Trim its right side.`, view(id, { [id]: "write" }));
      n.right = trim(n.right);
      r.step(lineOf(code, "return root;"), `${v} keeps ${n.left === null ? "no left child" : `left ${node(n.left).value}`} and ${n.right === null ? "no right child" : `right ${node(n.right).value}`}. Return ${v}.`, view(id, { [id]: "write" }));
      calls.pop();
      return id;
    };
    tree.root = trim(tree.root);
    const kept = inorderIds(tree).map((id) => node(id).value);
    r.step(lineOf(code, "return root;"), tree.root === null
      ? "Nothing was in range: the result is **empty**."
      : `The trimmed tree has root **${node(tree.root).value}** and holds ${kept.join(", ")}. Every kept node was visited once: O(n) time, O(h) stack.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
