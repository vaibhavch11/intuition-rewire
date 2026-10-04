import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Input, type Program } from "../types";

const code = `function search(root, target) {
  let node = root;
  while (node !== null) {
    if (target === node.val) return node;      // found it
    if (target < node.val) {
      node = node.left;                        // everything on the right is bigger: skip it
    } else {
      node = node.right;                       // everything on the left is smaller: skip it
    }
  }
  return null;                                 // fell off the tree: not there
}`;

/** Every value in a left subtree must be smaller, every value in a right subtree bigger. */
function isBst(values: (number | null)[]): boolean {
  const tree = buildTree(values);
  const { node } = indexTree(tree);
  const ok = (id: number | null, lo: number, hi: number): boolean => {
    if (id === null) return true;
    const v = node(id).value as number;
    return v > lo && v < hi && ok(node(id).left, lo, v) && ok(node(id).right, v, hi);
  };
  return ok(tree.root, -Infinity, Infinity);
}

/** All ids in the subtree under `id`. */
function subtree(tree: ReturnType<typeof buildTree>, id: number | null): number[] {
  const { node } = indexTree(tree);
  const out: number[] = [];
  const walk = (x: number | null) => {
    if (x === null) return;
    out.push(x);
    walk(node(x).left);
    walk(node(x).right);
  };
  walk(id);
  return out;
}

const program: Program = {
  title: "Searching a binary search tree",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "target", label: "target", kind: "number" },
  ],
  examples: [
    { label: "Find 7", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], target: 7 } },
    { label: "Find 13", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], target: 13 } },
    { label: "Missing 5", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], target: 5 } },
  ],
  check(input: Input) {
    const values = input.root as (number | null)[];
    if (values.length === 0) return "Enter at least the root value.";
    return isBst(values) ? null : "That isn't a binary search tree: every left subtree must hold smaller values and every right subtree bigger ones.";
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const target = input.target as number;
    const r = recorder();
    const skipped = new Set<number>();
    const path: number[] = [];

    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [
        treeView("binary search tree", tree, {
          tones: { ...toneIds(skipped, "muted"), ...toneIds(path, "done"), ...tones },
          pointers: at === null ? {} : tagsAt({ node: at }),
        }),
      ],
    });

    r.step(2, `Look for **${target}**. In a binary search tree, everything left of a node is smaller and everything right is bigger — so each comparison throws away a whole side.`, {
      ...view(tree.root),
      vars: { target, checked: 0 },
    });

    let at = tree.root;
    while (at !== null) {
      const v = node(at).value as number;
      path.push(at);
      if (target === v) {
        r.step(4, `${target} = ${v}: **found** after checking ${path.length} node${path.length === 1 ? "" : "s"} out of ${tree.nodes.length}.`, {
          ...view(at, { [at]: "success" }),
          vars: { target, checked: path.length },
          done: true,
        });
        return r.frames;
      }
      const goLeft = target < v;
      for (const id of subtree(tree, goLeft ? node(at).right : node(at).left)) skipped.add(id);
      r.step(goLeft ? 6 : 8, `${target} ${goLeft ? "<" : ">"} ${v}, so ${target} can only be on the **${goLeft ? "left" : "right"}**. The whole ${goLeft ? "right" : "left"} side is skipped without looking at it.`, {
        ...view(at, { [at]: "primary" }),
        vars: { target, checked: path.length },
      });
      at = goLeft ? node(at).left : node(at).right;
    }

    r.step(11, `There is no child to move to, so **${target} isn't in the tree** — decided after only ${path.length} comparison${path.length === 1 ? "" : "s"}. A balanced tree of a million values needs about 20.`, {
      ...view(null),
      vars: { target, checked: path.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
