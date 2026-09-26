import {
  Arrow,
  Canvas,
  EDGE_TEXT,
  NODE_TONES,
  SvgTags,
  type NodeTone,
  type Pointer,
} from "../visuals";
import type { Simulation, SimulationStep } from "../types";

/** Indices 0–3 are the list; index 4 is the node being spliced in. */
const VALUES = [10, 20, 30, 40, 25];
const ADDRESSES = ["0x7a10", "0x3c40", "0x9e08", "0x5b20", "0x6d30"];
const MAIN = [0, 1, 2, 3];
const NODE = 1;
const FRESH = 4;
const NULL = -1;

type Field = "prev" | "next";

// Geometry: [null] [prev|val|next] … [null], with the new node below.
const PAD = 12;
const TOP = 50;
const NODE_H = 40;
const FIELD_W = 20;
const VALUE_W = 34;
const NODE_W = FIELD_W * 2 + VALUE_W;
const GAP = 56;
const NULL_W = 38;
const NULL_GAP = 30;
const NEXT_Y = TOP + 13;
const PREV_Y = TOP + 27;
const MID_Y = TOP + NODE_H / 2;
const TAG_Y = TOP - 26;

const LEFT_NULL_X = PAD;
const mainX = (i: number) =>
  LEFT_NULL_X + NULL_W + NULL_GAP + i * (NODE_W + GAP);
const RIGHT_NULL_X = mainX(MAIN.length - 1) + NODE_W + NULL_GAP;
const WIDTH = RIGHT_NULL_X + NULL_W + PAD;

const FRESH_TOP = 150;
const FRESH_X = Math.round(
  (mainX(NODE) + NODE_W + mainX(NODE + 1)) / 2 - NODE_W / 2
);
const HEIGHT = FRESH_TOP + NODE_H + 38;

const boxX = (n: number) => (n === FRESH ? FRESH_X : mainX(n));
const boxTop = (n: number) => (n === FRESH ? FRESH_TOP : TOP);
const fieldX = (n: number, field: Field) =>
  field === "prev" ? boxX(n) + FIELD_W / 2 : boxX(n) + NODE_W - FIELD_W / 2;
/** Where a pointer's arrow leaves its field. */
const fieldY = (n: number, field: Field) =>
  n === FRESH ? FRESH_TOP + NODE_H / 2 : field === "next" ? NEXT_Y : PREV_Y;

const describe = (n: number) => `${ADDRESSES[n]} (${VALUES[n]})`;
const addressOf = (n: number) => (n === NULL ? "null" : ADDRESSES[n]);

/** Start and end of the arrow for `n.field = target`, or null if none is drawn. */
function pointerGeometry(n: number, field: Field, target: number) {
  const x1 = fieldX(n, field);
  const y1 = fieldY(n, field);

  if (n === FRESH) {
    if (target === NULL) return null;
    const x2 =
      field === "prev" ? mainX(target) + 26 : mainX(target) + NODE_W - 26;
    return { x1, y1, x2, y2: TOP + NODE_H + 2 };
  }
  if (target === FRESH) {
    const x2 = field === "next" ? FRESH_X + 22 : FRESH_X + NODE_W - 22;
    return { x1, y1, x2, y2: FRESH_TOP - 2 };
  }
  if (field === "next") {
    const x2 = target === NULL ? RIGHT_NULL_X : mainX(target);
    return { x1, y1, x2: x2 - 2, y2: y1 };
  }
  const x2 = target === NULL ? LEFT_NULL_X + NULL_W : mainX(target) + NODE_W;
  return { x1, y1, x2: x2 + 2, y2: y1 };
}

interface ListState {
  prev: number[];
  next: number[];
  written: { node: number; field: Field } | null;
  finished: boolean;
}

