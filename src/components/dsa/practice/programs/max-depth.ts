import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function maxDepth(node) {
  if (node === null) return 0;            // an empty tree has no levels
  const left = maxDepth(node.left);
  const right = maxDepth(node.right);
  return 1 + Math.max(left, right);       // this node, plus the deeper side
}`;

const program: Program = {
  title: "Maximum depth (ask both children, add one)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 10 }],
  examples: [
    { label: "Example", input: { root: [3, 9, 20, null, null, 15, 7] } },
    { label: "Lopsided", input: { root: [1, 2, null, 3, null, 4] } },
    { label: "Full", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
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

    r.step(1, `The depth of a tree is **1 (the root) + the depth of its deeper subtree**, and an empty tree has depth 0. Let every node ask its two children, then answer.`, {
      ...view(null),
      vars: {},
    });

    const depth = (id: number): number => {
      const n = node(id);
      frames.push(`maxDepth(${n.value})`);
      r.step(3, `**maxDepth(${n.value})** asks its subtrees first.`, { ...view(id, { [id]: "primary" }), vars: { node: n.value as number } });
      const left = n.left === null ? 0 : depth(n.left);
      const right = n.right === null ? 0 : depth(n.right);
      const answer = 1 + Math.max(left, right);
      captions[id] = `d=${answer}`;
      finished.push(id);
      r.step(5, `${n.value}: left says ${left}, right says ${right}. Answer **1 + max(${left}, ${right}) = ${answer}**.`, {
        ...view(id, { [id]: "success" }),
        vars: { node: n.value as number, left, right, returns: answer },
      });
      frames.pop();
      return answer;
    };
    const answer = depth(tree.root!);

    r.step(5, `The root answers for the whole tree: **maximum depth = ${answer}**. One visit per node: **O(n) time, O(h) space** for the call stack.`, {
      ...view(null),
      vars: { depth: answer },
      done: true,
    });
    return r.frames;
  },
};

export default program;
