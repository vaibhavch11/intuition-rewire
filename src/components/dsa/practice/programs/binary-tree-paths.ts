import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function binaryTreePaths(root) {
  const paths = [];
  const path = [];                         // values from the root down to here
  function dfs(node) {
    if (node === null) return;
    path.push(node.val);
    if (node.left === null && node.right === null) {
      paths.push(path.join("->"));         // a leaf: record the whole path
    } else {
      dfs(node.left);
      dfs(node.right);
    }
    path.pop();                            // backtrack: leave this node
  }
  dfs(root);
  return paths;
}`;

const program: Program = {
  title: "Binary tree paths (one shared path, backtracking)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 10 }],
  examples: [
    { label: "Example", input: { root: [1, 2, 3, null, 5] } },
    { label: "Four leaves", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "Single node", input: { root: [1] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const path: number[] = [];
    const pathIds: number[] = [];
    const paths: string[] = [];
    const leaves: number[] = [];

    const view = (at: number | null, tones: Record<number, CellTone> = {}, fresh = false) => ({
      trees: [treeView("tree", tree, { tones: { ...toneIds(leaves, "done"), ...toneIds(pathIds, "primary"), ...tones }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      arrays: [
        { name: "path", values: path },
        { name: "paths", values: paths, tones: fresh ? { [paths.length - 1]: "write" as CellTone } : {} },
      ],
    });

    r.step(3, `Walk down the tree keeping **one shared path** of the values from the root to the current node. At a leaf, the path is complete — copy it out. On the way back up, remove the node again.`, {
      ...view(null),
      vars: {},
    });

    const dfs = (id: number) => {
      const n = node(id);
      const v = n.value as number;
      path.push(v);
      pathIds.push(id);
      if (n.left === null && n.right === null) {
        paths.push(path.join("->"));
        leaves.push(id);
        r.step(8, `${v} is a **leaf**: the path ${path.join(" → ")} is complete. Record "${path.join("->")}".`, {
          ...view(id, { [id]: "success" }, true),
          vars: { node: v },
        });
      } else {
        r.step(6, `Step onto ${v}: path = [${path.join(", ")}]. It isn't a leaf, so keep going down.`, {
          ...view(id, { [id]: "write" }),
          vars: { node: v },
        });
        if (n.left !== null) dfs(n.left);
        if (n.right !== null) dfs(n.right);
      }
      path.pop();
      pathIds.pop();
      r.step(13, `Done with ${v}: pop it off the path${path.length ? ` (back to [${path.join(", ")}])` : ""}. The same array is reused for every branch.`, {
        ...view(id),
        vars: { node: v },
      });
    };
    dfs(tree.root!);

    r.step(16, `${paths.length} path${paths.length === 1 ? "" : "s"}: ${paths.map((p) => `"${p}"`).join(", ")}. Each node is pushed and popped once, and strings are only built at leaves.`, {
      ...view(null),
      vars: { paths: paths.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
