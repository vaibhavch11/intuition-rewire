import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function traverse(node, pre, ino, post) {
  if (node === null) return;
  pre.push(node.val);                     // 1st visit: before the children
  traverse(node.left, pre, ino, post);
  ino.push(node.val);                     // 2nd visit: between them
  traverse(node.right, pre, ino, post);
  post.push(node.val);                    // 3rd visit: after both
}`;

const program: Program = {
  title: "Preorder, inorder and postorder in one walk",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 9 }],
  examples: [
    { label: "Example", input: { root: [1, 2, 3, 4, 5, null, 6] } },
    { label: "Balanced", input: { root: [4, 2, 6, 1, 3, 5, 7] } },
    { label: "Lopsided", input: { root: [1, null, 2, 3] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const pre: number[] = [];
    const ino: number[] = [];
    const post: number[] = [];
    const frames: string[] = [];
    const visits = new Map<number, number>();
    const captions: Record<number, string> = {};

    const view = (at: number | null, fresh: "pre" | "in" | "post" | null, tones: Record<number, CellTone> = {}) => ({
      trees: [
        treeView("tree", tree, {
          tones: { ...toneIds([...visits.keys()].filter((id) => visits.get(id) === 3), "done"), ...tones },
          captions,
          pointers: at === null ? {} : tagsAt({ node: at }),
        }),
      ],
      stacks: [{ name: "call stack", values: frames, topLabel: "running" }],
      arrays: [
        { name: "preorder (root, left, right)", values: pre, tones: fresh === "pre" ? { [pre.length - 1]: "write" as CellTone } : {} },
        { name: "inorder (left, root, right)", values: ino, tones: fresh === "in" ? { [ino.length - 1]: "write" as CellTone } : {} },
        { name: "postorder (left, right, root)", values: post, tones: fresh === "post" ? { [post.length - 1]: "write" as CellTone } : {} },
      ],
    });
    const mark = (id: number, k: number) => {
      visits.set(id, k);
      captions[id] = ["", "1st", "2nd", "3rd"][k];
    };

    r.step(2, `One recursive walk passes every node **three times**: on the way down, between its two subtrees, and on the way back up. Writing the value at each of those moments gives the three classic orders.`, {
      ...view(null, null),
      vars: {},
    });

    const walk = (id: number) => {
      const n = node(id);
      const v = n.value as number;
      frames.push(`traverse(${v})`);
      mark(id, 1);
      pre.push(v);
      r.step(3, `Arrive at **${v}** for the first time: write it to **preorder**, before either subtree.`, { ...view(id, "pre", { [id]: "primary" }), vars: { node: v } });
      if (n.left !== null) walk(n.left);
      mark(id, 2);
      ino.push(v);
      r.step(5, `${n.left === null ? `${v} has no left subtree, so we're` : `Back at ${v} after its left subtree:`} between the two sides — write it to **inorder**.`, { ...view(id, "in", { [id]: "tertiary" }), vars: { node: v } });
      if (n.right !== null) walk(n.right);
      mark(id, 3);
      post.push(v);
      r.step(7, `${n.right === null ? `${v} has no right subtree, so both sides are` : `Back at ${v} after its right subtree: both sides are`} finished — write it to **postorder** and return.`, { ...view(id, "post", { [id]: "success" }), vars: { node: v } });
      frames.pop();
    };
    walk(tree.root!);

    r.step(7, `Done. **Preorder** ${pre.join(", ")} · **Inorder** ${ino.join(", ")} · **Postorder** ${post.join(", ")}. Each node was visited a constant number of times: **O(n) time, O(h) call stack**.`, {
      ...view(null, null),
      vars: {},
      done: true,
    });
    return r.frames;
  },
};

export default program;
