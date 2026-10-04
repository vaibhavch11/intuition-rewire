import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function sum(node) {
  if (node === null) return 0;          // an empty tree adds nothing
  const left = sum(node.left);          // ask the left subtree for its total
  const right = sum(node.right);        // ask the right subtree for its total
  return node.val + left + right;       // combine: me + both answers
}`;

const program: Program = {
  title: "Recursion on a tree: ask both subtrees",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 9 }],
  examples: [
    { label: "Example", input: { root: [5, 3, 8, 1, 4] } },
    { label: "Lopsided", input: { root: [1, 2, null, 3, null, 4] } },
    { label: "Seven nodes", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const frames: string[] = [];
    const finished: number[] = [];
    const captions: Record<number, string> = {};

    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, { tones: { ...toneIds(finished, "done"), ...tones }, captions, pointers: at === null ? {} : tagsAt({ node: at }) })],
      stacks: [{ name: "call stack", values: frames, topLabel: "running" }],
    });

    const walk = (id: number): number => {
      const n = node(id);
      frames.push(`sum(${n.value})`);
      const kids = [n.left, n.right].filter((c) => c !== null).length;
      r.step(3, `**sum(${n.value})** starts. It doesn't add anything up itself yet — it first asks its ${kids === 0 ? "two empty subtrees (each answers 0)" : kids === 1 ? "child subtree, and an empty one that answers 0" : "left and right subtrees"} for their totals.`, {
        ...view(id, { [id]: "primary" }),
        vars: { node: n.value as number },
      });
      const left = n.left === null ? 0 : walk(n.left);
      const right = n.right === null ? 0 : walk(n.right);
      const total = (n.value as number) + left + right;
      captions[id] = `= ${total}`;
      finished.push(id);
      r.step(5, `Both answers are back: **${n.value} + ${left} + ${right} = ${total}**. sum(${n.value}) returns ${total} to ${frames.length > 1 ? frames[frames.length - 2] : "the caller"} and its frame is popped.`, {
        ...view(id, { [id]: "success" }),
        vars: { node: n.value as number, left, right, returns: total },
      });
      frames.pop();
      return total;
    };

    r.step(1, `A tree is a root with two smaller trees hanging off it. So **sum(tree) = root + sum(left subtree) + sum(right subtree)**, and an empty tree sums to 0.`, {
      ...view(null),
      vars: {},
    });
    const total = walk(tree.root!);
    r.step(5, `The root's answer is the whole tree's sum: **${total}**. Every node was visited once — **O(n) time** — and the call stack never held more frames than the tree is tall — **O(h) space**.`, {
      ...view(null),
      vars: { sum: total },
      done: true,
    });
    return r.frames;
  },
};

export default program;
