import { lineOf } from "../graphs";
import { checkBst, subtreeTones } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function floorAndCeil(root, x) {
  let floor = -1, ceil = -1;
  let node = root;
  while (node !== null) {
    if (node.val === x) return [x, x];     // x itself is both
    if (node.val < x) {
      floor = node.val;                    // a floor candidate; bigger ones are to the right
      node = node.right;
    } else {
      ceil = node.val;                     // a ceil candidate; smaller ones are to the left
      node = node.left;
    }
  }
  return [floor, ceil];
}`;

const program: Program = {
  title: "Floor and ceil in a BST (one walk down)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "x", label: "x", kind: "number" },
  ],
  examples: [
    { label: "x = 5", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], x: 5 } },
    { label: "x = 12", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], x: 12 } },
    { label: "x in the tree", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], x: 7 } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const x = input.x as number;
    const r = recorder();
    let floor = -1;
    let ceil = -1;
    let floorId: number | null = null;
    let ceilId: number | null = null;
    const skipped: Record<number, CellTone> = {};
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => {
      const tones: Record<number, CellTone> = { ...skipped };
      if (floorId !== null) tones[floorId] = "primary";
      if (ceilId !== null) tones[ceilId] = "tertiary";
      return {
        trees: [treeView(`BST, x = ${x}`, tree, { tones: { ...tones, ...extra }, pointers: tagsAt({ node: at, floor: floorId, ceil: ceilId }) })],
        vars: { x, floor, ceil },
      };
    };

    r.step(lineOf(code, "let floor = -1, ceil = -1;"), `Find the largest value ≤ ${x} (floor) and the smallest value ≥ ${x} (ceil). Walk down as if searching for ${x}; every node on the way is a candidate for one of them.`, view(tree.root));
    let at: number | null = tree.root;
    while (at !== null) {
      const n = node(at);
      const v = n.value as number;
      if (v === x) {
        r.step(lineOf(code, "if (node.val === x) return [x, x];"), `${v} = ${x}: x is in the tree, so it is both the floor and the ceil. Answer **[${x}, ${x}]**.`, { ...view(at, { [at]: "success" }), done: true });
        return r.frames;
      }
      if (v < x) {
        floor = v;
        floorId = at;
        Object.assign(skipped, subtreeTones(tree, n.left, "muted"));
        r.step(lineOf(code, "floor = node.val;"), `${v} < ${x}: the best **floor** so far is ${v}. Anything left of it is smaller still, so go **right** for a value closer to ${x}.`, view(at));
        at = n.right;
      } else {
        ceil = v;
        ceilId = at;
        Object.assign(skipped, subtreeTones(tree, n.right, "muted"));
        r.step(lineOf(code, "ceil = node.val;"), `${v} > ${x}: the best **ceil** so far is ${v}. Anything right of it is bigger still, so go **left** for a value closer to ${x}.`, view(at));
        at = n.left;
      }
    }
    r.step(lineOf(code, "return [floor, ceil];"), `Fell off the tree. Answer **[${floor}, ${ceil}]**${floor === -1 ? " — nothing is ≤ " + x : ""}${ceil === -1 ? " — nothing is ≥ " + x : ""}. One path from the root: O(h) time, O(1) space.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
