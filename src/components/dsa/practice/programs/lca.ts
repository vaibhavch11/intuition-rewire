import { buildTree, indexTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Input, type Program } from "../types";

const code = `function lowestCommonAncestor(node, p, q) {
  if (node === null || node === p || node === q) return node;
  const left = lowestCommonAncestor(node.left, p, q);
  const right = lowestCommonAncestor(node.right, p, q);
  if (left !== null && right !== null) return node;   // p and q on different sides
  return left !== null ? left : right;                // pass up whatever was found
}`;

const values = (input: Input) => input.root as (number | null)[];

const program: Program = {
  title: "Lowest common ancestor (one recursive pass)",
  code,
  fields: [
    { key: "root", label: "tree, unique values (level order)", kind: "tree", maxLength: 12 },
    { key: "p", label: "p", kind: "number" },
    { key: "q", label: "q", kind: "number" },
  ],
  examples: [
    { label: "Different sides", input: { root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 1 } },
    { label: "Ancestor of itself", input: { root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 4 } },
    { label: "Deep pair", input: { root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 7, q: 6 } },
  ],
  check(input) {
    const vs = values(input).filter((v): v is number => v !== null);
    if (vs.length === 0) return "Enter at least the root value.";
    if (new Set(vs).size !== vs.length) return "Every value in the tree must be different, so p and q name exactly one node each.";
    if (!vs.includes(input.p as number)) return `p = ${input.p} isn't in the tree.`;
    if (!vs.includes(input.q as number)) return `q = ${input.q} isn't in the tree.`;
    if (input.p === input.q) return "p and q must be two different nodes.";
    return null;
  },
  run(input) {
    const tree = buildTree(values(input));
    const { node } = indexTree(tree);
    const r = recorder();
    const idOf = (v: number) => tree.nodes.find((n) => n.value === v)!.id;
    const p = idOf(input.p as number);
    const q = idOf(input.q as number);
    const captions: Record<number, string> = {};
    const finished: number[] = [];
    const frames: string[] = [];
    const v = (id: number | null) => (id === null ? "null" : String(node(id).value));

    const view = (at: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [treeView("tree", tree, {
        tones: { ...toneIds(finished, "done"), [p]: "tertiary", [q]: "tertiary", ...tones },
        captions,
        pointers: tagsAt({ p, q, ...(at !== null && at !== p && at !== q ? { node: at } : {}) }, { p: "tertiary", q: "tertiary" }),
      })],
      stacks: [{ name: "call stack", values: frames, topLabel: "running" }],
    });

    r.step(1, `Each call reports up **what it found** in its subtree: p, q, the answer, or nothing (null). The first node that hears "found something" from **both** sides is the lowest common ancestor.`, {
      ...view(null),
      vars: { p: v(p), q: v(q) },
    });

    const lca = (id: number | null): number | null => {
      if (id === null) return null;
      frames.push(`lca(${v(id)})`);
      if (id === p || id === q) {
        captions[id] = `found ${v(id)}`;
        finished.push(id);
        r.step(2, `**${v(id)} is ${id === p ? "p" : "q"}** itself: return it. No need to look below — if the other one is down there, this node is the answer anyway.`, {
          ...view(id, { [id]: "write" }),
          vars: { returns: v(id) },
        });
        frames.pop();
        return id;
      }
      r.step(3, `lca(${v(id)}): neither p nor q. Ask the left and right subtrees.`, { ...view(id, { [id]: "primary" }), vars: {} });
      const left = lca(node(id).left);
      const right = lca(node(id).right);
      finished.push(id);
      let result: number | null;
      if (left !== null && right !== null) {
        result = id;
        captions[id] = "LCA";
        r.step(5, `${v(id)} hears **${v(left)}** from the left and **${v(right)}** from the right: p and q are on different sides, so **${v(id)} is their lowest common ancestor**. Return it.`, {
          ...view(id, { [id]: "success" }),
          vars: { left: v(left), right: v(right), returns: v(id) },
        });
      } else {
        result = left !== null ? left : right;
        captions[id] = result === null ? "null" : `↑ ${v(result)}`;
        r.step(6, result === null
          ? `Nothing found under ${v(id)}: return null.`
          : `Only one side found something (${v(result)}). Pass it up unchanged.`, {
          ...view(id, { [id]: result === null ? "muted" : "primary" }),
          vars: { left: v(left), right: v(right), returns: v(result) },
        });
      }
      frames.pop();
      return result;
    };
    const answer = lca(tree.root);

    r.step(1, `The lowest common ancestor of ${v(p)} and ${v(q)} is **${v(answer)}**. One pass over the tree: **O(n) time, O(h) space**.`, {
      ...view(null, answer === null ? {} : { [answer]: "success" }),
      vars: { answer: v(answer) },
      done: true,
    });
    return r.frames;
  },
};

export default program;