function NullBox({ x }: { x: number }) {
  return (
    <g>
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

function NodeBox({
  n,
  state,
  tone,
  tags,
}: {
  n: number;
  state: ListState;
  tone: NodeTone;
  tags?: Pointer[];
}) {
  const x = boxX(n);
  const top = boxTop(n);
  const classes = NODE_TONES[tone];

  const renderField = (field: Field) => {
    const target = (field === "prev" ? state.prev : state.next)[n];
    const isWritten =
      state.written?.node === n && state.written.field === field;
    const cx = fieldX(n, field);
    return (
      <g key={field}>
        {isWritten && (
          <rect
            x={cx - FIELD_W / 2 + 2}
            y={top + 2}
            width={FIELD_W - 4}
            height={NODE_H - 4}
            rx={4}
            className="fill-primary-container"
          />
        )}
        {pointerGeometry(n, field, target) ? (
          <circle
            cx={cx}
            cy={fieldY(n, field)}
            r={2.5}
            className={isWritten ? "fill-on-primary" : "fill-on-surface-variant"}
          />
        ) : (
          <text
            x={cx}
            y={top + NODE_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-on-surface-variant font-code-sm text-code-sm"
          >
            ∅
          </text>
        )}
      </g>
    );
  };

  return (
    <g>
      {n === FRESH ? (
        <>
          <text
            x={x + NODE_W / 2}
            y={top + NODE_H + 16}
            textAnchor="middle"
            className="fill-tertiary font-code-sm text-code-sm font-semibold"
          >
            ▲ fresh
          </text>
          <text
            x={x + NODE_W / 2}
            y={top + NODE_H + 30}
            textAnchor="middle"
            className="fill-on-surface-variant font-code-sm text-[10px]"
          >
            @{ADDRESSES[n]}
          </text>
        </>
      ) : (
        <>
          <SvgTags x={x + NODE_W / 2} y={TAG_Y} tags={tags} />
          <text
            x={x + NODE_W / 2}
            y={top - 8}
            textAnchor="middle"
            className="fill-on-surface-variant font-code-sm text-[10px]"
          >
            @{ADDRESSES[n]}
          </text>
        </>
      )}
      <rect
        x={x}
        y={top}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        className="fill-surface-container-lowest"
      />
      <rect
        x={x}
        y={top}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        strokeWidth={1.5}
        className={`transition-colors duration-300 ${classes.shape}`}
      />
      {[FIELD_W, FIELD_W + VALUE_W].map((offset) => (
        <line
          key={offset}
          x1={x + offset}
          y1={top}
          x2={x + offset}
          y2={top + NODE_H}
          strokeWidth={1.5}
          className={`transition-colors duration-300 ${classes.shape}`}
        />
      ))}
      {renderField("prev")}
      {renderField("next")}
      <text
        x={x + FIELD_W + VALUE_W / 2}
        y={top + NODE_H / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className={`font-code-md text-code-md font-semibold ${classes.text}`}
      >
        {VALUES[n]}
      </text>
    </g>
  );
}

function ListView({ state }: { state: ListState }) {
  const arrows = [];
  for (const n of [...MAIN, FRESH]) {
    for (const field of ["prev", "next"] as const) {
      const target = (field === "prev" ? state.prev : state.next)[n];
      const geometry = pointerGeometry(n, field, target);
      if (!geometry) continue;
      const isWritten =
        state.written?.node === n && state.written.field === field;
      arrows.push(
        <Arrow
          key={`${n}-${field}`}
          {...geometry}
          className={EDGE_TEXT[isWritten ? "active" : "idle"]}
        />
      );
    }
  }

  return (
    <Canvas width={WIDTH} height={HEIGHT}>
      {/* Pointers first so the node boxes sit on top of them. */}
      {arrows}
      <NullBox x={LEFT_NULL_X} />
      <NullBox x={RIGHT_NULL_X} />
      {MAIN.map((n) => (
        <NodeBox
          key={n}
          n={n}
          state={state}
          tone={state.finished ? "done" : n === NODE ? "primary" : "idle"}
          tags={n === NODE ? [{ label: "node", tone: "primary" }] : undefined}
        />
      ))}
      <NodeBox
        n={FRESH}
        state={state}
        tone={state.finished ? "success" : "tertiary"}
      />
    </Canvas>
  );
}

function trace(): SimulationStep[] {
  const next = [1, 2, 3, NULL, NULL];
  const prev = [NULL, 0, 1, 2, NULL];
  const steps: SimulationStep[] = [];
  let writes = 0;

  const snapshot = (
    note: string,
    written: ListState["written"],
    lastWrite: string,
    finished = false
  ) => {
    steps.push({
      visual: (
        <ListView
          state={{ prev: [...prev], next: [...next], written, finished }}
        />
      ),
      registers: [
        { label: "[REGISTER] node:", value: describe(NODE), tone: "primary" },
        { label: "[REGISTER] fresh:", value: describe(FRESH), tone: "tertiary" },
        { label: "Pointer write:", value: lastWrite },
        { label: "Writes:", value: `${writes} / 4` },
      ],
      note,
      status: finished ? "SPLICED IN O(1)" : undefined,
    });
  };

  snapshot(
    `Each node stores two addresses, \`prev\` and \`next\`. We already hold \`node\` = ${VALUES[NODE]} (${ADDRESSES[NODE]}) and allocate \`fresh\` = ${VALUES[FRESH]} at ${ADDRESSES[FRESH]}; both of its pointers start as null.`,
    null,
    "—"
  );

  prev[FRESH] = NODE;
  writes++;
  snapshot(
    `\`fresh.prev = node\` — ${VALUES[FRESH]} now points back at ${VALUES[NODE]} (${ADDRESSES[NODE]}). The list itself is untouched so far, so walks in either direction still skip ${VALUES[FRESH]}.`,
    { node: FRESH, field: "prev" },
    `fresh.prev = ${ADDRESSES[NODE]}`
  );

  const after = next[NODE];
  next[FRESH] = after;
  writes++;
  snapshot(
    `\`fresh.next = node.next\` — copy ${VALUES[NODE]}'s next address (${ADDRESSES[after]}) into ${VALUES[FRESH]} before anything overwrites it. ${VALUES[FRESH]} now points forward at ${VALUES[after]}.`,
    { node: FRESH, field: "next" },
    `fresh.next = ${ADDRESSES[after]}`
  );

  const oldBack = prev[after];
  prev[after] = FRESH;
  writes++;
  snapshot(
    `\`node.next.prev = fresh\` — ${VALUES[after]}'s prev field changes from ${addressOf(oldBack)} to ${ADDRESSES[FRESH]}. Walking backwards from ${VALUES[after]} now reaches ${VALUES[FRESH]}.`,
    { node: after, field: "prev" },
    `${VALUES[after]}.prev = ${ADDRESSES[FRESH]}`
  );

  next[NODE] = FRESH;
  writes++;
  const order: number[] = [];
  for (let n = 0; n !== NULL; n = next[n]) order.push(VALUES[n]);
  snapshot(
    `\`node.next = fresh\` — ${VALUES[NODE]}'s next field changes from ${ADDRESSES[after]} to ${ADDRESSES[FRESH]}. Forward, the list now reads ${order.join(" → ")}: ${writes} pointer writes and no traversal, so O(1). Doing this write first would have lost ${VALUES[after]}'s address.`,
    { node: NODE, field: "next" },
    `${VALUES[NODE]}.next = ${ADDRESSES[FRESH]}`,
    true
  );

  return steps;
}

export const doublyLinkedListSimulation: Simulation = {
  algorithm: "Insert After a Node",
  lead: "Every node carries two addresses, so splicing one in is a handful of pointer writes — no shifting, no traversal.",
  input: {
    label: "Insert:",
    value: `${VALUES[FRESH]} after node ${VALUES[NODE]}`,
    rule: "Wire the new node first (`fresh.prev`, `fresh.next`), then its neighbours (`node.next.prev`, `node.next`), so no address is overwritten before it has been copied.",
  },
  buffer: `heap_nodes[${VALUES.length}] · prev ⇄ next`,
  badge: "O(1) Insert",
  steps: trace(),
};
