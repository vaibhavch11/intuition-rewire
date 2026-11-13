import { lineOf } from "../graphs";
import { checkBst } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function deleteNode(node, key) {
  if (node === null) return null;                         // key isn't in the tree
  if (key < node.val) node.left = deleteNode(node.left, key);
  else if (key > node.val) node.right = deleteNode(node.right, key);
  else {
    if (node.left === null) return node.right;            // no left child: the right takes its place
    if (node.right === null) return node.left;            // no right child: the left takes its place
    let next = node.right;                                // two children: the successor is the
    while (next.left !== null) next = next.left;          // smallest value in the right subtree
    node.val = next.val;                                  // copy it here...
    node.right = deleteNode(node.right, next.val);        // ...and delete it from the right
  }
  return node;
}`;

const program: Program = {
  title: "Deleting from a BST (three cases)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "key", label: "key to delete", kind: "number" },
  ],
  examples: [
    { label: "Two children", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], key: 3 } },
    { label: "One child", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], key: 14 } },
    { label: "A leaf", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], key: 13 } },
    { label: "The root", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], key: 8 } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const key = input.key as number;
    const r = recorder();
    const view = (tones: Record<number, CellTone> = {}, at: number | null = null, label = "node") => ({
      trees: [treeView("binary search tree", tree, { tones, pointers: at === null ? {} : tagsAt({ [label]: at }) })],
      vars: { key },
    });
    const path: Record<number, CellTone> = {};
    let removed = false;

    const del = (id: number | null, k: number, copying: boolean): number | null => {
      if (id === null) {
        r.step(lineOf(code, "if (node === null) return null;"), `Fell off the tree: ${k} isn't here, so nothing changes.`, view(path));
        return null;
      }
      const n = node(id);
      const v = n.value as number;
      if (k !== v) {
        const goLeft = k < v;
        path[id] = "primary";
        r.step(lineOf(code, goLeft ? "if (key < node.val) node.left" : "else if (key > node.val) node.right"), `${k} ${goLeft ? "<" : ">"} ${v}: the ${copying ? "successor" : "key"} can only be on the **${goLeft ? "left" : "right"}**.`, view({ ...path, [id]: "write" }, id));
        const child = del(goLeft ? n.left : n.right, k, copying);
        if (goLeft) n.left = child;
        else n.right = child;
        return id;
      }
      removed = true;
      if (n.left === null || n.right === null) {
        const keep = n.left === null ? n.right : n.left;
        const what = n.left === null && n.right === null ? "a leaf" : `one child (${node(keep!).value})`;
        r.step(lineOf(code, n.left === null ? "if (node.left === null) return node.right;" : "if (node.right === null) return node.left;"), `Found ${v}: it has ${what}. ${keep === null ? "Just remove it." : `Its child takes its place.`}`, view({ ...path, [id]: "tertiary", ...(keep === null ? {} : { [keep]: "success" }) }, id, copying ? "old copy" : "node"));
        return keep;
      }
      r.step(lineOf(code, "let next = node.right;"), `Found ${v}, with **two children** — it can't simply be removed. Find its successor: the smallest value in its right subtree.`, view({ ...path, [id]: "tertiary" }, id));
      let next = n.right!;
      const walk: Record<number, CellTone> = { [next]: "primary" };
      while (node(next).left !== null) {
        next = node(next).left!;
        walk[next] = "primary";
      }
      r.step(lineOf(code, "while (next.left !== null) next = next.left;"), `Right once, then left as far as possible: the successor is **${node(next).value}** — bigger than everything on ${v}'s left, smaller than the rest of its right.`, view({ ...path, ...walk, [id]: "tertiary", [next]: "success" }, next, "successor"));
      const sv = node(next).value as number;
      n.value = sv;
      r.step(lineOf(code, "node.val = next.val;"), `Copy ${sv} into the node that held ${v}. Now ${sv} appears twice, so delete the old copy from the right subtree — it has no left child, so that's an easy case.`, view({ ...path, [id]: "success", [next]: "muted" }, id));
      n.right = del(n.right, sv, true);
      return id;
    };

    r.step(lineOf(code, "function deleteNode(node, key) {"), `Delete **${key}**: search for it first, then handle it by how many children it has.`, view());
    tree.root = del(tree.root, key, false);
    r.step(
      lineOf(code, "return node;"),
      removed
        ? `**${key}** is deleted and the tree is still a BST. One walk down to the node (and one more to its successor): O(h).`
        : `**${key}** isn't in the tree, so it's unchanged.`,
      { ...view({}), done: true }
    );
    return r.frames;
  },
};

export default program;
