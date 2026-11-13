import { lineOf } from "../graphs";
import { addNode, checkBst } from "../bst";
import { buildTree, indexTree, tagsAt, toneIds, treeView, type Tree } from "../structures";
import { recorder, type CellTone, type Program } from "../types";

const code = `class Codec {
  serialize(root) {
    const out = [];
    const preorder = (node) => {
      if (node === null) return;
      out.push(node.val);                  // node, then left, then right
      preorder(node.left);
      preorder(node.right);
    };
    preorder(root);
    return out.join(",");
  }

  deserialize(data) {
    const values = data === "" ? [] : data.split(",").map(Number);
    let i = 0;
    const build = (low, high) => {         // the next subtree: values between low and high
      if (i === values.length || values[i] < low || values[i] > high) return null;
      const node = new TreeNode(values[i++]);
      node.left = build(low, node.val);
      node.right = build(node.val, high);
      return node;
    };
    return build(-Infinity, Infinity);
  }
}`;

const show = (b: number) => (b === Infinity ? "inf" : b === -Infinity ? "-inf" : String(b));

const program: Program = {
  title: "Serialize a BST as pre-order, rebuild it with bounds",
  code,
  fields: [{ key: "root", label: "BST (level order)", kind: "tree", maxLength: 12 }],
  examples: [
    { label: "Example", input: { root: [8, 3, 10, 1, 6, null, 14] } },
    { label: "Small", input: { root: [2, 1, 3] } },
    { label: "Lopsided", input: { root: [10, 5, null, 2, 7, null, 3] } },
  ],
  check: (input) => checkBst(input.root as (number | null)[]),
  run(input) {
    const original = buildTree(input.root as (number | null)[]);
    const { node } = indexTree(original);
    const rebuilt: Tree = { nodes: [], root: null };
    const r = recorder();
    const tokens: number[] = [];
    const written: number[] = [];
    let i = -1;
    const calls: string[] = [];
    const view = (atOld: number | null, atNew: number | null) => ({
      trees: [
        treeView("original", original, { tones: { ...toneIds(written, "done"), ...(atOld === null ? {} : { [atOld]: "write" as CellTone }) }, pointers: atOld === null ? {} : tagsAt({ node: atOld }) }),
        treeView("rebuilt from the string", rebuilt, { tones: atNew === null ? {} : { [atNew]: "write" }, pointers: atNew === null ? {} : tagsAt({ node: atNew }) }),
      ],
      arrays: [{ name: "data", values: [...tokens], tones: Object.fromEntries(tokens.map((_, k) => [k, i < 0 ? (k === tokens.length - 1 ? "write" : "done") : k < i ? "done" : "idle"])) as Record<number, CellTone>, pointers: i >= 0 && i < tokens.length ? tagsAt({ i }) : {} }],
      stacks: [{ name: "call stack", values: [...calls] }],
    });

    r.step(lineOf(code, "preorder(root);"), "serialize: write the values in pre-order — each node before its left subtree, then its right subtree. No null markers.", view(original.root, null));
    const preorder = (id: number | null) => {
      if (id === null) return;
      tokens.push(node(id).value as number);
      written.push(id);
      r.step(lineOf(code, "out.push(node.val);"), `Write ${node(id).value}. The string so far: "${tokens.join(",")}".`, view(id, null));
      preorder(node(id).left);
      preorder(node(id).right);
    };
    preorder(original.root);
    const data = tokens.join(",");
    i = 0;
    r.step(lineOf(code, "return build(-Infinity, Infinity);"), `deserialize("${data}"): read the values left to right. build(low, high) makes the next subtree only from a value between low and high.`, view(null, null));
    const build = (low: number, high: number): number | null => {
      calls.push(`build(${show(low)}, ${show(high)})`);
      if (i === tokens.length || tokens[i] < low || tokens[i] > high) {
        calls.pop();
        return null;
      }
      const id = addNode(rebuilt, tokens[i]);
      if (rebuilt.root === null) rebuilt.root = id;
      i++;
      r.step(lineOf(code, "const node = new TreeNode(values[i++]);"), `${tokens[i - 1]} lies in (${show(low)}, ${show(high)}): it's the next node. Its left side takes values in (${show(low)}, ${tokens[i - 1]}), its right side values in (${tokens[i - 1]}, ${show(high)}).`, view(null, id));
      rebuilt.nodes[id].left = build(low, rebuilt.nodes[id].value as number);
      rebuilt.nodes[id].right = build(rebuilt.nodes[id].value as number, high);
      calls.pop();
      return id;
    };
    build(-Infinity, Infinity);
    r.step(lineOf(code, "return build(-Infinity, Infinity);"), `The string **${data}** rebuilt exactly the same tree: ${tokens.length} values and no markers, because the BST order says where each value goes. O(n) both ways.`, { ...view(null, null), done: true });
    return r.frames;
  },
};

export default program;
