import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function dfs(root) {
  const order = [], stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();               // the NEWEST node first
    order.push(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);   // left on top: dive down the left first
  }
  return order;
}

function bfs(root) {
  const order = [], queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();             // the OLDEST node first
    order.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return order;
}`;

const program: Program = {
  title: "Depth-first vs breadth-first",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 9 }],
  examples: [
    { label: "Example", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "Deep left", input: { root: [1, 2, 3, 4, null, null, null, 5] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const val = (id: number) => node(id).value as number;

    // ---- depth-first, with a stack
    const stack = [tree.root!];
    let order: number[] = [];
    const dfsOrder: number[] = [];
    const dfsView = (at: number | undefined, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, { tones: { ...toneIds(order, "done"), ...toneIds(stack, "tertiary"), ...tones }, pointers: at === undefined ? {} : tagsAt({ visit: at }) })],
      stacks: [{ name: "stack (DFS)", values: stack.map(val) }],
      arrays: [{ name: "DFS order", values: dfsOrder }],
    });
    r.step(2, `**Depth-first search** keeps the nodes still to visit on a **stack**. Popping the newest one first means it keeps going **deeper** before it comes back.`, {
      ...dfsView(undefined),
      vars: {},
    });
    while (stack.length > 0) {
      const id = stack.pop()!;
      order.push(id);
      dfsOrder.push(val(id));
      const n = node(id);
      if (n.right !== null) stack.push(n.right);
      if (n.left !== null) stack.push(n.left);
      r.step(4, `Pop ${val(id)} — the most recently pushed node — and visit it.${n.left !== null || n.right !== null ? ` Push its children (right first, so the left one is on top).` : ` It's a leaf; the next pop backs up to an earlier branch.`}`, {
        ...dfsView(id, { [id]: "primary" }),
        vars: {},
      });
    }

    // ---- breadth-first, with a queue
    order = [];
    const queue = [tree.root!];
    const bfsOrder: number[] = [];
    const bfsView = (at: number | undefined, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, { tones: { ...toneIds(order, "done"), ...toneIds(queue, "tertiary"), ...tones }, pointers: at === undefined ? {} : tagsAt({ visit: at }) })],
      arrays: [
        { name: "queue (BFS)", values: queue.map(val) },
        { name: "DFS order", values: dfsOrder },
        { name: "BFS order", values: bfsOrder },
      ],
    });
    r.step(13, `**Breadth-first search** is the same loop with a **queue** instead. Taking the oldest node first means it finishes each **level** before going deeper.`, {
      ...bfsView(undefined),
      vars: {},
    });
    while (queue.length > 0) {
      const id = queue.shift()!;
      order.push(id);
      bfsOrder.push(val(id));
      const n = node(id);
      if (n.left !== null) queue.push(n.left);
      if (n.right !== null) queue.push(n.right);
      r.step(15, `Take ${val(id)} from the front — the oldest waiting node — and visit it.${n.left !== null || n.right !== null ? " Its children join the back of the queue, behind everyone already waiting." : ""}`, {
        ...bfsView(id, { [id]: "primary" }),
        vars: {},
      });
    }

    r.step(20, `Same nodes, same loop, different order. **DFS (stack)**: ${dfsOrder.join(", ")} — down one branch at a time. **BFS (queue)**: ${bfsOrder.join(", ")} — level by level. Both are O(n).`, {
      trees: [treeView("tree", tree, { tones: toneIds(order, "done") })],
      arrays: [
        { name: "DFS order", values: dfsOrder },
        { name: "BFS order", values: bfsOrder },
      ],
      vars: {},
      done: true,
    });
    return r.frames;
  },
};

export default program;
