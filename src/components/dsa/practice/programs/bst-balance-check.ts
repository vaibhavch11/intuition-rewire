import { lineOf } from "../graphs";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function isBalanced(root) {
  const heightOrFail = (node) => {          // the height, or -1 if unbalanced somewhere below
    if (node === null) return 0;
    const left = heightOrFail(node.left);
    if (left === -1) return -1;
    const right = heightOrFail(node.right);
    if (right === -1 || Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
  };
  return heightOrFail(root) !== -1;
}`;

const program: Program = {
  title: "Is it balanced? Heights from the bottom up",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 15 }],
  examples: [
    { label: "Balanced", input: { root: [8, 3, 10, 1, 6, null, 14] } },
    { label: "Leaning", input: { root: [8, 3, 10, 1, 6, null, null, null, null, 4, 7] } },
    { label: "Chain", input: { root: [1, null, 2, null, 3] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length ? null : "Enter at least the root value."),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const heights: Record<number, string> = {};
    const tones: Record<number, CellTone> = {};
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree (h = height under each node)", tree, { tones: { ...tones, ...extra }, captions: { ...heights }, pointers: at === null ? {} : tagsAt({ node: at }) })],
    });

    r.step(lineOf(code, "const heightOrFail = (node) => {"), `Work **bottom-up**: each node's height comes from its children's, and a difference of 2 or more anywhere means the tree is unbalanced. Empty children have height 0.`, view(tree.root));
    let failedAt: number | null = null;
    const walk = (id: number | null): number => {
      if (id === null) return 0;
      const n = node(id);
      const left = walk(n.left);
      if (left === -1) return -1;
      const right = walk(n.right);
      if (right === -1) return -1;
      if (Math.abs(left - right) > 1) {
        failedAt = id;
        tones[id] = "tertiary";
        r.step(lineOf(code, "if (right === -1 || Math.abs(left - right) > 1) return -1;"), `At ${n.value}: left height ${left}, right height ${right} — they differ by **${Math.abs(left - right)}**. Unbalanced: stop and report -1 all the way up.`, view(id, { [id]: "tertiary" }));
        return -1;
      }
      const h = 1 + Math.max(left, right);
      heights[id] = `h=${h}`;
      tones[id] = "done";
      r.step(lineOf(code, "return 1 + Math.max(left, right);"), `At ${n.value}: left ${left}, right ${right} (differ by ${Math.abs(left - right)}, fine). Height = 1 + max = **${h}**.`, view(id, { [id]: "write" }));
      return h;
    };
    const result = walk(tree.root);
    const ok = result !== -1;
    r.step(
      lineOf(code, "return heightOrFail(root) !== -1;"),
      ok
        ? `Every node passed: **true** — the tree is height-balanced, with height ${result}. Each node was visited once: O(n).`
        : `**false** — ${node(failedAt!).value}'s subtrees differ in height by more than 1. Nodes above it were never even checked.`,
      { ...view(null), done: true }
    );
    return r.frames;
  },
};

export default program;
