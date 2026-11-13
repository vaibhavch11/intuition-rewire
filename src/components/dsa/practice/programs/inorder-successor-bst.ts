import { lineOf } from "../graphs";
import { checkBst, subtreeTones } from "../bst";
import { buildTree, indexTree, tagsAt, treeView } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function inorderSuccessor(root, p) {
  let answer = null;
  let node = root;
  while (node !== null) {
    if (node.val > p.val) {
      answer = node;                       // bigger than p: a candidate, look for a smaller one
      node = node.left;
    } else {
      node = node.right;                   // not bigger: the successor is to the right
    }
  }
  return answer;
}`;

const program: Program = {
  title: "In-order successor in a BST (one walk down)",
  code,
  fields: [
    { key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 },
    { key: "p", label: "p (a value in the tree)", kind: "number" },
  ],
  examples: [
    { label: "p = 14", input: { root: [20, 8, 22, 4, 12, null, null, null, null, 10, 14], p: 14 } },
    { label: "p = 8", input: { root: [20, 8, 22, 4, 12, null, null, null, null, 10, 14], p: 8 } },
    { label: "Largest (none)", input: { root: [5, 3, 6, 2, 4, null, null, 1], p: 6 } },
  ],
  check(input) {
    const values = input.root as (number | null)[];
    const bad = checkBst(values);
    if (bad) return bad;
    return values.includes(input.p as number) ? null : `p = ${input.p} isn't in the tree.`;
  },
  run(input) {
    const tree = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(tree);
    const p = input.p as number;
    const pId = tree.nodes.find((n) => n.value === p)!.id;
    const r = recorder();
    let answer: number | null = null;
    const skipped: Record<number, CellTone> = {};
    const view = (at: number | null, extra: Record<number, CellTone> = {}) => ({
      trees: [treeView("BST", tree, {
        tones: { ...skipped, [pId]: "primary", ...(answer === null ? {} : { [answer]: "success" }), ...extra },
        pointers: tagsAt({ node: at, p: pId, answer }, { p: "secondary", answer: "tertiary" }),
      })],
      vars: { "p.val": p, answer: answer === null ? "null" : node(answer).value },
    });

    r.step(lineOf(code, "let node = root;"), `Find the smallest value bigger than ${p}. Walk down from the root: every node bigger than ${p} is a candidate.`, view(tree.root));
    let at: number | null = tree.root;
    while (at !== null) {
      const n = node(at);
      const v = n.value as number;
      if (v > p) {
        answer = at;
        Object.assign(skipped, subtreeTones(tree, n.right, "muted"));
        r.step(lineOf(code, "answer = node;"), `${v} > ${p}: the best candidate so far. Everything right of it is even bigger, so go **left** for something closer to ${p}.`, view(at, { [at]: "write" }));
        at = n.left;
      } else {
        Object.assign(skipped, subtreeTones(tree, n.left, "muted"));
        if (at !== pId) skipped[at] = "muted";
        r.step(lineOf(code, "node = node.right;"), `${v} ${v === p ? "=" : "<"} ${p}: not bigger, so neither it nor its left side can be the answer. Go **right**.`, view(at, { [at]: "write" }));
        at = n.right;
      }
    }
    r.step(lineOf(code, "return answer;"), answer === null
      ? `Fell off the tree with no candidate: ${p} is the largest value, so the successor is **null**.`
      : `Fell off the tree. The last candidate, **${node(answer).value}**, is the in-order successor of ${p}. One path: O(h) time, O(1) space.`, { ...view(null), done: true });
    return r.frames;
  },
};

export default program;
