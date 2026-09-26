import {
  Arrow,
  Canvas,
  CurvedArrow,
  EDGE_TEXT,
  NODE_TONES,
  SvgTags,
  type NodeTone,
  type Pointer,
} from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const VALUES = [10, 20, 30, 40];
/** Heap allocations land wherever the allocator finds room — not side by side. */
const ADDRESSES = ["0x7a10", "0x3c40", "0x9e08", "0x5b20"];
const NULL = -1;

// Geometry of the SVG row: [null] node node node node [null]
const PAD = 12;
const TOP = 50;
const NODE_H = 40;
const VALUE_W = 34;
const NEXT_W = 58;
const NODE_W = VALUE_W + NEXT_W;
const GAP = 30;
const NULL_W = 38;
const MID_Y = TOP + NODE_H / 2;
const TAG_Y = TOP - 26;

const LEFT_NULL_X = PAD;
const nodeX = (i: number) => LEFT_NULL_X + NULL_W + GAP + i * (NODE_W + GAP);
const RIGHT_NULL_X = nodeX(VALUES.length - 1) + NODE_W + GAP;
const WIDTH = RIGHT_NULL_X + NULL_W + PAD;
const HEIGHT = 118;

const addressOf = (i: number) => (i === NULL ? "null" : ADDRESSES[i]);
const describe = (i: number) =>
  i === NULL ? "null" : `${ADDRESSES[i]} (${VALUES[i]})`;

interface ListState {
  next: number[];
  prev: number;
  curr: number;
  /** Node the `head` variable is shown on, when it is worth showing. */
  head: number | null;
  /** Node whose `next` field was rewritten on this step. */
  rewired: number | null;
  finished: boolean;
}

