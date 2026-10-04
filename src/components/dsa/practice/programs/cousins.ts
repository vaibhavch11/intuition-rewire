import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function isCousins(root, x, y) {
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;
    let foundX = false, foundY = false;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      if (node.val === x) foundX = true;
      if (node.val === y) foundY = true;
      if (node.left && node.right) {         // are x and y this node's two children?
        const a = node.left.val, b = node.right.val;
        if ((a === x && b === y) || (a === y && b === x)) return false;   // siblings
      }
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    if (foundX && foundY) return true;         // same level, different parents
    if (foundX || foundY) return false;        // only one of them on this level
  }
  return false;
}`;

const program: Program = {
  title: "Cousins in a binary tree (level by level)",
  code,
  fields: [
    { key: "root", label: "tree, unique values (level order)", kind: "tree", maxLength: 11 },
    { key: "x", label: "x", kind: "number" },
    { key: "y", label: "y", kind: "number" },
  ],
  examples: [
    { label: "Cousins", input: { root: [1, 2, 3, null, 4, null, 5], x: 5, y: 4 } },
    { label: "Siblings", input: { root: [1, 2, 3, 4, 5], x: 4, y: 5 } },
    { label: "Different levels", input: { root: [1, 2, 3, 4], x: 4, y: 3 } },
  ],
  check(input) {
    const vs = (input.root as (number | null)[]).filter((v): v is number => v !== null);
    if (vs.length === 0) return "Enter at least the root value.";
    if (new Set(vs).size !== vs.length) return "Every value in the tree must be different.";
    if (!vs.includes(input.x as number)) return `x = ${input.x} isn't in the tree.`;
    if (!vs.includes(input.y as number)) return `y = ${input.y} isn't in the tree.`;
    if (input.x === input.y) return "x and y must be different values.";
    return null;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const x = input.x as number;
    const y = input.y as number;
    const r = recorder();
    const val = (id: number) => node(id).value as number;
    const xId = tree.nodes.find((n) => n.value === x)!.id;
    const yId = tree.nodes.find((n) => n.value === y)!.id;
    const done: number[] = [];

    const view = (queue: number[], at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, {
        tones: { ...toneIds(done, "done"), [xId]: "tertiary", [yId]: "tertiary", ...tones },
        pointers: tagsAt({ x: xId, y: yId, ...(at !== null && at !== xId && at !== yId ? { node: at } : {}) }, { x: "tertiary", y: "tertiary" }),
      })],
      arrays: [{ name: "queue", values: queue.map(val) }],
    });

    r.step(2, `Cousins are on the **same level** but have **different parents**. Breadth-first search walks one level at a time, so it can stop at the first level where x or y shows up.`, {
      ...view([tree.root!], null),
      vars: { x, y },
    });

    const queue = [tree.root!];
    let level = 0;
    while (queue.length > 0) {
      const size = queue.length;
      let foundX = false;
      let foundY = false;
      for (let i = 0; i < size; i++) {
        const id = queue.shift()!;
        done.push(id);
        if (val(id) === x) foundX = true;
        if (val(id) === y) foundY = true;
        const n = node(id);
        if (n.left !== null && n.right !== null) {
          const a = val(n.left);
          const b = val(n.right);
          if ((a === x && b === y) || (a === y && b === x)) {
            r.step(12, `${val(id)}'s two children are **${a}** and **${b}** — that's x and y. They share a parent, so they're **siblings, not cousins**: false.`, {
              ...view(queue, id, { [id]: "write" }),
              vars: { level, result: "false" },
              done: true,
            });
            return r.frames;
          }
        }
        if (n.left !== null) queue.push(n.left);
        if (n.right !== null) queue.push(n.right);
        r.step(7, `Level ${level}: visit ${val(id)}${val(id) === x ? " — that's **x**" : val(id) === y ? " — that's **y**" : ""}.`, {
          ...view(queue, id, { [id]: "primary" }),
          vars: { level, foundX: String(foundX), foundY: String(foundY) },
        });
      }
      if (foundX && foundY) {
        r.step(17, `Both x and y are on level ${level}, and they weren't found as one node's two children: **cousins — true**.`, {
          ...view(queue, null, { [xId]: "success", [yId]: "success" }),
          vars: { level, result: "true" },
          done: true,
        });
        return r.frames;
      }
      if (foundX || foundY) {
        r.step(18, `Only ${foundX ? "x" : "y"} is on level ${level} — the other is deeper, so they can't be on the same level: **false**. Stop without visiting the rest of the tree.`, {
          ...view(queue, null),
          vars: { level, result: "false" },
          done: true,
        });
        return r.frames;
      }
      level++;
    }
    return r.frames;
  },
};

export default program;
