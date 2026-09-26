import type { ReactNode } from "react";

/*
 * Presentational building blocks for simulation visuals. These render on the
 * server into each step's `visual`, so they must stay free of hooks and
 * event handlers.
 */

export const hex = (n: number) => `0x${n.toString(16)}`;

const round = (n: number) => Math.round(n * 10) / 10;

export type PointerTone = "primary" | "tertiary" | "secondary" | "muted";

export interface Pointer {
  label: string;
  tone?: PointerTone;
}

const POINTER_TEXT: Record<PointerTone, string> = {
  primary: "text-primary",
  tertiary: "text-tertiary",
  secondary: "text-secondary",
  muted: "text-on-surface-variant",
};

const POINTER_FILL: Record<PointerTone, string> = {
  primary: "fill-primary",
  tertiary: "fill-tertiary",
  secondary: "fill-secondary",
  muted: "fill-on-surface-variant",
};

/** The `L ▼` markers that sit above a cell. Always reserves its height. */
export function PointerTags({ pointers }: { pointers?: Pointer[] }) {
  const lead = pointers?.[0];
  return (
    <span className="flex h-6 items-center gap-1 whitespace-nowrap font-code-sm text-code-sm font-semibold">
      {pointers?.map((p) => (
        <span key={p.label} className={POINTER_TEXT[p.tone ?? "primary"]}>
          {p.label}
        </span>
      ))}
      {lead && (
        <span className={POINTER_TEXT[lead.tone ?? "primary"]}>▼</span>
      )}
    </span>
  );
}

/** A white outline behind SVG text so labels stay legible where they cross lines. */
const HALO =
  "stroke-surface-container-lowest [paint-order:stroke] [stroke-linejoin:round] [stroke-width:3px]";

/** SVG counterpart of `PointerTags`, centred on `x` with its baseline at `y`. */
export function SvgTags({
  x,
  y,
  tags,
}: {
  x: number;
  y: number;
  tags?: Pointer[];
}) {
  if (!tags || tags.length === 0) return null;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className={`font-code-sm text-code-sm font-semibold ${HALO}`}
    >
      {tags.map((tag, i) => (
        <tspan key={tag.label} className={POINTER_FILL[tag.tone ?? "primary"]}>
          {i > 0 ? ` ${tag.label}` : tag.label}
        </tspan>
      ))}
      <tspan className={POINTER_FILL[tags[0].tone ?? "primary"]}> ▼</tspan>
    </text>
  );
}

export function VisualLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-label-tag text-label-tag uppercase text-on-surface-variant">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Contiguous memory: a row of cells
// ---------------------------------------------------------------------------

export type CellTone =
  | "idle"
  | "primary"
  | "tertiary"
  | "success"
  | "done"
  | "write"
  | "muted"
  | "empty";

export interface Cell {
  value: ReactNode;
  tone?: CellTone;
  pointers?: Pointer[];
  /** Small line under the index, e.g. an address or a byte value. */
  detail?: string;
}

export const CELL_TONES: Record<CellTone, string> = {
  idle: "bg-surface-container-low text-on-surface shadow-sm",
  primary: "bg-primary-fixed text-primary shadow-sm",
  tertiary: "bg-tertiary-fixed text-tertiary shadow-sm",
  success:
    "bg-secondary-container text-on-secondary-container scale-105 shadow-md",
  done: "bg-secondary-container/40 text-on-secondary-container shadow-sm",
  write: "bg-primary-container text-on-primary shadow-md",
  muted: "bg-surface-container text-on-surface-variant/40",
  empty:
    "border border-dashed border-outline-variant text-on-surface-variant/50",
};

