import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function topView(root) {
  const first = new Map();                   // column -> first value seen there
  let minCol = 0, maxCol = 0;
  const queue = [[root, 0]];
  while (queue.length > 0) {
    const [node, col] = queue.shift();
    if (!first.has(col)) first.set(col, node.val);   // BFS meets the highest node first
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
    if (node.left) queue.push([node.left, col - 1]);
    if (node.right) queue.push([node.right, col + 1]);
  }
  const view = [];
  for (let c = minCol; c <= maxCol; c++) view.push(first.get(c));
  return view;
}`;

const program: Program = {
  title: "Top view (first node of each column, breadth-first)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 11 }],
  examples: [
    { label: "Example", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "Hidden node", input: { root: [1, 2, 3, null, 4, null, null, null, 5, null, 6] } },
    { label: "Long left arm", input: { root: [10, 20, 30, 40, 60, 90, 100] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const val = (id: number) => node(id).value as number;
    const captions: Record<number, string> = {};
    const first = new Map<number, number>(); // column -> node id
    const visited: number[] = [];
    let minCol = 0;
    let maxCol = 0;

    const columns = () => {
      const out: string[] = [];
      for (let c = minCol; c <= maxCol; c++) out.push(first.has(c) ? `${c}: ${val(first.get(c)!)}` : `${c}: ?`);
      return out;
    };
    const view = (queue: [number, number][], at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree (caption = column)", tree, {
        tones: { ...toneIds(visited, "muted"), ...toneIds([...first.values()], "success"), ...tones },
        captions,
        pointers: at === null ? {} : tagsAt({ node: at }),
      })],
      arrays: [
        { name: "queue (node, column)", values: queue.map(([id, c]) => `${val(id)}, ${c}`) },
        { name: "first seen in each column", values: columns() },
      ],
    });

    const queue: [number, number][] = [[tree.root!, 0]];
    captions[tree.root!] = "0";
    r.step(4, `Give the root column 0; a left child is one column to the left (−1), a right child one to the right (+1). Looking down from above, each column shows its **highest** node — and breadth-first search reaches higher nodes first.`, {
      ...view(queue, null),
      vars: {},
    });
    while (queue.length > 0) {
      const [id, col] = queue.shift()!;
      visited.push(id);
      const isFirst = !first.has(col);
      if (isFirst) first.set(col, id);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
      const n = node(id);
      if (n.left !== null) {
        queue.push([n.left, col - 1]);
        captions[n.left] = String(col - 1);
      }
      if (n.right !== null) {
        queue.push([n.right, col + 1]);
        captions[n.right] = String(col + 1);
      }
      r.step(7, isFirst
        ? `${val(id)} is the **first node in column ${col}**: it's visible from the top.`
        : `${val(id)} is in column ${col}, but ${val(first.get(col)!)} is already there and higher — ${val(id)} is hidden.`, {
        ...view(queue, id, { [id]: isFirst ? "write" : "muted" }),
        vars: { col, minCol, maxCol },
      });
    }

    const answer: number[] = [];
    for (let c = minCol; c <= maxCol; c++) answer.push(val(first.get(c)!));
    r.step(15, `Read the columns from ${minCol} to ${maxCol}: top view = **[${answer.join(", ")}]**. One pass, no sorting: **O(n) time, O(n) space**.`, {
      ...view([], null),
      vars: { minCol, maxCol },
      done: true,
    });
    return r.frames;
  },
};

export default program;
