import type { CellTone, EdgeTone, Pointer, PointerTone } from "@/components/dsa/simulator/visuals";

export type { CellTone, EdgeTone, Pointer, PointerTone };

export type Scalar = number | string | null;

/** One row of cells, e.g. `nums` with `i` and `j` pointing into it. */
export interface ArrayView {
  name: string;
  values: Scalar[];
  tones?: Record<number, CellTone>;
  pointers?: Record<number, Pointer[]>;
  /** Also draws the values as bars, for "prices over days" style inputs. */
  chart?: boolean;
}

/** A matrix; rows may differ in length (Pascal's triangle). Tones keyed `"r,c"`. */
export interface GridView {
  name: string;
  values: Scalar[][];
  tones?: Record<string, CellTone>;
  /** Labels down the left edge instead of row numbers, e.g. heights for a skyline. */
  rowLabels?: string[];
}

/**
 * One node of a linked list drawing. A node whose `value` is null is drawn as
 * a dashed "null" box, so pointers and arrows can point at null too.
 */
export interface ListNodeView {
  id: number;
  value: Scalar;
  /** Column and row on the drawing grid; rows let two lists sit apart. */
  col: number;
  row?: number;
  tone?: CellTone;
}

/** A `next` arrow from one node to another (or to a null box). */
export interface ListLink {
  from: number;
  to: number;
  tone?: EdgeTone;
}

/** Nodes joined by `next` arrows: reversal, cycles, two lists meeting. */
export interface ListView {
  name: string;
  nodes: ListNodeView[];
  links: ListLink[];
  /** Pointer tags above nodes, keyed by node id. */
  pointers?: Record<number, Pointer[]>;
}

export interface TreeNodeView {
  id: number;
  value: Scalar;
  left: number | null;
  right: number | null;
}

/** A binary tree, laid out by in-order position and depth. */
export interface TreeView {
  name: string;
  nodes: TreeNodeView[];
  root: number | null;
  tones?: Record<number, CellTone>;
  pointers?: Record<number, Pointer[]>;
  /** Tone of the edge leading into a node from its parent. */
  edgeTones?: Record<number, EdgeTone>;
  /** Small text under a node, e.g. its depth or column. */
  captions?: Record<number, string>;
}

/** A vertical stack, bottom first: the call stack, an operator stack. */
export interface StackView {
  name: string;
  values: Scalar[];
  tones?: Record<number, CellTone>;
  /** Text beside the top cell; defaults to "top". */
  topLabel?: string;
}

/** Everything the simulator shows for one step. */
export interface Frame {
  /** 1-indexed line of `Program.code` that just ran. */
  line: number;
  /** What happened and why. Supports **bold** and `code`. */
  note: string;
  arrays: ArrayView[];
  grids: GridView[];
  lists: ListView[];
  trees: TreeView[];
  stacks: StackView[];
  vars: [string, string][];
  done: boolean;
}

export type FieldKind = "array" | "number" | "grid" | "pairs" | "tree" | "text";

export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
  /** Longest array, most rows, or most pairs a reader may enter. */
  maxLength?: number;
  /** Bounds for every number entered. */
  min?: number;
  max?: number;
  /** Text fields: what the input should look like, shown when it's rejected. */
  hint?: string;
}

/** A tree field holds level-order values with null for a missing child. */
export type InputValue = number | number[] | number[][] | (number | null)[] | string;
export type Input = Record<string, InputValue>;

export interface Program {
  title: string;
  /** JavaScript source shown beside the visual; frames point at its lines. */
  code: string;
  fields: Field[];
  /** Ready-made inputs; the first one loads on page open. */
  examples: { label: string; input: Input }[];
  /** A reason this input can't be run, e.g. "arr1 must be sorted". */
  check?: (input: Input) => string | null;
  run: (input: Input) => Frame[];
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  if (typeof value === "number" && !Number.isFinite(value)) {
    return value > 0 ? "∞" : "-∞";
  }
  return String(value);
}

interface FrameParts {
  arrays?: ArrayView[];
  grids?: GridView[];
  lists?: ListView[];
  trees?: TreeView[];
  stacks?: StackView[];
  vars?: Record<string, unknown>;
  done?: boolean;
}

/**
 * Collects frames as a program runs. Views and variables are copied at the
 * moment of the call, so later mutations never rewrite earlier steps.
 */
export function recorder() {
  const frames: Frame[] = [];
  return {
    frames,
    step(line: number, note: string, parts: FrameParts = {}) {
      frames.push({
        line,
        note,
        arrays: (parts.arrays ?? []).map((a) => ({
          ...a,
          values: [...a.values],
          tones: { ...a.tones },
          pointers: { ...a.pointers },
        })),
        grids: (parts.grids ?? []).map((g) => ({
          ...g,
          values: g.values.map((row) => [...row]),
          tones: { ...g.tones },
        })),
        lists: (parts.lists ?? []).map((l) => ({
          ...l,
          nodes: l.nodes.map((n) => ({ ...n })),
          links: l.links.map((k) => ({ ...k })),
          pointers: { ...l.pointers },
        })),
        trees: (parts.trees ?? []).map((t) => ({
          ...t,
          nodes: t.nodes.map((n) => ({ ...n })),
          tones: { ...t.tones },
          pointers: { ...t.pointers },
          edgeTones: { ...t.edgeTones },
          captions: { ...t.captions },
        })),
        stacks: (parts.stacks ?? []).map((st) => ({ ...st, values: [...st.values], tones: { ...st.tones } })),
        vars: Object.entries(parts.vars ?? {}).map(([k, v]) => [k, formatValue(v)]),
        done: parts.done ?? false,
      });
    },
  };
}

/** Builds a pointer map from `{ label: index }`, skipping indexes off the end. */
export function pointersAt(
  length: number,
  marks: Record<string, number | undefined>,
  tones: Record<string, PointerTone> = {}
): Record<number, Pointer[]> {
  const out: Record<number, Pointer[]> = {};
  for (const [label, index] of Object.entries(marks)) {
    if (index === undefined || index < 0 || index >= length) continue;
    (out[index] ??= []).push({ label, tone: tones[label] ?? "primary" });
  }
  return out;
}

/** The `GridView.tones` key for a cell. */
export const cell = (r: number, c: number) => `${r},${c}`;

/** Tones for every cell of a grid that passes `test`. */
export function gridTones(
  values: Scalar[][],
  test: (r: number, c: number) => CellTone | null
): Record<string, CellTone> {
  const out: Record<string, CellTone> = {};
  values.forEach((row, r) =>
    row.forEach((_, c) => {
      const tone = test(r, c);
      if (tone) out[cell(r, c)] = tone;
    })
  );
  return out;
}

/** Tones for a run of indexes, e.g. the part of an array already processed. */
export function toneRange(
  from: number,
  to: number,
  tone: CellTone,
  base: Record<number, CellTone> = {}
): Record<number, CellTone> {
  const out = { ...base };
  for (let i = from; i <= to; i++) out[i] = tone;
  return out;
}
