import { buildTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function invertTree(node) {
  if (node === null) return null;
  [node.left, node.right] = [node.right, node.left];   // swap the two children
  invertTree(node.left);
  invertTree(node.right);
  return node;
}`;

const program: Program = {
  title: "Invert a binary tree (swap every node's children)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 10 }],
  examples: [
    { label: "Example", input: { root: [4, 2, 7, 1, 3, 6, 9] } },
    { label: "Lopsided", input: { root: [1, 2, null, 3, 4] } },
    { label: "Two nodes", input: { root: [2, 1] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    // Copy the nodes so swaps don't touch the parsed input.
    const tree = buildTree(input.root as (number | null)[]);
    const nodes = tree.nodes.map((n) => ({ ...n }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const r = recorder();
    const swapped: number[] = [];

    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", { nodes, root: tree.root }, { tones: { ...toneIds(swapped, "done"), ...tones }, pointers: at === null ? {} : tagsAt({ node: at }) })],
    });

    r.step(1, `Inverting means mirroring the tree left-to-right. Look at any single node: in the mirror, its left and right children have **traded places**. So swap the children at every node.`, {
      ...view(null),
      vars: {},
    });

    const invert = (id: number | null) => {
      if (id === null) return;
      const n = byId.get(id)!;
      [n.left, n.right] = [n.right, n.left];
      swapped.push(id);
      const kids = [n.left, n.right].filter((c) => c !== null).length;
      r.step(3, kids === 0
        ? `${n.value} is a leaf — swapping two empty children changes nothing.`
        : `Swap the children of **${n.value}**. ${kids === 2 ? "Each child takes its whole subtree with it." : "Its only child moves to the other side, subtree and all."}`, {
        ...view(id, { [id]: kids === 0 ? "success" : "write" }),
        vars: { node: n.value as number },
      });
      invert(n.left);
      invert(n.right);
    };
    invert(tree.root);

    r.step(6, `Every node's children are swapped, so the whole tree is mirrored. Each node is visited once: **O(n) time, O(h) call stack**, and no new nodes are created.`, {
      ...view(null),
      vars: {},
      done: true,
    });
    return r.frames;
  },
};

export default program;