export function MemoryCells({
  cells,
  size = "md",
  indexed = true,
}: {
  cells: Cell[];
  size?: "md" | "sm";
  /** Shows `idx i` under every cell. */
  indexed?: boolean;
}) {
  const dense = cells.length > 7;
  const box =
    size === "sm"
      ? "max-w-[40px] font-code-md text-code-lg font-semibold"
      : dense
        ? "max-w-[64px] font-headline-md text-body-lg font-semibold sm:text-headline-md"
        : "max-w-[64px] font-headline-md text-headline-md";

  return (
    <div
      className={`flex items-start justify-between px-2 ${
        dense ? "gap-1 sm:gap-2" : "gap-2 sm:gap-4"
      }`}
    >
      {cells.map((cell, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center">
          <PointerTags pointers={cell.pointers} />
          <div
            className={`flex aspect-square w-full items-center justify-center rounded-xl transition-all duration-300 motion-reduce:transition-none ${box} ${
              CELL_TONES[cell.tone ?? "idle"]
            }`}
          >
            {cell.value}
          </div>
          {indexed && (
            <span className="mt-1.5 whitespace-nowrap font-code-sm text-code-sm text-on-surface-variant">
              <span className={dense ? "hidden sm:inline" : undefined}>
                idx{" "}
              </span>
              {i}
            </span>
          )}
          {cell.detail && (
            <span
              className={`whitespace-nowrap font-code-sm text-[10px] leading-[14px] text-on-surface-variant/70 ${
                dense ? "hidden sm:block" : ""
              }`}
            >
              {cell.detail}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pointer-linked memory: nodes and edges drawn in SVG
// ---------------------------------------------------------------------------

export type NodeTone =
  | "idle"
  | "primary"
  | "tertiary"
  | "success"
  | "done"
  | "write"
  | "muted";

export type EdgeTone = "idle" | "active" | "done" | "muted" | "write";

export const NODE_TONES: Record<NodeTone, { shape: string; text: string }> = {
  idle: {
    shape: "fill-surface-container-low stroke-outline-variant",
    text: "fill-on-surface",
  },
  primary: { shape: "fill-primary-fixed stroke-primary", text: "fill-primary" },
  tertiary: {
    shape: "fill-tertiary-fixed stroke-tertiary",
    text: "fill-tertiary",
  },
  success: {
    shape: "fill-secondary-container stroke-secondary",
    text: "fill-on-secondary-container",
  },
  done: {
    shape: "fill-secondary-container/40 stroke-secondary/60",
    text: "fill-on-secondary-container",
  },
  write: {
    shape: "fill-primary-container stroke-primary",
    text: "fill-on-primary",
  },
  muted: {
    shape: "fill-surface-container stroke-outline-variant/60",
    text: "fill-on-surface-variant/40",
  },
};

export const EDGE_TONES: Record<EdgeTone, string> = {
  idle: "stroke-outline-variant",
  active: "stroke-primary",
  done: "stroke-secondary",
  muted: "stroke-outline-variant/40",
  write: "stroke-primary-container",
};

/** Text colour matching an edge tone, for arrows drawn with `currentColor`. */
export const EDGE_TEXT: Record<EdgeTone, string> = {
  idle: "text-outline",
  active: "text-primary",
  done: "text-secondary",
  muted: "text-outline-variant",
  write: "text-primary-container",
};

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  label: string;
  tone?: NodeTone;
  /** Small text under the node, e.g. its heap address. */
  caption?: string;
  /** Pointer tags drawn above the node. */
  tags?: Pointer[];
  /** Outer ring, e.g. a trie's end-of-word marker. */
  ring?: boolean;
  /** Dashed outline for a slot that holds nothing yet. */
  ghost?: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  tone?: EdgeTone;
  dashed?: boolean;
}

/**
 * Wraps an SVG so it never scales above its natural size and scrolls
 * sideways on narrow screens instead of shrinking its text to nothing.
 */
export function Canvas({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block h-auto w-full"
        style={{ minWidth: Math.round(width * 0.75), maxWidth: width }}
      >
        {children}
      </svg>
    </div>
  );
}

/** Nodes and edges only, for composing inside a larger `Canvas`. */
export function DiagramLayer({
  nodes,
  edges,
  radius = 18,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  radius?: number;
}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <>
      {edges.map((edge) => {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (!a || !b) return null;
        const tone = edge.tone ?? "idle";
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            strokeWidth={tone === "active" || tone === "write" ? 2.5 : 1.5}
            strokeDasharray={edge.dashed ? "5 4" : undefined}
            className={`transition-colors duration-300 ${EDGE_TONES[tone]}`}
          />
        );
      })}

      {nodes.map((node) => {
        const tone = NODE_TONES[node.tone ?? "idle"];
        return (
          <g key={node.id}>
            {node.ring && (
              <circle
                cx={node.x}
                cy={node.y}
                r={radius + 4}
                fill="none"
                strokeWidth={1.5}
                className="stroke-secondary"
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              className="fill-surface-container-lowest"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              strokeWidth={1.5}
              strokeDasharray={node.ghost ? "4 3" : undefined}
              className={`transition-colors duration-300 ${tone.shape}`}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-code-md text-code-md font-semibold transition-colors duration-300 ${tone.text}`}
            >
              {node.label}
            </text>
            {node.caption && (
              <text
                x={node.x}
                y={node.y + radius + (node.ring ? 17 : 13)}
                textAnchor="middle"
                className={`fill-on-surface-variant font-code-sm text-[10px] ${HALO}`}
              >
                {node.caption}
              </text>
            )}
            <SvgTags
              x={node.x}
              y={node.y - radius - (node.ring ? 12 : 8)}
              tags={node.tags}
            />
          </g>
        );
      })}
    </>
  );
}

export function NodeDiagram({
  width,
  height,
  nodes,
  edges,
  radius,
}: {
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  radius?: number;
}) {
  return (
    <Canvas width={width} height={height}>
      <DiagramLayer nodes={nodes} edges={edges} radius={radius} />
    </Canvas>
  );
}

/** Straight arrow; colour it with a `text-*` class via `className`. */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  className,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className?: string;
}) {
  return (
    <g className={`transition-colors duration-300 ${className ?? ""}`}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={1.5}
        className="stroke-current"
      />
      <ArrowHead tipX={x2} tipY={y2} angle={Math.atan2(y2 - y1, x2 - x1)} />
    </g>
  );
}

/** Arrow that bows below (positive `bend`) or above (negative) its chord. */
export function CurvedArrow({
  x1,
  y1,
  x2,
  y2,
  bend,
  className,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bend: number;
  className?: string;
}) {
  const cx = round((x1 + x2) / 2);
  const cy = round((y1 + y2) / 2 + bend);
  return (
    <g className={`transition-colors duration-300 ${className ?? ""}`}>
      <path
        d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
        fill="none"
        strokeWidth={1.5}
        className="stroke-current"
      />
      <ArrowHead tipX={x2} tipY={y2} angle={Math.atan2(y2 - cy, x2 - cx)} />
    </g>
  );
}

function ArrowHead({
  tipX,
  tipY,
  angle,
}: {
  tipX: number;
  tipY: number;
  angle: number;
}) {
  const size = 7;
  const spread = Math.PI / 7;
  const corner = (a: number) =>
    `${round(tipX - size * Math.cos(a))},${round(tipY - size * Math.sin(a))}`;
  return (
    <polygon
      points={`${tipX},${tipY} ${corner(angle - spread)} ${corner(angle + spread)}`}
      className="fill-current"
    />
  );
}
