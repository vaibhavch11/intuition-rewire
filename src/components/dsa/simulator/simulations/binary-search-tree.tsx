import {
  NodeDiagram,
  type DiagramEdge,
  type DiagramNode,
  type NodeTone,
} from "../visuals";
import type { Simulation, SimulationStep } from "../types";

interface BstNode {
  left?: number;
  right?: number;
  address: string;
}

const KEY = 7;
const KEY_ADDRESS = "0x2f88";
const ROOT = 8;
const INITIAL: Record<number, BstNode> = {
  8: { left: 3, right: 10, address: "0x5a10" },
  3: { left: 1, right: 6, address: "0x2e40" },
  10: { right: 14, address: "0x7c08" },
  1: { address: "0x1b30" },
  6: { left: 4, address: "0x4e18" },
  14: { address: "0x6f20" },
  4: { address: "0x3a58" },
};

const copyTree = (tree: Record<number, BstNode>) =>
  Object.fromEntries(
    Object.entries(tree).map(([k, node]) => [k, { ...node }])
  ) as Record<number, BstNode>;

function subtree(tree: Record<number, BstNode>, v?: number): number[] {
  if (v === undefined) return [];
  return [v, ...subtree(tree, tree[v].left), ...subtree(tree, tree[v].right)];
}

/** Lays nodes out by in-order rank (x) and depth (y), including the key to insert. */
function layout() {
  const tree = copyTree(INITIAL);
  let parent = ROOT;
  for (;;) {
    const side = KEY < parent ? "left" : "right";
    const child = tree[parent][side];
    if (child === undefined) {
      tree[parent][side] = KEY;
      tree[KEY] = { address: KEY_ADDRESS };
      break;
    }
    parent = child;
  }

  const positions: Record<number, { x: number; y: number }> = {};
  let rank = 0;
  const walk = (v: number | undefined, depth: number) => {
    if (v === undefined) return;
    walk(tree[v].left, depth + 1);
    positions[v] = { x: 30 + rank++ * 57, y: 40 + depth * 58 };
    walk(tree[v].right, depth + 1);
  };
  walk(ROOT, 0);
  return positions;
}

const POSITIONS = layout();
const WIDTH = Math.max(...Object.values(POSITIONS).map((p) => p.x)) + 30;
const HEIGHT = Math.max(...Object.values(POSITIONS).map((p) => p.y)) + 36;

interface InsertState {
  tree: Record<number, BstNode>;
  curr: number | null;
  path: number[];
  skipped: number[];
  /** Parent whose empty child slot will receive the key. */
  slotOf: number | null;
  inserted: boolean;
}

function TreeView({ state }: { state: InsertState }) {
  const { tree, curr, path, skipped, slotOf, inserted } = state;
  const skippedSet = new Set(skipped);
  const pathSet = new Set(path);

  const nodes: DiagramNode[] = Object.keys(tree).map((key) => {
    const v = Number(key);
    let tone: NodeTone = "idle";
    if (skippedSet.has(v)) tone = "muted";
    if (pathSet.has(v)) tone = "done";
    if (v === curr) tone = "primary";
    if (inserted && v === KEY) tone = "success";
    return {
      id: key,
      ...POSITIONS[v],
      label: key,
      tone,
      caption: tree[v].address,
      tags:
        v === curr
          ? [{ label: "curr", tone: "primary" }]
          : inserted && v === KEY
            ? [{ label: "new", tone: "secondary" }]
            : undefined,
    };
  });

  if (slotOf !== null) {
    nodes.push({
      id: "slot",
      ...POSITIONS[KEY],
      label: String(KEY),
      tone: "idle",
      ghost: true,
      caption: `${slotOf}.${KEY < slotOf ? "left" : "right"} = null`,
    });
  }

  const walked = new Set([...path, ...(curr === null ? [] : [curr])]);
  const edges: DiagramEdge[] = Object.entries(tree).flatMap(([key, node]) =>
    [node.left, node.right]
      .filter((child): child is number => child !== undefined)
      .map((child) => ({
        from: key,
        to: String(child),
        tone:
          walked.has(Number(key)) && walked.has(child)
            ? "active"
            : skippedSet.has(child)
              ? "muted"
              : inserted && child === KEY
                ? "write"
                : "idle",
      }))
  );
  if (slotOf !== null) {
    edges.push({ from: String(slotOf), to: "slot", dashed: true });
  }

  return (
    <NodeDiagram width={WIDTH} height={HEIGHT} nodes={nodes} edges={edges} />
  );
}

