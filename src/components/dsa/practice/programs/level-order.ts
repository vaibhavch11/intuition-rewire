import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function levelOrder(root) {
  if (root === null) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;             // everything in the queue is one level
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`;

const LEVEL_TONES: CellTone[] = ["primary", "tertiary", "success", "write"];

const program: Program = {
  title: "Level order traversal (one level per round)",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 10 }],
  examples: [
    { label: "Example", input: { root: [3, 9, 20, null, null, 15, 7] } },
    { label: "Full", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "Uneven", input: { root: [1, 2, 3, 4, null, null, 5, 6] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    const result: number[][] = [];
    const levelOf = new Map<number, number>();
    const val = (id: number) => node(id).value as number;

    const view = (queue: number[], at: number | null, level: number[] = [], tones: Record<number, CellTone> = {}) => ({
      trees: [
        treeView("tree", tree, {
          tones: { ...toneIds(levelOf.keys(), "done"), ...toneIds(queue, "muted"), ...tones },
          pointers: at === null ? {} : tagsAt({ node: at }),
        }),
      ],
      arrays: [
        { name: "queue", values: queue.map(val) },
        { name: "current level", values: level },
      ],
      grids: result.length ? [{ name: "result", values: result.map((row) => [...row]) }] : [],
    });

    const queue = [tree.root!];
    r.step(4, `Start with the root in the queue. The trick: at the start of each round, **everything in the queue is exactly one level** — so remember its size before adding children.`, {
      ...view(queue, null),
      vars: {},
    });
    let depth = 0;
    while (queue.length > 0) {
      const size = queue.length;
      const level: number[] = [];
      r.step(6, `Round ${depth + 1}: the queue holds **${size}** node${size === 1 ? "" : "s"} — that's level ${depth}. Take exactly ${size}, no more.`, {
        ...view(queue, null, level, toneIds(queue, LEVEL_TONES[depth % LEVEL_TONES.length])),
        vars: { level: depth, size },
      });
      for (let i = 0; i < size; i++) {
        const id = queue.shift()!;
        level.push(val(id));
        levelOf.set(id, depth);
        const n = node(id);
        if (n.left !== null) queue.push(n.left);
        if (n.right !== null) queue.push(n.right);
        const kids = [n.left, n.right].filter((c) => c !== null).map((c) => val(c!));
        r.step(10, `Take ${val(id)} (${i + 1} of ${size}) into this level.${kids.length ? ` Its children ${kids.join(" and ")} join the back of the queue — they belong to the next round.` : ""}`, {
          ...view(queue, id, level, { [id]: LEVEL_TONES[depth % LEVEL_TONES.length] }),
          vars: { level: depth, size, i },
        });
      }
      result.push(level);
      r.step(14, `Level ${depth} is complete: **[${level.join(", ")}]**.`, {
        ...view(queue, null, []),
        vars: { level: depth },
      });
      depth++;
    }

    r.step(16, `The queue is empty after ${depth} round${depth === 1 ? "" : "s"}: **${JSON.stringify(result)}**. Every node entered and left the queue once: **O(n) time**, and the queue never held more than one level plus the next: **O(w) space**.`, {
      ...view([], null),
      vars: { levels: depth },
      done: true,
    });
    return r.frames;
  },
};

export default program;