function NullBox({ x, tags }: { x: number; tags?: Pointer[] }) {
  return (
    <g>
      <SvgTags x={x + NULL_W / 2} y={TAG_Y} tags={tags} />
      <rect
        x={x}
        y={MID_Y - 13}
        width={NULL_W}
        height={26}
        rx={6}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        className="fill-none stroke-outline-variant"
      />
      <text
        x={x + NULL_W / 2}
        y={MID_Y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-on-surface-variant font-code-sm text-code-sm"
      >
        null
      </text>
    </g>
  );
}

function ListView({ state }: { state: ListState }) {
  const { next, prev, curr, head, rewired, finished } = state;
  // Reversal walks left to right, so nodes 0..prev are already flipped.
  const isReversed = (i: number) => finished || i <= prev;

  const tagsFor = (i: number) => {
    const tags: Pointer[] = [];
    if (i === head) tags.push({ label: "head", tone: "secondary" });
    if (i === prev && !finished) tags.push({ label: "prev", tone: "tertiary" });
    if (i === curr) tags.push({ label: "curr", tone: "primary" });
    return tags;
  };

  return (
    <Canvas width={WIDTH} height={HEIGHT}>
      {/* Pointers first so the node boxes sit on top of them. */}
      {VALUES.map((_, i) => {
        const target = next[i];
        const x = nodeX(i);
        const color = EDGE_TEXT[i === rewired ? "active" : "idle"];
        const fromField = x + VALUE_W + NEXT_W / 2;

        if (target === i + 1 || (target === NULL && !isReversed(i))) {
          const toX = target === NULL ? RIGHT_NULL_X : nodeX(i + 1);
          return (
            <Arrow
              key={i}
              x1={x + NODE_W}
              y1={MID_Y}
              x2={toX - 2}
              y2={MID_Y}
              className={color}
            />
          );
        }
        if (target === i - 1 || target === NULL) {
          // A flipped pointer points backwards, so it bows underneath the row.
          const toX =
            target === NULL
              ? LEFT_NULL_X + NULL_W / 2
              : nodeX(i - 1) + NODE_W / 2;
          const toY = target === NULL ? MID_Y + 15 : TOP + NODE_H + 2;
          return (
            <CurvedArrow
              key={i}
              x1={fromField}
              y1={TOP + NODE_H}
              x2={toX}
              y2={toY}
              bend={34}
              className={color}
            />
          );
        }
        return null;
      })}

      <NullBox
        x={LEFT_NULL_X}
        tags={prev === NULL ? [{ label: "prev", tone: "tertiary" }] : undefined}
      />
      <NullBox
        x={RIGHT_NULL_X}
        tags={
          curr === NULL && !finished
            ? [{ label: "curr", tone: "primary" }]
            : undefined
        }
      />

      {VALUES.map((value, i) => {
        const x = nodeX(i);
        let tone: NodeTone = isReversed(i) ? "done" : "idle";
        if (i === curr) tone = "primary";
        const classes = NODE_TONES[tone];

        return (
          <g key={value}>
            <SvgTags x={x + NODE_W / 2} y={TAG_Y} tags={tagsFor(i)} />
            <text
              x={x + NODE_W / 2}
              y={TOP - 8}
              textAnchor="middle"
              className="fill-on-surface-variant font-code-sm text-[10px]"
            >
              @{ADDRESSES[i]}
            </text>
            <rect
              x={x}
              y={TOP}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              className="fill-surface-container-lowest"
            />
            <rect
              x={x}
              y={TOP}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              strokeWidth={1.5}
              className={`transition-colors duration-300 ${classes.shape}`}
            />
            <line
              x1={x + VALUE_W}
              y1={TOP}
              x2={x + VALUE_W}
              y2={TOP + NODE_H}
              strokeWidth={1.5}
              className={`transition-colors duration-300 ${classes.shape}`}
            />
            {i === rewired && (
              <rect
                x={x + VALUE_W + 3}
                y={TOP + 3}
                width={NEXT_W - 6}
                height={NODE_H - 6}
                rx={5}
                className="fill-primary-container"
              />
            )}
            <text
              x={x + VALUE_W / 2}
              y={MID_Y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-code-md text-code-md font-semibold ${classes.text}`}
            >
              {value}
            </text>
            <text
              x={x + VALUE_W + NEXT_W / 2}
              y={MID_Y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-code-sm text-code-sm ${
                i === rewired ? "fill-on-primary" : "fill-on-surface-variant"
              }`}
            >
              {addressOf(next[i])}
            </text>
          </g>
        );
      })}
    </Canvas>
  );
}

function trace(): SimulationStep[] {
  const next = VALUES.map((_, i) => (i + 1 < VALUES.length ? i + 1 : NULL));
  const steps: SimulationStep[] = [];
  let prev = NULL;
  let curr = 0;

  const snapshot = ({
    note,
    head = null,
    rewired = null,
    lastWrite,
    finished = false,
  }: {
    note: string;
    head?: number | null;
    rewired?: number | null;
    lastWrite: string;
    finished?: boolean;
  }) => {
    steps.push({
      visual: (
        <ListView
          state={{ next: [...next], prev, curr, head, rewired, finished }}
        />
      ),
      registers: [
        { label: "[REGISTER] prev:", value: describe(prev), tone: "tertiary" },
        { label: "[REGISTER] curr:", value: describe(curr), tone: "primary" },
        { label: "Last pointer write:", value: lastWrite },
      ],
      note,
      status: finished ? "LIST REVERSED" : undefined,
    });
  };

  snapshot({
    note: `Four nodes sit at scattered heap addresses, chained only by the address stored in each \`next\` field. Start with \`prev = null\` and \`curr = head\` (${ADDRESSES[0]}).`,
    head: 0,
    lastWrite: "—",
  });

  let writes = 0;
  while (curr !== NULL) {
    const node = curr;
    const saved = next[node];
    next[node] = prev;
    writes++;
    prev = node;
    curr = saved;

    const saving =
      saved === NULL
        ? `Saved \`next = curr.next\` (null — ${VALUES[node]} is the last node)`
        : `Saved \`next = curr.next\` (${addressOf(saved)}) so the rest of the list isn't lost`;
    snapshot({
      note: `${saving}, then rewired \`${VALUES[node]}.next\` from ${addressOf(saved)} to ${addressOf(next[node])}. Advanced \`prev\` to ${VALUES[prev]} and \`curr\` to ${curr === NULL ? "null" : VALUES[curr]}.`,
      rewired: node,
      lastWrite: `${VALUES[node]}.next = ${addressOf(next[node])}`,
    });
  }

  const order: number[] = [];
  for (let i = prev; i !== NULL; i = next[i]) order.push(VALUES[i]);
  snapshot({
    note: `\`curr\` is null, so the loop exits and \`head = prev\` (${ADDRESSES[prev]}). The list now reads ${order.join(" → ")} → null. No node moved in memory — only ${writes} \`next\` fields were rewritten: O(n) time, O(1) extra space.`,
    head: prev,
    lastWrite: `head = ${ADDRESSES[prev]}`,
    finished: true,
  });

  return steps;
}

export const singlyLinkedListSimulation: Simulation = {
  algorithm: "Reverse a Linked List",
  lead: "Nodes are scattered across the heap and held together only by the addresses in their next fields.",
  input: {
    label: "Input List:",
    value: `head = ${VALUES.join(" → ")}`,
    rule: "Save `next = curr.next`, point `curr.next` back at `prev`, then advance both: `prev = curr`, `curr = next`.",
  },
  buffer: `heap_nodes[${VALUES.length}] · non-contiguous`,
  badge: "O(1) Memory",
  steps: trace(),
};
