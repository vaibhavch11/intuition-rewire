import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function sumOfLeftLeaves(root) {
  function dfs(node, isLeft) {
    if (node === null) return 0;
    if (node.left === null && node.right === null) {
      return isLeft ? node.val : 0;        // only LEFT leaves count
    }
    return dfs(node.left, true) + dfs(node.right, false);
  }
  return dfs(root, false);                 // the root is nobody's left child
}`;

const program: Program = {
  title: "Sum of left leaves (pass down which side you are)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 11 }],
  examples: [
    { label: "Example", input: { root: [3, 9, 20, null, null, 15, 7] } },
    { label: "Mixed", input: { root: [1, 2, 3, 4, 5, null, 6, null, null, 7] } },
    { label: "Only a root", input: { root: [1] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const counted: number[] = [];
    const skipped: number[] = [];
    const captions: Record<number, string> = {};
    let total = 0;

    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, { tones: { ...toneIds(skipped, "muted"), ...toneIds(counted, "success"), ...tones }, captions, pointers: at === null ? {} : tagsAt({ node: at }) })],
    });

    r.step(9, `A **left leaf** is a leaf that is somebody's **left** child. A leaf can't tell which side it hangs on by itself — so each call passes down **isLeft**.`, {
      ...view(null),
      vars: { sum: 0 },
    });

    const dfs = (id: number, isLeft: boolean) => {
      const n = node(id);
      const v = n.value as number;
      captions[id] = id === tree.root ? "root" : isLeft ? "left" : "right";
      if (n.left === null && n.right === null) {
        if (isLeft) {
          total += v;
          counted.push(id);
          r.step(5, `${v} is a leaf, and it arrived with isLeft = **true**: add it. Sum = **${total}**.`, {
            ...view(id, { [id]: "write" }),
            vars: { isLeft: "true", sum: total },
          });
        } else {
          skipped.push(id);
          r.step(5, `${v} is a leaf, but it is a ${id === tree.root ? "root" : "right child"} (isLeft = false): it doesn't count.`, {
            ...view(id),
            vars: { isLeft: "false", sum: total },
          });
        }
        return;
      }
      r.step(7, `${v} isn't a leaf. Its left child gets isLeft = **true**, its right child isLeft = **false**.`, {
        ...view(id, { [id]: "primary" }),
        vars: { isLeft: String(isLeft), sum: total },
      });
      if (n.left !== null) dfs(n.left, true);
      if (n.right !== null) dfs(n.right, false);
    };
    dfs(tree.root!, false);

    r.step(9, `Sum of left leaves = **${total}**${counted.length ? ` (${counted.map((id) => node(id).value).join(" + ")})` : " — there are none"}. One visit per node: **O(n) time, O(h) space**.`, {
      ...view(null),
      vars: { sum: total },
      done: true,
    });
    return r.frames;
  },
};

export default program;