const set = (values: number[]) => `{${values.join(", ")}}`;

function trace(): SimulationStep[] {
  const tree = copyTree(INITIAL);
  const steps: SimulationStep[] = [];
  const path: number[] = [];
  const skipped: number[] = [];
  let curr = ROOT;

  for (;;) {
    const node = tree[curr];
    const goLeft = KEY < curr;
    const side = goLeft ? "left" : "right";
    const child = node[side];
    const skipping = subtree(tree, goLeft ? node.right : node.left);
    const depth = path.length;

    const intro =
      depth === 0
        ? `Every node holds a value plus two child addresses. Start at the root, ${curr} (${node.address}).`
        : `curr = ${curr} (${node.address}).`;
    const decision = `${KEY} ${goLeft ? "<" : ">"} ${curr}, so go ${side}`;
    const skipNote = skipping.length
      ? ` — the subtree ${set(skipping)} can't hold ${KEY} and is never read`
      : "";
    const landing =
      child === undefined
        ? `. ${curr}.${side} is null: that empty slot is exactly where ${KEY} belongs${skipNote}.`
        : `${skipNote}.`;

    steps.push({
      visual: (
        <TreeView
          state={{
            tree: copyTree(tree),
            curr,
            path: [...path],
            skipped: [...skipped],
            slotOf: child === undefined ? curr : null,
            inserted: false,
          }}
        />
      ),
      registers: [
        { label: "[REGISTER] key:", value: String(KEY), tone: "primary" },
        {
          label: "[REGISTER] curr:",
          value: `${curr} @${node.address}`,
          tone: "tertiary",
        },
        { label: "Compare:", value: `${KEY} ${goLeft ? "<" : ">"} ${curr} → ${side}` },
        { label: "Depth:", value: String(depth) },
      ],
      note: `${intro} ${decision}${landing}`,
    });

    skipped.push(...skipping);
    path.push(curr);
    if (child === undefined) {
      node[side] = KEY;
      tree[KEY] = { address: KEY_ADDRESS };
      break;
    }
    curr = child;
  }

  const parent = path[path.length - 1];
  const side = KEY < parent ? "left" : "right";
  const untouched = Object.keys(INITIAL).length - path.length;
  steps.push({
    visual: (
      <TreeView
        state={{
          tree: copyTree(tree),
          curr: null,
          path: [...path],
          skipped: [...skipped],
          slotOf: null,
          inserted: true,
        }}
      />
    ),
    registers: [
      { label: "[REGISTER] key:", value: String(KEY), tone: "primary" },
      {
        label: "[REGISTER] curr:",
        value: `${KEY} @${KEY_ADDRESS} (new)`,
        tone: "tertiary",
      },
      { label: "Compare:", value: `${parent}.${side} = ${KEY_ADDRESS}` },
      { label: "Depth:", value: String(path.length) },
    ],
    note: `Allocate a node for ${KEY} at ${KEY_ADDRESS} and store that address in \`${parent}.${side}\`. ${path.length} comparisons for a ${Object.keys(INITIAL).length}-node tree: the cost is the tree's height, O(h), and ${untouched} nodes were never touched.`,
    status: `INSERTED AT DEPTH ${path.length}`,
  });

  return steps;
}

export const binarySearchTreeSimulation: Simulation = {
  algorithm: "BST Insert",
  lead: "The ordering invariant lets every comparison throw away an entire subtree.",
  input: {
    label: "Insert key:",
    value: `key = ${KEY}`,
    rule: "At each node compare `key` with the node's value: smaller goes left, larger goes right. The first null child you reach is where the new node is linked in.",
  },
  buffer: `heap_nodes[${Object.keys(INITIAL).length}] · ordered`,
  badge: "O(h) Insert",
  output: { label: "Result", value: "7 linked as 6.right (depth 3)" },
  steps: trace(),
};
