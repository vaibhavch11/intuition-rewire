import {
  NodeDiagram,
  VisualLabel,
  type DiagramEdge,
  type DiagramNode,
  type NodeTone,
} from "../visuals";
import type { Simulation, SimulationStep } from "../types";

interface TreeNode {
  left?: string;
  right?: string;
  address: string;
  x: number;
  y: number;
}

const ROOT = "A";
const TREE: Record<string, TreeNode> = {
  A: { left: "B", right: "C", address: "0x51a0", x: 150, y: 36 },
  B: { left: "D", right: "E", address: "0x2c40", x: 80, y: 106 },
  C: { right: "F", address: "0x7e10", x: 220, y: 106 },
  D: { address: "0x1f08", x: 40, y: 176 },
  E: { address: "0x6b30", x: 120, y: 176 },
  F: { address: "0x3d58", x: 260, y: 176 },
};
const MAX_DEPTH = 3;

const EDGES = Object.entries(TREE).flatMap(([id, node]) =>
  [node.left, node.right]
    .filter((child): child is string => Boolean(child))
    .map((child) => ({ from: id, to: child }))
);

interface TraversalState {
  current: string | null;
  stack: string[];
  output: string[];
}

function TraversalView({ state }: { state: TraversalState }) {
  const { current, stack, output } = state;
  const visited = new Set(output);
  const onStack = new Set(stack);

  const nodes: DiagramNode[] = Object.entries(TREE).map(([id, node]) => {
    let tone: NodeTone = "idle";
    if (onStack.has(id)) tone = "tertiary";
    if (visited.has(id)) tone = "done";
    if (id === current) tone = "primary";
    return {
      id,
      x: node.x,
      y: node.y,
      label: id,
      tone,
      caption: node.address,
      tags: id === current ? [{ label: "visit", tone: "primary" }] : undefined,
    };
  });

  // The edges between stacked frames trace the path recursion took.
  const edges: DiagramEdge[] = EDGES.map((edge) => ({
    ...edge,
    tone: onStack.has(edge.from) && onStack.has(edge.to) ? "active" : "idle",
  }));

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col items-center gap-space-md sm:flex-row sm:items-start">
        <div className="w-full min-w-0 flex-1">
          <NodeDiagram width={300} height={210} nodes={nodes} edges={edges} />
        </div>
        <div className="w-full sm:w-44">
          <VisualLabel>call stack</VisualLabel>
          {/* Reserve room for the deepest stack so the layout doesn't jump. */}
          <div
            className="mt-space-xs flex flex-col-reverse justify-end gap-1"
            style={{ minHeight: MAX_DEPTH * 34 }}
          >
            {stack.map((id, i) => {
              const isTop = i === stack.length - 1;
              return (
                <div
                  key={id}
                  className={`flex items-center justify-between rounded-lg px-space-sm py-1.5 font-code-sm text-code-sm transition-colors duration-300 ${
                    isTop
                      ? "bg-primary-fixed text-primary font-semibold"
                      : "bg-tertiary-fixed/60 text-tertiary"
                  }`}
                >
                  <span>inorder({id})</span>
                  <span className="opacity-70">{TREE[id].address}</span>
                </div>
              );
            })}
            {stack.length === 0 && (
              <div className="rounded-lg border border-dashed border-outline-variant px-space-sm py-1.5 text-center font-code-sm text-code-sm text-on-surface-variant">
                empty
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-space-xs">
        <VisualLabel>output</VisualLabel>
        {Object.keys(TREE).map((_, i) => (
          <span
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-md font-code-md text-code-md font-semibold transition-colors duration-300 ${
              output[i]
                ? i === output.length - 1 && current
                  ? "bg-primary-container text-on-primary"
                  : "bg-secondary-container/40 text-on-secondary-container"
                : "border border-dashed border-outline-variant"
            }`}
          >
            {output[i] ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

const call = (id: string) => `inorder(${id})`;
const list = (items: string[]) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Narrates how the call stack moved between two visits. */
function narrate(before: string[], after: string[], visit: string) {
  let shared = 0;
  while (
    shared < before.length &&
    shared < after.length &&
    before[shared] === after[shared]
  ) {
    shared++;
  }
  const popped = before.slice(shared).reverse();
  const pushed = after.slice(shared);
  const parts: string[] = [];

  if (popped.length > 0) {
    parts.push(
      `${list(popped)} ${popped.length === 1 ? "has" : "have"} nothing left to explore, so ${
        popped.length === 1 ? "its frame is" : "their frames are"
      } popped.`
    );
  }
  if (pushed.length > 0) {
    // With an empty stack before, the first pushed frame is the one calling.
    const caller = shared > 0 ? after[shared - 1] : pushed[0];
    const callees = shared > 0 ? pushed : pushed.slice(1);
    parts.push(
      callees.length === 0
        ? `${call(caller)} pushes the first frame.`
        : `${call(caller)} recurses into ${callees.map(call).join(", which calls ")}${
            callees.length > 1
              ? "; each new frame is pushed onto the stack"
              : ", pushing a new frame"
          }.`
    );
    parts.push(`${visit} has no left child, so visit ${visit}.`);
  } else {
    parts.push(
      `Back in ${call(visit)}, the left subtree is finished: visit ${visit}.`
    );
  }
  return parts.join(" ");
}

function trace(): SimulationStep[] {
  const steps: SimulationStep[] = [];
  const stack: string[] = [];
  const output: string[] = [];
  let lastStack: string[] = [];

  const snapshot = (note: string, current: string | null, status?: string) => {
    steps.push({
      visual: (
        <TraversalView
          state={{ current, stack: [...stack], output: [...output] }}
        />
      ),
      registers: [
        {
          label: "[REGISTER] node:",
          value: current ? `${current} @${TREE[current].address}` : "—",
          tone: "primary",
        },
        {
          label: "Stack depth:",
          value: `${stack.length} frame${stack.length === 1 ? "" : "s"}`,
          tone: "tertiary",
        },
        { label: "Output:", value: output.join(" ") || "—" },
      ],
      note,
      status,
    });
  };

  snapshot(
    `Each node is a separate heap allocation holding a value and two child addresses. Before \`${call(ROOT)}\` can visit ${ROOT}, it must finish ${ROOT}'s entire left subtree, so it recurses left first.`,
    null
  );

  const inorder = (id: string | undefined) => {
    if (!id) return;
    stack.push(id);
    inorder(TREE[id].left);
    output.push(id);
    snapshot(narrate(lastStack, stack, id), id);
    lastStack = [...stack];
    inorder(TREE[id].right);
    stack.pop();
  };
  inorder(ROOT);

  const unwound = [...lastStack].reverse();
  snapshot(
    `${list(unwound)} return in turn, emptying the call stack. Output: ${output.join(" ")} — every node visited once in O(n), with never more than ${MAX_DEPTH} frames (the tree's height) on the stack.`,
    null,
    "TRAVERSAL COMPLETE"
  );

  return steps;
}

export const binaryTreeSimulation: Simulation = {
  algorithm: "Inorder Traversal (Recursive)",
  lead: "Tree nodes live wherever the allocator put them; recursion follows their pointers and parks every unfinished call on the stack.",
  input: {
    label: "Traversal:",
    value: "left → node → right",
    rule: "`inorder(node)` first recurses into `node.left`, then visits `node`, then recurses into `node.right`. Every call still waiting on a child is a frame on the call stack.",
  },
  buffer: `heap_nodes[${Object.keys(TREE).length}] + call_stack`,
  badge: "O(h) Stack Memory",
  steps: trace(),
};
