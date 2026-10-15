import { Fragment } from "react";
import {
  Arrow,
  CELL_TONES,
  CurvedArrow,
  DiagramLayer,
  EDGE_TEXT,
  EDGE_TONES,
  HALO,
  NODE_TONES,
  SvgTags,
  type DiagramEdge,
  type DiagramNode,
  type NodeTone,
} from "@/components/dsa/simulator/visuals";
import {
  formatValue,
  type CellTone,
  type GraphView,
  type ListNodeView,
  type ListView,
  type StackView,
  type TreeView,
} from "./types";

const round = (n: number) => Math.round(n * 10) / 10;

function Name({ children }: { children: string }) {
  return <p className="mb-1 font-code-sm text-code-sm font-semibold text-on-surface-variant">{children}</p>;
}

function Empty() {
  return (
    <div className="flex h-9 items-center rounded-lg border border-dashed border-outline-variant px-space-md font-body-sm text-body-sm text-on-surface-variant/70 sm:h-11">
      empty
    </div>
  );
}

/** Cell tones map onto node tones; an "empty" cell becomes a dashed node. */
const nodeTone = (tone?: CellTone): NodeTone => (!tone || tone === "empty" ? "idle" : tone);

// ---------------------------------------------------------------------------
// Linked lists: [value | •]──▶ boxes on a grid of columns and rows. A doubly
// linked view draws [• | value | •]: next arrows run along the top lane and
// prev arrows along the bottom one, so the two directions never overlap.
// ---------------------------------------------------------------------------

const PAD = 34;
const TOP = 34;
const NODE_W = 66;
const VALUE_W = 44;
const SIDE_W = 22;
const NODE_H = 40;
const NULL_W = 46;
const GAP = 34;
const ROW_H = 104;
const LANE = 7;

const rowY = (row = 0) => TOP + row * ROW_H;

