import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function averageOfLevels(root) {
  const averages = [];
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;             // one whole level is in the queue
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      sum += node.val;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    averages.push(sum / size);
  }
  return averages;
}`;

/** Averages can be long decimals; five places are plenty to read. */
const show = (x: number) => Number(x.toFixed(5));

const program: Program = {
  title: "Average of levels (BFS with a running sum)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 10 }],
  examples: [
    { label: "Example", input: { root: [3, 9, 20, null, null, 15, 7] } },
    { label: "Full", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "Thirds", input: { root: [2, 1, 1, 0, 0, 1] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const averages: number[] = [];
    const done: number[] = [];
    const val = (id: number) => node(id).value as number;

    const view = (queue: number[], at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, { tones: { ...toneIds(done, "done"), ...tones }, pointers: at === null ? {} : tagsAt({ node: at }) })],
      arrays: [
        { name: "queue", values: queue.map(val) },
        { name: "averages", values: averages.map(show) },
      ],
    });

    const queue = [tree.root!];
    r.step(3, `Breadth-first search hands us the tree **one level at a time**. For each level, add the values up while taking them out of the queue, then divide by how many there were.`, {
      ...view(queue, null),
      vars: {},
    });
    let depth = 0;
    while (queue.length > 0) {
      const size = queue.length;
      const levelIds = [...queue];
      let sum = 0;
      r.step(5, `Level ${depth}: the queue holds **${size}** node${size === 1 ? "" : "s"}. Start a fresh sum.`, {
        ...view(queue, null, toneIds(levelIds, "tertiary")),
        vars: { level: depth, size, sum },
      });
      for (let i = 0; i < size; i++) {
        const id = queue.shift()!;
        sum += val(id);
        done.push(id);
        const n = node(id);
        if (n.left !== null) queue.push(n.left);
        if (n.right !== null) queue.push(n.right);
        r.step(9, `Add ${val(id)}: sum = **${sum}**.`, {
          ...view(queue, id, { ...toneIds(levelIds.slice(i + 1), "tertiary"), [id]: "primary" }),
          vars: { level: depth, size, sum },
        });
      }
      averages.push(sum / size);
      r.step(13, `Level ${depth} average = ${sum} / ${size} = **${show(sum / size)}**.`, {
        ...view(queue, null, toneIds(levelIds, "success")),
        vars: { level: depth, sum, size, average: show(sum / size) },
      });
      depth++;
    }

    r.step(15, `Averages: **[${averages.map(show).join(", ")}]**. One pass, and only a running sum per level — no list of the level's values is ever stored: **O(n) time, O(w) space** for the queue.`, {
      ...view([], null),
      vars: {},
      done: true,
    });
    return r.frames;
  },
};

export default program;
