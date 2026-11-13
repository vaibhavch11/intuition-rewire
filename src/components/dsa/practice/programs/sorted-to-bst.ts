import { lineOf } from "../graphs";
import { addNode } from "../bst";
import { tagsAt, treeView, type Tree } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function sortedArrayToBST(nums) {
  const build = (lo, hi) => {              // the values nums[lo..hi]
    if (lo > hi) return null;
    const mid = Math.floor((lo + hi) / 2);
    const node = new TreeNode(nums[mid]);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  };
  return build(0, nums.length - 1);
}`;

const program: Program = {
  title: "Sorted array to a balanced BST (middle = root)",
  code,
  fields: [{ key: "nums", label: "nums (sorted, distinct)", kind: "array", maxLength: 12 }],
  examples: [
    { label: "Example", input: { nums: [-10, -3, 0, 5, 9] } },
    { label: "1 to 7", input: { nums: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "Even length", input: { nums: [2, 4, 6, 8, 10, 12] } },
  ],
  check(input) {
    const nums = input.nums as number[];
    if (nums.length === 0) return "Enter at least one value.";
    for (let i = 1; i < nums.length; i++) if (nums[i] <= nums[i - 1]) return "The values must be sorted and distinct (strictly increasing).";
    return null;
  },
  run(input) {
    const nums = input.nums as number[];
    const tree: Tree = { nodes: [], root: null };
    const r = recorder();
    const calls: string[] = [];
    const placed: Record<number, CellTone> = {};
    const view = (lo: number, hi: number, mid: number | null, at: number | null) => {
      const tones: Record<number, CellTone> = { ...placed };
      for (let i = lo; i <= hi; i++) if (tones[i] === undefined) tones[i] = "primary";
      if (mid !== null) tones[mid] = "write";
      return {
        arrays: [{ name: "nums", values: nums, tones, pointers: tagsAt(lo <= hi ? { lo, hi, ...(mid === null ? {} : { mid }) } : {}, { mid: "tertiary" }) }],
        trees: [treeView("BST being built", tree, { tones: at === null ? {} : { [at]: "write" }, pointers: at === null ? {} : tagsAt({ node: at }) })],
        stacks: [{ name: "call stack", values: [...calls] }],
      };
    };

    r.step(lineOf(code, "return build(0, nums.length - 1);"), `Build from the whole array. Each call's middle value becomes a node, so both sides get about half the values — the tree stays balanced.`, view(0, nums.length - 1, null, null));
    const build = (lo: number, hi: number): number | null => {
      if (lo > hi) return null;
      calls.push(`build(${lo}, ${hi})`);
      const mid = Math.floor((lo + hi) / 2);
      const id = addNode(tree, nums[mid]);
      if (tree.root === null) tree.root = id;
      placed[mid] = "done";
      r.step(lineOf(code, "const node = new TreeNode(nums[mid]);"), `Range [${lo}..${hi}]: the middle is index ${mid}, so **${nums[mid]}** is this subtree's root. ${lo <= mid - 1 ? `Left half: ${nums.slice(lo, mid).join(", ")}.` : "No left half."} ${mid + 1 <= hi ? `Right half: ${nums.slice(mid + 1, hi + 1).join(", ")}.` : "No right half."}`, view(lo, hi, mid, id));
      tree.nodes[id].left = build(lo, mid - 1);
      tree.nodes[id].right = build(mid + 1, hi);
      calls.pop();
      return id;
    };
    build(0, nums.length - 1);
    const height = (id: number | null): number => (id === null ? 0 : 1 + Math.max(height(tree.nodes[id].left), height(tree.nodes[id].right)));
    r.step(lineOf(code, "return build(0, nums.length - 1);"), `Done: root **${nums[Math.floor((nums.length - 1) / 2)]}**, height ${height(tree.root)} for ${nums.length} value${nums.length === 1 ? "" : "s"} — the smallest height possible. Each value became a node once: O(n) time, O(log n) stack.`, { ...view(0, -1, null, null), done: true });
    return r.frames;
  },
};

export default program;
