import { buildTree, tagsAt, toneIds, treeView } from "../structures";
import { recorder, type CellTone, type Program, type TreeNodeView } from "../types";

const code = `function mergeTrees(a, b) {
  if (a === null) return b;             // only b has a node here: reuse b's subtree
  if (b === null) return a;             // only a has one: keep a's subtree
  a.val += b.val;                       // both do: add b into a
  a.left = mergeTrees(a.left, b.left);
  a.right = mergeTrees(a.right, b.right);
  return a;
}`;

const B = 100; // b's node ids start here, so the merged tree can hold nodes from both

const program: Program = {
  title: "Merge two binary trees (reuse the nodes)",
  code,
  fields: [
    { key: "a", label: "tree a (level order)", kind: "tree", maxLength: 8 },
    { key: "b", label: "tree b (level order)", kind: "tree", maxLength: 8 },
  ],
  examples: [
    { label: "Example", input: { a: [1, 3, 2, 5], b: [2, 1, 3, null, 4, null, 7] } },
    { label: "Disjoint sides", input: { a: [1, 2], b: [1, null, 3] } },
    { label: "Same shape", input: { a: [1, 2, 3], b: [10, 20, 30] } },
  ],
  run(input) {
    const ta = buildTree(input.a as (number | null)[]);
    const tb = buildTree(input.b as (number | null)[]);
    const all = new Map<number, TreeNodeView>();
    for (const n of ta.nodes) all.set(n.id, { ...n });
    for (const n of tb.nodes) all.set(n.id + B, { ...n, id: n.id + B, left: n.left === null ? null : n.left + B, right: n.right === null ? null : n.right + B });
    const original = new Map([...all].map(([id, n]) => [id, { ...n }]));
    const bRoot = tb.root === null ? null : tb.root + B;
    const r = recorder();
    let root = ta.root;
    const added: number[] = [];
    const adopted: number[] = [];
    const visitedB: number[] = [];

    const reachable = (id: number | null, map: Map<number, TreeNodeView>): TreeNodeView[] => {
      if (id === null) return [];
      const n = map.get(id)!;
      return [{ ...n }, ...reachable(n.left, map), ...reachable(n.right, map)];
    };
    const subtreeIds = (id: number | null): number[] => reachable(id, original).map((n) => n.id);
    const view = (pa: number | null, pb: number | null, tones: Record<number, CellTone> = {}) => ({
      trees: [
        treeView("a (becomes the answer)", { nodes: reachable(root, all), root }, {
          tones: { ...toneIds(added, "done"), ...toneIds(adopted, "tertiary"), ...tones },
          pointers: pa === null ? {} : tagsAt({ a: pa }),
        }),
        treeView("b", { nodes: reachable(bRoot, original), root: bRoot }, {
          tones: { ...toneIds(visitedB, "done"), ...toneIds(adopted, "tertiary"), ...tones },
          pointers: pb === null ? {} : tagsAt({ b: pb }, { b: "tertiary" }),
        }),
      ],
    });

    r.step(1, `Walk both trees **together**, position by position. Where both have a node, add b's value into a's. Where only one has a node, that whole subtree can be **reused as it is**.`, {
      ...view(root, bRoot),
      vars: {},
    });

    const merge = (pa: number | null, pb: number | null): number | null => {
      if (pa === null) {
        if (pb !== null) {
          adopted.push(...subtreeIds(pb));
          r.step(2, `a has nothing here, b has ${original.get(pb)!.value}. Return b's node — its **whole subtree** (${subtreeIds(pb).length} node${subtreeIds(pb).length === 1 ? "" : "s"}) is attached to a without visiting it.`, {
            ...view(null, pb, { [pb]: "write" }),
            vars: {},
          });
        }
        return pb;
      }
      if (pb === null) {
        r.step(3, `b has nothing here, so a's node ${all.get(pa)!.value} and everything under it stay exactly as they are.`, {
          ...view(pa, null, { [pa]: "success" }),
          vars: {},
        });
        return pa;
      }
      const na = all.get(pa)!;
      const before = na.value as number;
      const add = original.get(pb)!.value as number;
      na.value = before + add;
      added.push(pa);
      visitedB.push(pb);
      r.step(4, `Both trees have a node here: **${before} + ${add} = ${na.value}**, written into a's node.`, {
        ...view(pa, pb, { [pa]: "write", [pb]: "primary" }),
        vars: { a: before, b: add, sum: na.value as number },
      });
      na.left = merge(na.left, original.get(pb)!.left);
      na.right = merge(na.right, original.get(pb)!.right);
      return pa;
    };
    root = merge(root, bRoot);

    r.step(7, `Merged. Only the **${added.length} overlapping** position${added.length === 1 ? " was" : "s were"} visited; ${adopted.length ? `${adopted.length} node${adopted.length === 1 ? " was" : "s were"} reused from b` : "nothing needed reusing"}. Time is O(overlap) — at most O(min(n₁, n₂)) — and no new nodes were created.`, {
      ...view(null, null),
      vars: { visited: added.length, reused: adopted.length },
      done: true,
    });
    return r.frames;
  },
};

export default program;
