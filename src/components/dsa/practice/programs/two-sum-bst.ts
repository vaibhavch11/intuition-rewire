import { lineOf } from "../graphs";
import { checkBst, inorderIds } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function findTarget(root, k) {
  const values = [];
  const inorder = (node) => {
    if (node === null) return;
    inorder(node.left);
    values.push(node.val);
    inorder(node.right);
  };
  inorder(root);
  let i = 0, j = values.length - 1;
  while (i < j) {
    const sum = values[i] + values[j];
    if (sum === k) return true;
    if (sum < k) i++;                      // need a bigger sum
    else j--;                              // need a smaller sum
  }
  return false;
}`;

const program: Program = {
  title: "Two Sum in a BST (in-order + two pointers)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "k", label: "k", kind: "number" },
  ],
  examples: [
    { label: "k = 9", input: { root: [5, 3, 6, 2, 4, null, 7], k: 9 } },
    { label: "k = 28 (no pair)", input: { root: [5, 3, 6, 2, 4, null, 7], k: 28 } },
    { label: "k = 22", input: { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], k: 22 } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const k = input.k as number;
    const r = recorder();
    const ids = inorderIds(tree);
    const values = ids.map((id) => node(id).value as number);
    let i = 0;
    let j = values.length - 1;
    const dropped: Record<number, CellTone> = {};
    const view = (extra: Record<number, CellTone> = {}, sum?: number) => ({
      trees: [treeView("BST", tree, {
        tones: { ...Object.fromEntries(Object.keys(dropped).map((x) => [ids[Number(x)], "muted" as CellTone])), ...Object.fromEntries(Object.entries(extra).map(([x, t]) => [ids[Number(x)], t])) },
        pointers: i < j ? tagsAt({ i: ids[i], j: ids[j] }, { j: "tertiary" }) : {},
      })],
      arrays: [{ name: "values (in-order)", values, tones: { ...dropped, ...extra }, pointers: i < j ? tagsAt({ i, j }, { j: "tertiary" }) : {} }],
      vars: { k, ...(sum === undefined ? {} : { sum }) },
    });

    r.step(lineOf(code, "inorder(root);"), `The in-order walk lists the values sorted: ${values.join(", ")}. Now look for two that add up to ${k} from both ends.`, view());
    while (i < j) {
      const sum = values[i] + values[j];
      if (sum === k) {
        r.step(lineOf(code, "if (sum === k) return true;"), `${values[i]} + ${values[j]} = ${k}: found a pair — **true**.`, { ...view({ [i]: "success", [j]: "success" }, sum), done: true });
        return r.frames;
      }
      if (sum < k) {
        r.step(lineOf(code, "if (sum < k) i++;"), `${values[i]} + ${values[j]} = ${sum} < ${k}. Even the biggest partner is too small for ${values[i]}, so drop it: i moves right.`, view({ [i]: "tertiary", [j]: "primary" }, sum));
        dropped[i] = "muted";
        i++;
      } else {
        r.step(lineOf(code, "else j--;"), `${values[i]} + ${values[j]} = ${sum} > ${k}. Even the smallest partner is too big for ${values[j]}, so drop it: j moves left.`, view({ [i]: "primary", [j]: "tertiary" }, sum));
        dropped[j] = "muted";
        j--;
      }
    }
    r.step(lineOf(code, "return false;"), `The pointers met: no two different nodes add up to ${k} — **false**. O(n) time, O(n) space for the list.`, { ...view(), done: true });
    return r.frames;
  },
};

export default program;
