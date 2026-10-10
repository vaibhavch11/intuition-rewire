import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function countPathSums(root, target) {
  const seen = new Map([[0, 1]]);          // prefix sum -> times seen on the current path
  let count = 0;
  function dfs(node, sum) {
    if (node === null) return;
    sum += node.val;                        // root-to-here sum
    count += seen.get(sum - target) ?? 0;   // paths ending here that add up to target
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
    dfs(node.left, sum);
    dfs(node.right, sum);
    seen.set(sum, seen.get(sum) - 1);       // leaving: this prefix is off the path
  }
  dfs(root, 0);
  return count;
}`;

const program: Program = {
  title: "Path Sum III (prefix sums on the current path)",
  code,
  fields: [
    { key: "root", label: "tree (level order)", kind: "tree", maxLength: 12 },
    { key: "target", label: "targetSum", kind: "number", min: -999, max: 999 },
  ],
  examples: [
    { label: "Example", input: { root: [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1], target: 8 } },
    { label: "Zeros", input: { root: [0, 1, 1], target: 1 } },
    { label: "Straight line", input: { root: [1, null, 2, null, 3], target: 3 } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const target = input.target as number;
    const r = recorder();
    const seen = new Map<number, number>([[0, 1]]);
    const pathIds: number[] = [];
    const captions: Record<number, string> = {};
    let count = 0;
    const found: string[] = [];

    const seenList = () => [...seen].filter(([, c]) => c > 0).map(([s, c]) => `${s}${c > 1 ? ` ×${c}` : ""}`);
    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree (caption = prefix sum)", tree, { tones: { ...toneIds(pathIds, "primary"), ...tones }, captions, pointers: at === null ? {} : tagsAt({ node: at }) })],
      arrays: [
        { name: "prefix sums on the current path", values: seenList() },
        { name: "paths found (end at)", values: found },
      ],
    });

    r.step(2, `A downward path from u to v adds up to **sum(root→v) − sum(root→above u)**. So at each node, count how many **earlier prefix sums on the current path** equal sum − ${target}. The 0 stands for "start at the root".`, {
      ...view(null),
      vars: { target, count },
    });

    const dfs = (id: number, sum: number) => {
      const n = node(id);
      const v = n.value as number;
      sum += v;
      pathIds.push(id);
      captions[id] = String(sum);
      const want = sum - target;
      const matches = seen.get(want) ?? 0;
      count += matches;
      if (matches) found.push(`${v}${matches > 1 ? ` ×${matches}` : ""}`);
      r.step(7, matches
        ? `At ${v}, prefix sum = ${sum}. We need an earlier prefix of ${sum} − ${target} = **${want}**, and it's on the path ${matches === 1 ? "once" : `${matches} times`}: **${matches} path${matches === 1 ? "" : "s"} ending at ${v}** add${matches === 1 ? "s" : ""} up to ${target}.`
        : `At ${v}, prefix sum = ${sum}. Is ${sum} − ${target} = ${want} an earlier prefix on this path? No.`, {
        ...view(id, { [id]: matches ? "success" : "write" }),
        vars: { sum, need: want, count },
      });
      seen.set(sum, (seen.get(sum) ?? 0) + 1);
      if (n.left !== null) dfs(n.left, sum);
      if (n.right !== null) dfs(n.right, sum);
      seen.set(sum, seen.get(sum)! - 1);
      pathIds.pop();
      if (n.left !== null || n.right !== null) {
        r.step(11, `Leaving ${v}: its prefix ${sum} is no longer on the path, so remove it — paths must go **downward**, never across branches.`, {
          ...view(id),
          vars: { sum, count },
        });
      }
    };
    dfs(tree.root!, 0);

    r.step(14, `**${count}** downward path${count === 1 ? "" : "s"} add${count === 1 ? "s" : ""} up to ${target}. Each node does O(1) map work: **O(n) time, O(h) map entries** on the path at a time.`, {
      ...view(null),
      vars: { target, count },
      done: true,
    });
    return r.frames;
  },
};

export default program;
