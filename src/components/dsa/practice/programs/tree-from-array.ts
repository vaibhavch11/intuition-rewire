import { buildTree, treeView, type Tree } from "../structures";
import { pointersAt, recorder, type CellTone, type Program, type TreeNodeView } from "../types";

const code = `function buildTree(values) {
  if (values.length === 0 || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];                   // nodes still waiting for children
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift();
    if (values[i] !== null) {
      node.left = new TreeNode(values[i]);
      queue.push(node.left);
    }
    i++;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}`;

const program: Program = {
  title: "Build a tree from LeetCode's array format",
  code,
  fields: [{ key: "values", label: "level order (null = no child)", kind: "tree", maxLength: 9 }],
  examples: [
    { label: "Full tree", input: { values: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "With gaps", input: { values: [3, 9, 20, null, null, 15, 7] } },
    { label: "Lopsided", input: { values: [1, null, 2, null, 3] } },
  ],
  check: (input) => ((input.values as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const values = input.values as (number | null)[];
    const full: Tree = buildTree(values);
    const r = recorder();
    const created = new Set<number>();
    const slots = values.map((v) => (v === null ? "null" : v));

    // The tree as built so far: only created nodes, and only links to created nodes.
    const partial = (): Tree => ({
      root: created.size ? 0 : null,
      nodes: full.nodes
        .filter((n) => created.has(n.id))
        .map((n): TreeNodeView => ({
          ...n,
          left: n.left !== null && created.has(n.left) ? n.left : null,
          right: n.right !== null && created.has(n.right) ? n.right : null,
        })),
    });
    const view = (i: number | undefined, queue: number[], tones: Record<number, CellTone> = {}, slotTones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", partial(), { tones })],
      arrays: [
        {
          name: "values",
          values: slots,
          tones: { ...Object.fromEntries(slots.map((_, k) => [k, (i !== undefined && k < i ? "done" : "idle") as CellTone])), ...slotTones },
          pointers: pointersAt(slots.length, { i }),
        },
        { name: "queue (waiting for children)", values: queue.map((id) => full.nodes[id].value) },
      ],
    });

    // Node ids follow level order of the non-null values, which is also creation order.
    let nextId = 0;
    created.add(nextId++);
    const queue = [0];
    r.step(3, `values[0] = **${values[0]}** becomes the root. It joins the queue: its children are the next values in the array.`, {
      ...view(1, queue, { 0: "write" }, { 0: "success" }),
      vars: { i: 1 },
    });

    let i = 1;
    while (queue.length > 0 && i < values.length) {
      const parent = queue.shift()!;
      const pv = full.nodes[parent].value;
      for (const side of ["left", "right"] as const) {
        if (i >= values.length) break;
        const v = values[i];
        if (v === null) {
          r.step(side === "left" ? 8 : 13, `values[${i}] is **null**: ${pv} has no ${side} child. Skip the slot.`, {
            ...view(i, queue, { [parent]: "primary" }, { [i]: "muted" }),
            vars: { i, node: pv },
          });
        } else {
          const id = nextId++;
          created.add(id);
          queue.push(id);
          r.step(side === "left" ? 10 : 15, `values[${i}] = **${v}** becomes the **${side} child** of ${pv}, and joins the back of the queue to get its own children later.`, {
            ...view(i, queue, { [parent]: "primary", [id]: "write" }, { [i]: "success" }),
            vars: { i, node: pv },
          });
        }
        i++;
      }
    }

    r.step(20, `All ${values.length} slots are used. The array lists the tree **level by level, left to right**, with null wherever a child is missing — the format every LeetCode tree question uses.`, {
      ...view(values.length, []),
      vars: { nodes: created.size },
      done: true,
    });
    return r.frames;
  },
};

export default program;