export function ListDiagram({ view }: { view: ListView }) {
  const doubly = view.doubly ?? false;
  const nodeW = doubly ? NODE_W + SIDE_W : NODE_W;
  const valueX = doubly ? SIDE_W : 0;
  const nextDotX = valueX + VALUE_W + 11;
  const nextLane = doubly ? -LANE : 0;
  const prevLane = doubly ? LANE : 0;
  const colX = (col: number) => PAD + col * (nodeW + GAP);
  const widthOf = (node: ListNodeView) => (node.value === null ? NULL_W : nodeW);
  const byId = new Map(view.nodes.map((n) => [n.id, n]));
  const maxCol = Math.max(0, ...view.nodes.map((n) => n.col));
  const maxRow = Math.max(0, ...view.nodes.map((n) => n.row ?? 0));
  const curves = view.links.some((link) => {
    const a = byId.get(link.from);
    const b = byId.get(link.to);
    return a && b && link.kind !== "child" && (a.row ?? 0) === (b.row ?? 0) && (a.id === b.id || Math.abs(a.col - b.col) > 1);
  });
  const width = colX(maxCol) + nodeW + PAD;
  const height = rowY(maxRow) + NODE_H + (curves ? 62 : 14);

  return (
    <div>
      <Name>{view.name}</Name>
      {view.nodes.length === 0 ? (
        <Empty />
      ) : (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
          {view.links.map((link) => {
            const a = byId.get(link.from);
            const b = byId.get(link.to);
            if (!a || !b) return null;
            const className = EDGE_TEXT[link.tone ?? "idle"];
            const ar = a.row ?? 0;
            const br = b.row ?? 0;
            const ax = colX(a.col);
            const bx = colX(b.col);
            const ay = rowY(ar) + NODE_H / 2;
            const key = `${link.from}-${link.to}`;

            if (a.id === b.id) {
              // A one-node circular list: the node's next loops back to itself.
              const bottom = rowY(ar) + NODE_H;
              return <CurvedArrow key={key} x1={ax + nextDotX} y1={bottom} x2={ax + valueX + 12} y2={bottom + 3} bend={30} className={className} />;
            }

            if (link.kind === "child") {
              // A child pointer drops from the bottom of the node to the top of the child.
              return <Arrow key={key} x1={ax + valueX + VALUE_W / 2} y1={rowY(ar) + NODE_H + 1} x2={bx + valueX + VALUE_W / 2} y2={rowY(br) - 2} className={className} />;
            }
            // In a doubly view a prev pointer leaves from its own dot and runs along the bottom lane.
            const isPrev = doubly && link.kind === "prev";
            const lane = isPrev ? prevLane : nextLane;
            if (ar === br) {
              const dist = b.col - a.col;
              if (dist === 1) {
                const x1 = isPrev ? ax + nodeW - 2 : ax + nextDotX;
                return <Arrow key={key} x1={x1} y1={ay + lane} x2={bx - 2} y2={ay + lane} className={className} />;
              }
              if (dist === -1) {
                const x1 = isPrev ? ax + SIDE_W / 2 : doubly ? ax + 2 : ax - 1;
                return <Arrow key={key} x1={x1} y1={ay + lane} x2={bx + widthOf(b) + 2} y2={ay + lane} className={className} />;
              }
              // Skips and back-links bow underneath the row; prev skips bow deeper and land further right.
              const bottom = rowY(ar) + NODE_H;
              const x2 = b.value === null ? bx + widthOf(b) / 2 : isPrev ? bx + valueX + VALUE_W - 8 : doubly ? bx + valueX + 10 : bx + widthOf(b) / 2;
              return (
                <CurvedArrow
                  key={key}
                  x1={round(ax + (isPrev ? SIDE_W / 2 : dist > 0 ? nextDotX : nodeW / 2))}
                  y1={bottom}
                  x2={round(x2)}
                  y2={bottom + 3}
                  bend={round((isPrev ? 44 : 30) + Math.abs(dist) * 6)}
                  className={className}
                />
              );
            }
            const endY = br < ar ? rowY(br) + NODE_H + 2 : rowY(br) - 2;
            const x1 = isPrev ? ax + SIDE_W / 2 : ax + nextDotX;
            return <Arrow key={key} x1={x1} y1={ay + lane} x2={round(bx + widthOf(b) / 2)} y2={endY} className={className} />;
          })}

          {view.nodes.map((node) => {
            const x = colX(node.col);
            const y = rowY(node.row ?? 0);
            const tags = view.pointers?.[node.id];
            if (node.value === null) {
              return (
                <g key={node.id}>
                  <SvgTags x={x + NULL_W / 2} y={y - 9} tags={tags} />
                  <rect
                    x={x}
                    y={y + 7}
                    width={NULL_W}
                    height={NODE_H - 14}
                    rx={6}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    className="fill-none stroke-outline-variant"
                  />
                  <text
                    x={x + NULL_W / 2}
                    y={y + NODE_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-on-surface-variant font-code-sm text-code-sm"
                  >
                    null
                  </text>
                </g>
              );
            }
            const tone = NODE_TONES[nodeTone(node.tone)];
            return (
              <g key={node.id}>
                <SvgTags x={x + valueX + VALUE_W / 2} y={y - 9} tags={tags} />
                <rect x={x} y={y} width={nodeW} height={NODE_H} rx={8} className="fill-surface-container-lowest" />
                <rect
                  x={x}
                  y={y}
                  width={nodeW}
                  height={NODE_H}
                  rx={8}
                  strokeWidth={1.5}
                  className={`transition-colors duration-300 ${tone.shape}`}
                />
                {doubly && (
                  <>
                    <line x1={x + SIDE_W} y1={y + 6} x2={x + SIDE_W} y2={y + NODE_H - 6} strokeWidth={1} className="stroke-outline-variant" />
                    <circle cx={x + SIDE_W / 2} cy={y + NODE_H / 2 + prevLane} r={3.5} className="fill-on-surface-variant" />
                  </>
                )}
                <line x1={x + valueX + VALUE_W} y1={y + 6} x2={x + valueX + VALUE_W} y2={y + NODE_H - 6} strokeWidth={1} className="stroke-outline-variant" />
                <circle cx={x + nextDotX} cy={y + NODE_H / 2 + nextLane} r={3.5} className="fill-on-surface-variant" />
                <text
                  x={x + valueX + VALUE_W / 2}
                  y={y + NODE_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`font-code-md text-code-md font-semibold transition-colors duration-300 ${tone.text}`}
                >
                  {formatValue(node.value)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Binary trees: x from in-order position, y from depth
// ---------------------------------------------------------------------------

const R = 17;
const X_GAP = 44;
const Y_GAP = 62;
const TREE_PAD = 34;
const TREE_TOP = 30;

export function TreeDiagram({ view }: { view: TreeView }) {
  const byId = new Map(view.nodes.map((n) => [n.id, n]));
  const order = new Map<number, number>();
  const depth = new Map<number, number>();

  // Iterative in-order walk: every node gets the next free column.
  const stack: [number, number][] = [];
  let current = view.root;
  let d = 0;
  while (current !== null || stack.length > 0) {
    while (current !== null && byId.has(current)) {
      stack.push([current, d]);
      current = byId.get(current)!.left;
      d++;
    }
    const top = stack.pop();
    if (!top) break;
    const [id, level] = top;
    order.set(id, order.size);
    depth.set(id, level);
    current = byId.get(id)!.right;
    d = level + 1;
  }

  if (order.size === 0) {
    return (
      <div>
        <Name>{view.name}</Name>
        <Empty />
      </div>
    );
  }

  const maxDepth = Math.max(...depth.values());
  const width = TREE_PAD * 2 + R * 2 + (order.size - 1) * X_GAP;
  const height = TREE_TOP + R * 2 + maxDepth * Y_GAP + 20;
  const x = (id: number) => TREE_PAD + R + order.get(id)! * X_GAP;
  const y = (id: number) => TREE_TOP + R + depth.get(id)! * Y_GAP;

  const nodes: DiagramNode[] = [...order.keys()].map((id) => ({
    id: String(id),
    x: x(id),
    y: y(id),
    label: formatValue(byId.get(id)!.value),
    tone: nodeTone(view.tones?.[id]),
    ghost: view.tones?.[id] === "empty",
    caption: view.captions?.[id],
    tags: view.pointers?.[id],
  }));
  const edges: DiagramEdge[] = [];
  for (const id of order.keys()) {
    const node = byId.get(id)!;
    for (const child of [node.left, node.right]) {
      if (child !== null && order.has(child)) {
        edges.push({ from: String(id), to: String(child), tone: view.edgeTones?.[child] ?? "idle" });
      }
    }
  }

  return (
    <div>
      <Name>{view.name}</Name>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <DiagramLayer nodes={nodes} edges={edges} radius={R} />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Graphs: vertices where the program placed them, edges as lines or arrows
// ---------------------------------------------------------------------------

const G_R = 17;
const G_PAD = 30;
const G_TOP = 34;

export function GraphDiagram({ view }: { view: GraphView }) {
  if (view.nodes.length === 0) {
    return (
      <div>
        <Name>{view.name}</Name>
        <Empty />
      </div>
    );
  }
  const minX = Math.min(...view.nodes.map((n) => n.x));
  const minY = Math.min(...view.nodes.map((n) => n.y));
  const x = (v: number) => G_PAD + G_R + v - minX;
  const y = (v: number) => G_TOP + G_R + v - minY;
  const byId = new Map(view.nodes.map((n) => [n.id, { x: x(n.x), y: y(n.y) }]));
  const captions = view.captions && Object.keys(view.captions).length > 0;
  const width = Math.max(...view.nodes.map((n) => x(n.x))) + G_R + G_PAD;
  const height = Math.max(...view.nodes.map((n) => y(n.y))) + G_R + (captions ? 26 : 12);
  // A directed pair u→v and v→u bows apart so the two arrows don't overlap.
  const pairs = new Set(view.edges.map((e) => `${e.from}>${e.to}`));

  const nodes: DiagramNode[] = view.nodes.map((n) => ({
    id: String(n.id),
    x: byId.get(n.id)!.x,
    y: byId.get(n.id)!.y,
    label: formatValue(n.label ?? n.id),
    tone: nodeTone(view.tones?.[n.id]),
    ghost: view.tones?.[n.id] === "empty",
    caption: view.captions?.[n.id],
    tags: view.pointers?.[n.id],
  }));

  return (
    <div>
      <Name>{view.name}</Name>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {view.edges.map((edge, i) => {
          const a = byId.get(edge.from);
          const b = byId.get(edge.to);
          if (!a || !b || edge.from === edge.to) return null;
          const tone = edge.tone ?? "idle";
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const ux = (b.x - a.x) / len;
          const uy = (b.y - a.y) / len;
          // Start and end on the circles' rims, not their centres.
          const x1 = round(a.x + ux * G_R);
          const y1 = round(a.y + uy * G_R);
          const x2 = round(b.x - ux * (G_R + 2));
          const y2 = round(b.y - uy * (G_R + 2));
          const both = view.directed && pairs.has(`${edge.to}>${edge.from}`);
          const bend = both ? 14 : 0;
          // The weight sits beside the middle of the edge (or of its curve).
          const mx = (a.x + b.x) / 2 - uy * (bend + 9);
          const my = (a.y + b.y) / 2 + ux * (bend + 9);
          return (
            <g key={`${edge.from}-${edge.to}-${i}`}>
              {view.directed ? (
                bend ? (
                  <CurvedArrow x1={x1} y1={y1} x2={x2} y2={y2} bend={bend} className={EDGE_TEXT[tone]} />
                ) : (
                  <Arrow x1={x1} y1={y1} x2={x2} y2={y2} className={EDGE_TEXT[tone]} />
                )
              ) : (
                <line
                  x1={x1}
                  y1={y1}
                  x2={round(b.x - ux * G_R)}
                  y2={round(b.y - uy * G_R)}
                  strokeWidth={tone === "active" || tone === "write" ? 2.5 : 1.5}
                  className={`transition-colors duration-300 ${EDGE_TONES[tone]}`}
                />
              )}
              {edge.weight !== undefined && edge.weight !== null && (
                <text
                  x={round(mx)}
                  y={round(my)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`fill-on-surface-variant font-code-sm text-[11px] font-semibold ${HALO}`}
                >
                  {formatValue(edge.weight)}
                </text>
              )}
            </g>
          );
        })}
        <DiagramLayer nodes={nodes} edges={[]} radius={G_R} />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stacks: a column, top first
// ---------------------------------------------------------------------------

export function StackColumn({ view }: { view: StackView }) {
  const top = view.values.length - 1;
  return (
    <div>
      <Name>{view.name}</Name>
      {view.values.length === 0 ? (
        <Empty />
      ) : (
        // A two-column grid, so every cell takes the width of the widest one,
        // like a real stack of equal boxes, with the top label beside it.
        <div className="inline-grid grid-cols-[auto_auto] items-center gap-x-space-xs gap-y-1 border-b-2 border-outline-variant pb-1">
          {view.values
            .map((value, i) => ({ value, i }))
            .reverse()
            .map(({ value, i }) => (
              <Fragment key={i}>
                <div
                  className={`flex h-9 min-w-14 items-center justify-center rounded-lg px-2 font-code-md text-code-md font-semibold transition-all duration-300 motion-reduce:transition-none sm:h-10 ${
                    CELL_TONES[view.tones?.[i] ?? "idle"]
                  }`}
                >
                  {formatValue(value)}
                </div>
                <span className="whitespace-nowrap font-code-sm text-code-sm font-semibold text-primary">
                  {i === top ? `◀ ${view.topLabel ?? "top"}` : ""}
                </span>
              </Fragment>
            ))}
        </div>
      )}
    </div>
  );
}
