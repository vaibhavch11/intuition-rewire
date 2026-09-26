import {
  NodeDiagram,
  VisualLabel,
  type DiagramEdge,
  type DiagramNode,
  type NodeTone,
} from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const START = "A";
const POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 50, y: 50 },
  B: { x: 170, y: 50 },
  D: { x: 290, y: 50 },
  C: { x: 50, y: 150 },
  E: { x: 170, y: 150 },
  F: { x: 290, y: 150 },
};
const EDGES: [string, string][] = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["C", "E"],
  ["D", "F"],
  ["E", "F"],
];

/** The in-memory representation: one neighbour array per node. */
const ADJACENCY: Record<string, string[]> = Object.fromEntries(
  Object.keys(POSITIONS)
    .sort()
    .map((node) => [
      node,
      EDGES.flatMap(([a, b]) => (a === node ? [b] : b === node ? [a] : [])).sort(),
    ])
);

interface BfsState {
  current: string | null;
  queue: string[];
  order: string[];
  distance: Record<string, number>;
  parent: Record<string, string>;
  /** Neighbours first discovered while scanning `current`. */
  discovered: string[];
}

function BfsView({ state }: { state: BfsState }) {
  const { current, queue, order, distance, parent, discovered } = state;
  const inQueue = new Set(queue);
  const done = new Set(order);

  const nodes: DiagramNode[] = Object.entries(POSITIONS).map(([id, pos]) => {
    let tone: NodeTone = "idle";
    if (done.has(id)) tone = "done";
    if (inQueue.has(id)) tone = "tertiary";
    if (id === current) tone = "primary";
    return {
      id,
      ...pos,
      label: id,
      tone,
      caption: id in distance ? `d=${distance[id]}` : undefined,
      tags: id === current ? [{ label: "curr", tone: "primary" }] : undefined,
    };
  });

  const edges: DiagramEdge[] = EDGES.map(([a, b]) => {
    const scanning = current !== null && (a === current || b === current);
    const treeEdge = parent[b] === a || parent[a] === b;
    return {
      from: a,
      to: b,
      tone: scanning ? "active" : treeEdge ? "done" : "idle",
    };
  });

  return (
    <div className="flex flex-col items-center gap-space-md sm:flex-row sm:items-start">
      <div className="w-full min-w-0 flex-1">
        <NodeDiagram width={340} height={200} nodes={nodes} edges={edges} />
      </div>
      <div className="w-full sm:w-44">
        <VisualLabel>adjacency_list</VisualLabel>
        <div className="mt-space-xs space-y-1 font-code-sm text-code-sm">
          {Object.entries(ADJACENCY).map(([node, neighbours]) => (
            <div
              key={node}
              className={`rounded-md px-space-sm py-1 transition-colors duration-300 ${
                node === current
                  ? "bg-primary-fixed text-primary font-semibold"
                  : "text-on-surface-variant"
              }`}
            >
              {node} → [
              {neighbours.map((n, i) => (
                <span key={n}>
                  {i > 0 && ", "}
                  <span
                    className={
                      node === current && discovered.includes(n)
                        ? "text-secondary font-semibold"
                        : undefined
                    }
                  >
                    {n}
                  </span>
                </span>
              ))}
              ]
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const bracket = (items: string[]) => `[${items.join(", ")}]`;
const list = (items: string[]) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

function trace(): SimulationStep[] {
  const steps: SimulationStep[] = [];
  const queue = [START];
  const visited = new Set([START]);
  const distance: Record<string, number> = { [START]: 0 };
  const parent: Record<string, string> = {};
  const order: string[] = [];

  const snapshot = (
    note: string,
    current: string | null,
    discovered: string[],
    status?: string
  ) => {
    steps.push({
      visual: (
        <BfsView
          state={{
            current,
            queue: [...queue],
            order: [...order],
            distance: { ...distance },
            parent: { ...parent },
            discovered,
          }}
        />
      ),
      registers: [
        { label: "[REGISTER] curr:", value: current ?? "—", tone: "primary" },
        { label: "Queue:", value: bracket(queue), tone: "tertiary" },
        { label: "Visited:", value: `{${[...visited].join(", ")}}` },
        { label: "Order:", value: order.join(" → ") || "—" },
      ],
      note,
      status,
    });
  };

  snapshot(
    `The graph lives in memory as an adjacency list: one array of neighbours per node. BFS enqueues ${START} and marks it visited at distance 0.`,
    null,
    []
  );

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    const discovered: string[] = [];
    for (const next of ADJACENCY[current]) {
      if (visited.has(next)) continue;
      visited.add(next);
      distance[next] = distance[current] + 1;
      parent[next] = current;
      queue.push(next);
      discovered.push(next);
    }

    const seen = ADJACENCY[current].filter((n) => !discovered.includes(n));
    const scan = `Dequeue ${current} (distance ${distance[current]}) and scan its list ${bracket(ADJACENCY[current])}:`;
    const found = discovered.length
      ? `${list(discovered)} ${discovered.length === 1 ? "is" : "are"} new, so ${discovered.length === 1 ? "it's" : "they're"} marked and enqueued at distance ${distance[current] + 1}`
      : "";
    const skipped = seen.length
      ? `${list(seen)} ${seen.length === 1 ? "was" : "were"} already visited`
      : "";
    const finished = queue.length === 0;

    snapshot(
      `${scan} ${[skipped, found].filter(Boolean).join("; ")}.${
        finished
          ? ` The queue is empty: all ${order.length} nodes were reached in order of distance from ${START} — O(V + E), since each list is scanned exactly once.`
          : ""
      }`,
      current,
      discovered,
      finished ? "ALL NODES REACHED" : undefined
    );
  }

  return steps;
}

export const graphSimulation: Simulation = {
  algorithm: "Breadth-First Search",
  lead: "A graph in memory is just an array of neighbour lists — BFS reads them level by level.",
  input: {
    label: "Start:",
    value: `bfs(${START})`,
    rule: "Dequeue the front node, then scan its adjacency list and enqueue every neighbour not yet visited. Marking on enqueue guarantees each node enters the queue exactly once.",
  },
  buffer: `adjacency_list[${Object.keys(ADJACENCY).length}]`,
  badge: "O(V + E) Time",
  steps: trace(),
};
