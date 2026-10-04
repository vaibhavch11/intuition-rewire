import { buildTree, indexTree, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function classify(root) {
  let full = true, complete = true;
  let gap = false;                    // passed an empty child slot yet?
  let count = 0;
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    count++;
    if ((node.left === null) !== (node.right === null)) full = false;   // exactly one child
    for (const child of [node.left, node.right]) {
      if (child === null) {
        gap = true;
      } else {
        if (gap) complete = false;    // a node after a gap
        queue.push(child);
      }
    }
  }
  const perfect = complete && ((count + 1) & count) === 0;   // count is 2^k - 1
  return [full, complete, perfect];
}`;

const yes = (b: boolean) => (b ? "yes" : "no");

const program: Program = {
  title: "Full, complete or perfect?",
  code,
  fields: [{ key: "root", label: "tree (level order)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Perfect", input: { root: [1, 2, 3, 4, 5, 6, 7] } },
    { label: "Complete", input: { root: [1, 2, 3, 4, 5, 6] } },
    { label: "Full, not complete", input: { root: [1, 2, 3, null, null, 4, 5] } },
    { label: "Neither", input: { root: [1, 2, 3, 4, null, null, 5] } },
  ],
  check: (input) => ((input.root as (number | null)[]).length === 0 ? "Enter at least the root value." : null),
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const r = recorder();
    let full = true;
    let complete = true;
    let gap = false;
    let count = 0;
    const visited: number[] = [];
    const captions: Record<number, string> = {};

    const view = (queue: number[], tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, { tones: { ...toneIds(visited, "done"), ...toneIds(queue, "tertiary"), ...tones }, captions })],
      arrays: [{ name: "queue", values: queue.map((id) => node(id).value) }],
    });
    const vars = () => ({ count, full: yes(full), complete: yes(complete), gap: yes(gap) });

    r.step(5, `Walk the tree level by level (a queue). Three questions: does any node have **exactly one** child (not full)? Does a node ever appear **after a gap** in level order (not complete)? Is it complete with **2^k − 1** nodes (perfect)?`, {
      ...view([tree.root!]),
      vars: vars(),
    });

    const queue = [tree.root!];
    while (queue.length > 0) {
      const id = queue.shift()!;
      count++;
      captions[id] = `#${count}`;
      const n = node(id);
      const oneChild = (n.left === null) !== (n.right === null);
      if (oneChild) full = false;
      const notes: string[] = [];
      if (oneChild) notes.push(`it has **exactly one child**, so the tree is **not full**`);
      for (const child of [n.left, n.right]) {
        if (child === null) {
          gap = true;
        } else {
          if (gap && complete) {
            complete = false;
            notes.push(`child ${node(child).value} comes **after an empty slot**, so the tree is **not complete**`);
          }
          queue.push(child);
        }
      }
      visited.push(id);
      r.step(oneChild ? 9 : 14, `Visit ${n.value} (#${count} in level order)${notes.length ? `: ${notes.join("; ")}.` : ` — ${n.left === null && n.right === null ? "a leaf" : "two children"}, nothing broken.`}`, {
        ...view(queue, { [id]: oneChild || notes.length ? "write" : "primary" }),
        vars: vars(),
      });
    }

    const perfect = complete && ((count + 1) & count) === 0;
    r.step(20, `${count} nodes. **Full: ${yes(full)}. Complete: ${yes(complete)}. Perfect: ${yes(perfect)}**${perfect ? ` — every level is completely filled (${count} = 2^${Math.log2(count + 1)} − 1)` : complete ? ` — complete, but ${count} isn't 2^k − 1, so the last level isn't full` : ""}.`, {
      ...view([]),
      vars: { count, full: yes(full), complete: yes(complete), perfect: yes(perfect) },
      done: true,
    });
    return r.frames;
  },
};

export default program;
