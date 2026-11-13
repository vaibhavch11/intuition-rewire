import { lineOf } from "../graphs";
import { addNode, plural } from "../bst";
import { tagsAt, treeView, type Tree } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function insert(node, val) {
  if (node === null) return new TreeNode(val);   // an empty spot: the value lives here
  if (val < node.val) node.left = insert(node.left, val);
  else node.right = insert(node.right, val);     // equal values go right
  return node;
}

function buildBST(values) {
  let root = null;
  for (const v of values) root = insert(root, v);
  return root;
}`;

const program: Program = {
  title: "Building a BST one insert at a time",
  code,
  fields: [{ key: "values", label: "values (in insert order)", kind: "array", maxLength: 10, min: -99, max: 999 }],
  examples: [
    { label: "Example", input: { values: [8, 3, 10, 1, 6, 14, 4, 7] } },
    { label: "Sorted (a chain)", input: { values: [1, 2, 3, 4, 5] } },
    { label: "Middle first", input: { values: [4, 2, 6, 1, 3, 5, 7] } },
  ],
  check: (input) => ((input.values as number[]).length ? null : "Add at least one value."),
  run(input) {
    const values = input.values as number[];
    const r = recorder();
    const tree: Tree = { nodes: [], root: null };
    const node = (id: number) => tree.nodes[id];   // ids are positions; nodes are added as we go
    const placed: number[] = [];

    const view = (tones: Record<number, CellTone> = {}, at: number | null = null, i = -1) => ({
      trees: [treeView("binary search tree", tree, { tones, pointers: at === null ? {} : tagsAt({ node: at }) })],
      arrays: [{ name: "values", values, tones: Object.fromEntries(values.map((_, k) => [k, k < i ? "done" : k === i ? "primary" : "idle"])) as Record<number, CellTone> }],
    });

    r.step(lineOf(code, "let root = null;"), `Start with an empty tree and insert the values in order. Each one walks down from the root — **left** when smaller, **right** when not — and becomes a leaf in the first empty spot.`, view());
    values.forEach((v, i) => {
      if (tree.root === null) {
        tree.root = addNode(tree, v);
        placed.push(tree.root);
        r.step(lineOf(code, "if (node === null) return new TreeNode(val);"), `${v}: the tree is empty, so **${v}** becomes the root.`, view({ [tree.root]: "write" }, null, i));
        return;
      }
      const path: Record<number, CellTone> = {};
      let at = tree.root;
      for (;;) {
        const n = node(at);
        const goLeft = v < (n.value as number);
        path[at] = "primary";
        const next = goLeft ? n.left : n.right;
        r.step(lineOf(code, goLeft ? "if (val < node.val) node.left" : "else node.right = insert("), `${v} ${goLeft ? "<" : "≥"} ${n.value}: go **${goLeft ? "left" : "right"}**${next === null ? " — and that side is empty." : "."}`, view({ ...path, [at]: "write" }, at, i));
        if (next === null) {
          const id = addNode(tree, v);
          if (goLeft) n.left = id;
          else n.right = id;
          placed.push(id);
          r.step(lineOf(code, "if (node === null) return new TreeNode(val);"), `**${v}** becomes the ${goLeft ? "left" : "right"} child of ${n.value}. Nothing else in the tree moves.`, view({ ...path, [id]: "success" }, id, i));
          return;
        }
        at = next;
      }
    });
    const depth = (id: number | null): number => (id === null ? 0 : 1 + Math.max(depth(node(id).left), depth(node(id).right)));
    const h = depth(tree.root);
    r.step(lineOf(code, "return root;"), `Built: ${plural(values.length, "value")}, height **${h}**.${h === values.length && values.length > 2 ? " Every value went the same way, so the tree is a chain — sorted input is a BST's worst case." : " The insert order decided this shape; a different order gives a different, equally valid BST."}`, { ...view(Object.fromEntries(placed.map((id) => [id, "done"])) as Record<number, CellTone>, null, values.length), done: true });
    return r.frames;
  },
};

export default program;
