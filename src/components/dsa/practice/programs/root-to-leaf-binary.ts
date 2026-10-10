import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function sumRootToLeaf(root) {
  function dfs(node, value) {
    if (node === null) return 0;
    value = value * 2 + node.val;          // shift left, append this bit
    if (node.left === null && node.right === null) return value;
    return dfs(node.left, value) + dfs(node.right, value);
  }
  return dfs(root, 0);
}`;

const program: Program = {
  title: "Sum of root-to-leaf binary numbers",
  code,
  fields: [{ key: "root", label: "tree of 0s and 1s (level order)", kind: "tree", maxLength: 11, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { root: [1, 0, 1, 0, 1, 0, 1] } },
    { label: "Uneven", input: { root: [1, 1, 0, null, 1] } },
    { label: "Just 0", input: { root: [0] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root bit." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const captions: Record<number, string> = {};
    const leaves: number[] = [];
    const pathIds: number[] = [];
    const numbers: string[] = [];
    let total = 0;

    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree (caption = value so far)", tree, { tones: { ...toneIds(leaves, "success"), ...toneIds(pathIds, "primary"), ...tones }, captions, pointers: at === null ? {} : tagsAt({ node: at }) })],
      arrays: [{ name: "numbers at the leaves", values: numbers }],
    });

    r.step(8, `Every root-to-leaf path spells a binary number, most significant bit first. Carry the number **down** the tree: moving to a child doubles it (a left shift) and adds the child's bit.`, {
      ...view(null),
      vars: { sum: 0 },
    });

    const dfs = (id: number, value: number) => {
      const n = node(id);
      const bit = n.value as number;
      const next = value * 2 + bit;
      pathIds.push(id);
      captions[id] = `${next.toString(2)} = ${next}`;
      if (n.left === null && n.right === null) {
        total += next;
        leaves.push(id);
        numbers.push(`${next.toString(2)}₂ = ${next}`);
        r.step(5, `Leaf: the path spells **${next.toString(2)}** = ${next}. Running total = **${total}**.`, {
          ...view(id, { [id]: "write" }),
          vars: { value: next, sum: total },
        });
      } else {
        r.step(4, `Bit ${bit}: value = ${value} × 2 + ${bit} = **${next}** (${next.toString(2)} in binary). Pass it to the children.`, {
          ...view(id, { [id]: "write" }),
          vars: { value: next, sum: total },
        });
        if (n.left !== null) dfs(n.left, next);
        if (n.right !== null) dfs(n.right, next);
      }
      pathIds.pop();
    };
    dfs(tree.root!, 0);

    r.step(8, `Sum of all root-to-leaf numbers = **${total}**. No strings, no parsing — one multiply-and-add per node: **O(n) time, O(h) space**.`, {
      ...view(null),
      vars: { sum: total },
      done: true,
    });
    return r.frames;
  },
};

export default program;
