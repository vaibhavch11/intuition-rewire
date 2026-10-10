import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function pathSum(root, target) {
  const result = [];
  const path = [];
  function dfs(node, remaining) {
    if (node === null) return;
    path.push(node.val);
    remaining -= node.val;
    if (node.left === null && node.right === null && remaining === 0) {
      result.push([...path]);              // a leaf that uses up the target exactly
    }
    dfs(node.left, remaining);
    dfs(node.right, remaining);
    path.pop();                            // backtrack
  }
  dfs(root, target);
  return result;
}`;

const program: Program = {
  title: "Path Sum I & II (root-to-leaf paths that add up)",
  code,
  fields: [
    { key: "root", label: "tree (level order)", kind: "tree", maxLength: 12 },
    { key: "target", label: "targetSum", kind: "number", min: -999, max: 999 },
  ],
  examples: [
    { label: "Two paths", input: { root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], target: 22 } },
    { label: "None", input: { root: [1, 2, 3], target: 5 } },
    { label: "Negatives", input: { root: [-2, null, -3], target: -5 } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const target = input.target as number;
    const r = recorder();
    const path: number[] = [];
    const pathIds: number[] = [];
    const result: string[] = [];
    const captions: Record<number, string> = {};
    const hits: number[] = [];

    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree (caption = remaining)", tree, { tones: { ...toneIds(hits, "success"), ...toneIds(pathIds, "primary"), ...tones }, captions, pointers: at === null ? {} : tagsAt({ node: at }) })],
      arrays: [
        { name: "path", values: path },
        { name: "matching paths", values: result },
      ],
    });

    r.step(4, `Walk down from the root carrying **remaining** = how much of ${target} is still needed. Each node subtracts its value. A **leaf** reached with remaining = 0 ends a matching path.`, {
      ...view(null),
      vars: { target },
    });

    const dfs = (id: number, remaining: number) => {
      const n = node(id);
      const v = n.value as number;
      path.push(v);
      pathIds.push(id);
      remaining -= v;
      captions[id] = String(remaining);
      const leaf = n.left === null && n.right === null;
      if (leaf && remaining === 0) {
        result.push(`[${path.join(",")}]`);
        hits.push(...pathIds);
        r.step(9, `${v} is a leaf and remaining = **0**: the path [${path.join(", ")}] adds up to ${target}. Copy it into the answer.`, {
          ...view(id, { [id]: "write" }),
          vars: { remaining },
        });
      } else {
        r.step(7, leaf
          ? `${v} is a leaf, but remaining = ${remaining}, not 0. This path doesn't match.`
          : `Step onto ${v}: remaining = ${remaining + v} − ${v} = **${remaining}**.`, {
          ...view(id, { [id]: leaf ? "muted" : "write" }),
          vars: { remaining },
        });
      }
      if (n.left !== null) dfs(n.left, remaining);
      if (n.right !== null) dfs(n.right, remaining);
      path.pop();
      pathIds.pop();
    };
    dfs(tree.root!, target);

    r.step(16, result.length
      ? `${result.length} matching path${result.length === 1 ? "" : "s"}: ${result.join(" and ")}. **Path Sum I** only asks whether one exists — here, **true**.`
      : `No root-to-leaf path adds up to ${target}. **Path Sum I** would answer **false**.`, {
      ...view(null),
      vars: { target, found: result.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
