import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function leftView(root) {
  const view = [];
  function dfs(node, depth) {
    if (node === null) return;
    if (depth === view.length) view.push(node.val);   // first node to reach this depth
    dfs(node.left, depth + 1);              // left first, so the leftmost gets there first
    dfs(node.right, depth + 1);
  }
  dfs(root, 0);
  return view;
}`;

const program: Program = {
  title: "Left view (first node to reach each depth)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 11 }],
  examples: [
    { label: "Example", input: { root: [1, 2, 3, 4, 5, 6, 7, null, 8] } },
    { label: "Right side pokes out", input: { root: [1, 2, 3, null, null, 4, 5, null, null, null, 6] } },
    { label: "Only right children", input: { root: [1, null, 2, null, 3] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const view: number[] = [];
    const seen: number[] = [];
    const visible: number[] = [];
    const captions: Record<number, string> = {};

    const show = (at: number | null, tones: Record<number, CellTone> = {}, fresh = false) => ({
      trees: [treeView("tree (caption = depth)", tree, {
        tones: { ...toneIds(seen, "muted"), ...toneIds(visible, "success"), ...tones },
        captions,
        pointers: at === null ? {} : tagsAt({ node: at }),
      })],
      arrays: [{ name: "left view (one value per depth)", values: view, tones: fresh ? { [view.length - 1]: "write" as CellTone } : {} }],
    });

    r.step(2, `From the left you see **one node per level**: the leftmost. A preorder walk that goes **left before right** reaches each depth through its leftmost node first — so record a node exactly when it is the first to reach a new depth.`, {
      ...show(null),
      vars: {},
    });

    const dfs = (id: number, depth: number) => {
      const n = node(id);
      const v = n.value as number;
      seen.push(id);
      captions[id] = `d${depth}`;
      if (depth === view.length) {
        view.push(v);
        visible.push(id);
        r.step(5, `${v} is the first node to reach depth **${depth}** (view has ${depth} value${depth === 1 ? "" : "s"}): it's visible from the left. Record it.`, {
          ...show(id, { [id]: "write" }, true),
          vars: { depth, "view.length": view.length - 1 },
        });
      } else {
        r.step(5, `${v} is at depth ${depth}, but depth ${depth} already has ${view[depth]}, which is further left. ${v} is hidden behind it.`, {
          ...show(id, { [id]: "primary" }),
          vars: { depth, "view.length": view.length },
        });
      }
      if (n.left !== null) dfs(n.left, depth + 1);
      if (n.right !== null) dfs(n.right, depth + 1);
    };
    dfs(tree.root!, 0);

    r.step(10, `Left view = **[${view.join(", ")}]**. One preorder pass and an O(h) call stack — no queue of a whole level needed.`, {
      ...show(null),
      vars: { depth: view.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
