import { buildTree, indexTree, tagsAt, toneIds, treeView, type Tree } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `function isSubtree(root, subRoot) {
  const a = serialize(root, []).join("");
  const b = serialize(subRoot, []).join("");
  return a.includes(b);
}

function serialize(node, out) {
  if (node === null) {
    out.push(",#");                       // mark every missing child
    return out;
  }
  out.push("," + node.val);               // the comma stops 2 from matching 12
  serialize(node.left, out);
  serialize(node.right, out);
  return out;
}`;

/** Preorder tokens with "#" for empty children, plus which node made each token. */
function tokens(tree: Tree): { text: string[]; owner: (number | null)[] } {
  const { node } = indexTree(tree);
  const text: string[] = [];
  const owner: (number | null)[] = [];
  const walk = (id: number | null) => {
    if (id === null) {
      text.push("#");
      owner.push(null);
      return;
    }
    text.push(String(node(id).value));
    owner.push(id);
    walk(node(id).left);
    walk(node(id).right);
  };
  walk(tree.root);
  return { text, owner };
}

const program: Program = {
  title: "Subtree of another tree (serialize and search)",
  code,
  fields: [
    { key: "root", label: "root (level order)", kind: "tree", maxLength: 9 },
    { key: "sub", label: "subRoot (level order)", kind: "tree", maxLength: 6 },
  ],
  examples: [
    { label: "Is a subtree", input: { root: [3, 4, 5, 1, 2], sub: [4, 1, 2] } },
    { label: "Extra node", input: { root: [3, 4, 5, 1, 2, null, null, null, null, 0], sub: [4, 1, 2] } },
    { label: "Leaf", input: { root: [1, 2, 3], sub: [3] } },
  ],
  check(input) {
    if ((input.root as (number | null)[]).length === 0) return "root: enter at least one value.";
    if ((input.sub as (number | null)[]).length === 0) return "subRoot: enter at least one value.";
    return null;
  },
  run(input) {
    const ta = buildTree(input.root as (number | null)[]);
    const tb = buildTree(input.sub as (number | null)[]);
    const A = tokens(ta);
    const Bt = tokens(tb);
    const r = recorder();
    const shownA: string[] = [];
    const shownB: string[] = [];

    const view = (tonesA: Record<number, CellTone> = {}, tonesB: Record<number, CellTone> = {}, cellsA: Record<number, CellTone> = {}, at?: number | null) => ({
      trees: [
        treeView("root", ta, { tones: tonesA, pointers: at === undefined || at === null ? {} : tagsAt({ node: at }) }),
        treeView("subRoot", tb, { tones: tonesB }),
      ],
      arrays: [
        { name: "serialize(root)", values: shownA, tones: cellsA },
        { name: "serialize(subRoot)", values: shownB },
      ],
    });

    r.step(2, `Turn each tree into a **list of tokens** in preorder, writing **#** for every missing child. The #s pin down the exact shape, so two trees match exactly when their token lists match.`, {
      ...view(),
      vars: {},
    });

    // Serialize root, one node (and its empty children) at a time.
    const seenA: number[] = [];
    for (let k = 0; k < A.text.length; k++) {
      shownA.push(A.text[k]);
      const id = A.owner[k];
      if (id !== null) {
        seenA.push(id);
        r.step(12, `Preorder reaches ${A.text[k]}: write it.`, { ...view(toneIds(seenA, "done"), {}, { [k]: "write" }, id), vars: {} });
      } else if (k === A.text.length - 1 || A.owner[k + 1] !== null) {
        r.step(9, `An empty child: write **#**.`, { ...view(toneIds(seenA, "done"), {}, { [k]: "muted" }), vars: {} });
      }
    }
    shownB.push(...Bt.text);
    r.step(3, `Do the same for subRoot: **${Bt.text.join(" ")}**.`, {
      ...view(toneIds(seenA, "done"), toneIds(tb.nodes.map((n) => n.id), "tertiary")),
      vars: {},
    });

    // Find the first place the subRoot tokens appear in a row.
    let at = -1;
    for (let s = 0; s + Bt.text.length <= A.text.length; s++) {
      if (Bt.text.every((t, j) => A.text[s + j] === t)) {
        at = s;
        break;
      }
    }
    if (at < 0) {
      r.step(4, `The sequence ${Bt.text.join(" ")} appears **nowhere** in root's sequence, so no node of root has exactly subRoot's values and shape: **false**.`, {
        ...view(toneIds(seenA, "muted"), toneIds(tb.nodes.map((n) => n.id), "tertiary")),
        vars: { result: "false" },
        done: true,
      });
      return r.frames;
    }
    const span = Object.fromEntries(Bt.text.map((_, j) => [at + j, "success" as CellTone]));
    const matchedNodes = A.owner.slice(at, at + Bt.text.length).filter((id): id is number => id !== null);
    r.step(4, `subRoot's tokens appear in root's sequence starting at position ${at} — that stretch is exactly the preorder of the subtree under **${A.text[at]}**: **true**. Serializing is O(m + n); the search is O(m · n) with a plain includes, or O(m + n) with KMP.`, {
      ...view(toneIds(matchedNodes, "success"), toneIds(tb.nodes.map((n) => n.id), "success"), span),
      vars: { result: "true", at },
      done: true,
    });
    return r.frames;
  },
};

export default program;
