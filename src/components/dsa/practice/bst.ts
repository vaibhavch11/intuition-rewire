import { buildTree, indexTree, type Tree } from "./structures";
import type { CellTone, TreeNodeView } from "./types";

/**
 * Helpers for the binary search tree simulators. Trees are the simulator's
 * own `Tree` (nodes with ids, root id); a node removed from the tree simply
 * stops being reachable from the root, so it isn't drawn.
 */

/** True when every left subtree holds smaller values and every right subtree bigger ones. */
export function isBstTree(tree: Tree): boolean {
  const { node } = indexTree(tree);
  const ok = (id: number | null, lo: number, hi: number): boolean => {
    if (id === null) return true;
    const v = node(id).value as number;
    return v > lo && v < hi && ok(node(id).left, lo, v) && ok(node(id).right, v, hi);
  };
  return ok(tree.root, -Infinity, Infinity);
}

/** The input check every BST simulator shares: a non-empty tree that follows the BST rule. */
export function checkBst(values: (number | null)[], allowEmpty = false): string | null {
  if (!allowEmpty && (values.length === 0 || values[0] === null)) return "Enter at least the root value.";
  return isBstTree(buildTree(values))
    ? null
    : "That isn't a binary search tree: every left subtree must hold smaller values and every right subtree bigger ones.";
}

/** Adds a detached node and returns its id. */
export function addNode(tree: Tree, value: number): number {
  const id = tree.nodes.length;
  tree.nodes.push({ id, value, left: null, right: null } as TreeNodeView);
  return id;
}

/** Ids reachable from `id`, in in-order (smallest value first). */
export function inorderIds(tree: Tree, id: number | null = tree.root): number[] {
  const { node } = indexTree(tree);
  const out: number[] = [];
  const walk = (x: number | null) => {
    if (x === null) return;
    walk(node(x).left);
    out.push(x);
    walk(node(x).right);
  };
  walk(id);
  return out;
}

/** Tones for every node reachable from `id`. */
export function subtreeTones(tree: Tree, id: number | null, tone: CellTone): Record<number, CellTone> {
  return Object.fromEntries(inorderIds(tree, id).map((x) => [x, tone]));
}

/** "1 node" / "3 nodes". */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
