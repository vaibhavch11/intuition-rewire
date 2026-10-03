import {
  Arrow,
  CELL_TONES,
  CurvedArrow,
  DiagramLayer,
  EDGE_TEXT,
  NODE_TONES,
  SvgTags,
  type DiagramEdge,
  type DiagramNode,
  type NodeTone,
} from "@/components/dsa/simulator/visuals";
import { formatValue, type CellTone, type ListNodeView, type ListView, type StackView, type TreeView } from "./types";

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
// Linked lists: [value | •]──▶ boxes on a grid of columns and rows
// ---------------------------------------------------------------------------

const PAD = 34;
const TOP = 34;
const NODE_W = 66;
const VALUE_W = 44;
const NODE_H = 40;
const NULL_W = 46;
const GAP = 34;
const ROW_H = 104;

const colX = (col: number) => PAD + col * (NODE_W + GAP);
const rowY = (row = 0) => TOP + row * ROW_H;
const widthOf = (node: ListNodeView) => (node.value === null ? NULL_W : NODE_W);

export function ListDiagram({ view }: { view: ListView }) {
  const byId = new Map(view.nodes.map((n) => [n.id, n]));
  const maxCol = Math.max(0, ...view.nodes.map((n) => n.col));
  const maxRow = Math.max(0, ...view.nodes.map((n) => n.row ?? 0));
  const curves = view.links.some((link) => {
    const a = byId.get(link.from);
    const b = byId.get(link.to);
    return a && b && (a.row ?? 0) === (b.row ?? 0) && Math.abs(a.col - b.col) > 1;
  });
  const width = colX(maxCol) + NODE_W + PAD;
  const height = rowY(maxRow) + NODE_H + (curves ? 58 : 14);

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
            if (!a || !b || a.id === b.id) return null;
            const className = EDGE_TEXT[link.tone ?? "idle"];
            const ar = a.row ?? 0;
            const br = b.row ?? 0;
            const ax = colX(a.col);
            const bx = colX(b.col);
            const ay = rowY(ar) + NODE_H / 2;
            const key = `${link.from}-${link.to}`;

            if (ar === br) {
              const dist = b.col - a.col;
              if (dist === 1) {
                return <Arrow key={key} x1={ax + VALUE_W + 11} y1={ay} x2={bx - 2} y2={ay} className={className} />;
              }
              if (dist === -1) {
                return <Arrow key={key} x1={ax - 1} y1={ay} x2={bx + widthOf(b) + 2} y2={ay} className={className} />;
              }
              // Skips and back-links bow underneath the row.
              const bottom = rowY(ar) + NODE_H;
              return (
                <CurvedArrow
                  key={key}
                  x1={round(ax + (dist > 0 ? VALUE_W + 11 : NODE_W / 2))}
                  y1={bottom}
                  x2={round(bx + widthOf(b) / 2)}
                  y2={bottom + 3}
                  bend={round(30 + Math.abs(dist) * 6)}
                  className={className}
                />
              );
            }
            const endY = br < ar ? rowY(br) + NODE_H + 2 : rowY(br) - 2;
            return <Arrow key={key} x1={ax + VALUE_W + 11} y1={ay} x2={round(bx + widthOf(b) / 2)} y2={endY} className={className} />;
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
                <SvgTags x={x + VALUE_W / 2} y={y - 9} tags={tags} />
                <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={8} className="fill-surface-container-lowest" />
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  strokeWidth={1.5}
                  className={`transition-colors duration-300 ${tone.shape}`}
                />
                <line x1={x + VALUE_W} y1={y + 6} x2={x + VALUE_W} y2={y + NODE_H - 6} strokeWidth={1} className="stroke-outline-variant" />
                <circle cx={x + VALUE_W + 11} cy={y + NODE_H / 2} r={3.5} className="fill-on-surface-variant" />
                <text
                  x={x + VALUE_W / 2}
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
        <div className="flex flex-col gap-1 border-b-2 border-outline-variant pb-1">
          {view.values
            .map((value, i) => ({ value, i }))
            .reverse()
            .map(({ value, i }) => (
              <div key={i} className="flex items-center gap-space-xs">
                <div
                  className={`flex h-9 min-w-14 items-center justify-center rounded-lg px-2 font-code-md text-code-md font-semibold transition-all duration-300 motion-reduce:transition-none sm:h-10 ${
                    CELL_TONES[view.tones?.[i] ?? "idle"]
                  }`}
                >
                  {formatValue(value)}
                </div>
                {i === top && (
                  <span className="whitespace-nowrap font-code-sm text-code-sm font-semibold text-primary">
                    ◀ {view.topLabel ?? "top"}
                  </span>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
