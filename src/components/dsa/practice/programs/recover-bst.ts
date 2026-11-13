import { lineOf } from "../graphs";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function recoverTree(root) {
  let prev = null, first = null, second = null;
  const inorder = (node) => {
    if (node === null) return;
    inorder(node.left);
    if (prev !== null && prev.val > node.val) {   // a drop
      if (first === null) first = prev;           // bigger side of the first drop
      second = node;                              // smaller side of the latest drop
    }
    prev = node;
    inorder(node.right);
  };
  inorder(root);
  [first.val, second.val] = [second.val, first.val];
}`;

/** In-order values of a level-order tree. */
const inorderValues = (values: (number | null)[]) => {
  const tree = buildTree(values);
  const { node } = indexTree(tree);
  const out: number[] = [];
  const walk = (id: number | null) => {
    if (id === null) return;
    walk(node(id).left);
    out.push(node(id).value as number);
    walk(node(id).right);
  };
  walk(tree.root);
  return out;
};

const program: Program = {
  title: "Recover a BST with two swapped values",
  code,
  fields: [{ key: "root", label: "BST with two values swapped (level order)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Neighbours swapped", input: { root: [3, 1, 4, null, null, 2] } },
    { label: "Root swapped", input: { root: [1, 3, null, null, 2] } },
    { label: "Far apart", input: { root: [6, 3, 8, 9, 4, 7, 1] } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    if (values.length === 0 || values[0] === null) return "Enter at least two nodes.";
    const v = inorderValues(values);
    if (new Set(v).size !== v.length) return "Use distinct values.";
    const sorted = [...v].sort((a, b) => a - b);
    const wrong = v.filter((x, i) => x !== sorted[i]).length;
    return wrong === 2 ? null : "Exactly two values must be out of place — start from a BST and swap two of its values.";
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const order: number[] = [];
    const tones: Record<number, CellTone> = {};
    let prev: number | null = null;
    let first: number | null = null;
    let second: number | null = null;
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => {
      const marks: Record<number, CellTone> = {};
      if (first !== null) marks[first] = "tertiary";
      if (second !== null) marks[second] = "tertiary";
      return {
        trees: [treeView("tree", tree, { tones: { ...tones, ...marks, ...extra }, pointers: tagsAt({ node: at, first, second }, { first: "tertiary", second: "tertiary" }) })],
        arrays: [{ name: "in-order so far", values: order.map((id) => node(id).value), tones: Object.fromEntries(order.map((id, i) => [i, id === first || id === second ? "tertiary" : "done"])) as Record<number, CellTone> }],
      };
    };

    r.step(lineOf(code, "inorder(root);"), "In-order should list the values in increasing order. Two values were swapped, so somewhere it goes down — find the drops.", view(tree.root));
    const inorder = (id: number | null) => {
      if (id === null) return;
      const n = node(id);
      inorder(n.left);
      order.push(id);
      const v = n.value as number;
      if (prev !== null && (node(prev).value as number) > v) {
        const isFirst = first === null;
        if (isFirst) first = prev;
        second = id;
        r.step(lineOf(code, "if (prev !== null && prev.val > node.val) {"), `${node(prev).value} > ${v}: a **drop**. ${isFirst ? `${node(prev).value} is the first wrong value (the bigger side of the first drop); ${v} is the second — for now.` : `A second drop: the second wrong value becomes ${v}.`}`, view(id, { [id]: "write" }));
      } else {
        r.step(lineOf(code, "prev = node;"), prev === null ? `${v} comes first in in-order.` : `${node(prev).value} < ${v}: still increasing.`, view(id, { [id]: "write" }));
      }
      tones[id] = "done";
      prev = id;
      inorder(n.right);
    };
    inorder(tree.root);
    const a = node(first!).value;
    const b = node(second!).value;
    node(first!).value = b;
    node(second!).value = a;
    tones[first!] = "success";
    tones[second!] = "success";
    const fixed = [first!, second!];
    first = null;
    second = null;
    r.step(lineOf(code, "[first.val, second.val] = [second.val, first.val];"), `Swap **${a} and ${b}** back. The in-order walk is now increasing again: the tree is a valid BST. O(n) time, O(h) stack.`, { ...view(null, Object.fromEntries(fixed.map((x) => [x, "success"])) as Record<number, CellTone>), done: true });
    return r.frames;
  },
};

export default program;
