import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function isSymmetric(root) {
  return root === null || isMirror(root.left, root.right);
}

function isMirror(a, b) {
  if (a === null && b === null) return true;     // both empty: a match
  if (a === null || b === null) return false;    // one empty: not a mirror
  if (a.val !== b.val) return false;
  return isMirror(a.left, b.right)               // the outside pair
      && isMirror(a.right, b.left);              // the inside pair
}`;

const program: Program = {
  title: "Symmetric tree (compare mirrored pairs)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 11 }],
  examples: [
    { label: "Symmetric", input: { root: [1, 2, 2, 3, 4, 4, 3] } },
    { label: "Shape differs", input: { root: [1, 2, 2, null, 3, null, 3] } },
    { label: "Value differs", input: { root: [1, 2, 2, 3, 4, 5, 3] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const matched: number[] = [];
    const val = (id: number | null) => (id === null ? "null" : String(node(id).value));

    const view = (a: number | null, b: number | null, tones: Record<number, CellTone> = {}) => {
      const marks: Record<string, number | null> = {};
      if (a !== null) marks.a = a;
      if (b !== null) marks.b = b;
      return {
        trees: [treeView("tree", tree, { tones: { ...toneIds(matched, "done"), ...tones }, pointers: tagsAt(marks, { b: "tertiary" }) })],
      };
    };

    const root = tree.root!;
    r.step(2, `A tree is symmetric if its **left subtree is the mirror image of its right subtree**. Compare them in pairs: a mirror pairs left with right and right with left.`, {
      ...view(null, null, { [root]: "done" }),
      vars: {},
    });
    matched.push(root);

    const mirror = (a: number | null, b: number | null, why: string): boolean => {
      if (a === null && b === null) return true;
      if (a === null || b === null) {
        r.step(7, `${why}: one side is **${val(a)}**, the other is **${val(b)}**. One is missing, so the tree is **not symmetric**.`, {
          ...view(a, b, { ...(a !== null ? { [a]: "write" as CellTone } : {}), ...(b !== null ? { [b]: "write" as CellTone } : {}) }),
          vars: { a: val(a), b: val(b), result: "false" },
          done: true,
        });
        return false;
      }
      if (node(a).value !== node(b).value) {
        r.step(8, `${why}: ${val(a)} ≠ ${val(b)}. **Not symmetric**.`, {
          ...view(a, b, { [a]: "write", [b]: "write" }),
          vars: { a: val(a), b: val(b), result: "false" },
          done: true,
        });
        return false;
      }
      matched.push(a, b);
      r.step(9, `${why}: ${val(a)} = ${val(b)}. Now their children must mirror too — a's **left** with b's **right** (outside), a's **right** with b's **left** (inside).`, {
        ...view(a, b, { [a]: "success", [b]: "success" }),
        vars: { a: val(a), b: val(b) },
      });
      return mirror(node(a).left, node(b).right, `Outside pair under ${val(a)} and ${val(b)}`) && mirror(node(a).right, node(b).left, `Inside pair under ${val(a)} and ${val(b)}`);
    };

    const ok = mirror(node(root).left, node(root).right, "The root's two children");
    if (ok) {
      r.step(2, `Every mirrored pair matched: the tree **is symmetric**. Each node was compared once: **O(n) time, O(h) space**.`, {
        ...view(null, null),
        vars: { result: "true" },
        done: true,
      });
    }
    return r.frames;
  },
};

export default program;
