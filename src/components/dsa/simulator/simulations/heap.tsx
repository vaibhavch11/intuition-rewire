import {
  MemoryCells,
  NodeDiagram,
  VisualLabel,
  type CellTone,
  type DiagramEdge,
  type DiagramNode,
} from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const INITIAL = [2, 4, 3, 7, 9, 5, 8];
const PUSH = 1;
const CAPACITY = INITIAL.length + 1;

const WIDTH = 440;
const HEIGHT = 236;
const parentOf = (i: number) => Math.floor((i - 1) / 2);

/** Position of index i in the implicit complete binary tree. */
function position(i: number) {
  const level = Math.floor(Math.log2(i + 1));
  const offset = i - (2 ** level - 1);
  return {
    x: Math.round(((offset + 0.5) * WIDTH) / 2 ** level),
    y: 34 + level * 56,
  };
}

interface HeapState {
  heap: number[];
  /** Index of the value being sifted up. */
  moving: number | null;
  /** Index of the parent it is compared against. */
  parent: number | null;
  settled: boolean;
}

/** Shared by the tree and the array so both views always agree. */
function toneAt(
  state: HeapState,
  i: number
): Extract<CellTone, "idle" | "primary" | "tertiary" | "success"> {
  if (state.settled && i === state.moving) return "success";
  if (i === state.moving) return "primary";
  if (i === state.parent) return "tertiary";
  return "idle";
}

function HeapView({ state }: { state: HeapState }) {
  const { heap, moving, parent } = state;

  const nodes: DiagramNode[] = heap.map((value, i) => ({
    id: String(i),
    ...position(i),
    label: String(value),
    tone: toneAt(state, i),
    caption: `[${i}]`,
    tags: i === moving ? [{ label: "i", tone: "primary" }] : undefined,
  }));
  const edges: DiagramEdge[] = heap.slice(1).map((_, k) => {
    const child = k + 1;
    const p = parentOf(child);
    return {
      from: String(p),
      to: String(child),
      tone: child === moving && p === parent ? "active" : "idle",
    };
  });

  return (
    <div className="flex flex-col gap-space-md">
      <div>
        <VisualLabel>logical view · tree</VisualLabel>
        <NodeDiagram
          width={WIDTH}
          height={HEIGHT}
          nodes={nodes}
          edges={edges}
          radius={17}
        />
      </div>
      <div>
        <VisualLabel>physical view · heap_array</VisualLabel>
        <div className="mt-space-xs">
          <MemoryCells
            cells={Array.from({ length: CAPACITY }, (_, i) => ({
              value: heap[i] ?? "",
              tone: i < heap.length ? toneAt(state, i) : "empty",
              pointers:
                i === moving
                  ? [{ label: "i", tone: "primary" }]
                  : i === parent
                    ? [{ label: "parent", tone: "tertiary" }]
                    : undefined,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function trace(): SimulationStep[] {
  const heap = [...INITIAL];
  const steps: SimulationStep[] = [];

  const snapshot = ({
    note,
    moving = null,
    parent = null,
    compare,
    settled = false,
  }: {
    note: string;
    moving?: number | null;
    parent?: number | null;
    compare: string;
    settled?: boolean;
  }) => {
    steps.push({
      visual: (
        <HeapView state={{ heap: [...heap], moving, parent, settled }} />
      ),
      registers: [
        {
          label: "[REGISTER] i:",
          value: moving === null ? "—" : `${moving} (val ${heap[moving]})`,
          tone: "primary",
        },
        {
          label: "[REGISTER] parent:",
          value:
            parent === null
              ? moving === 0
                ? "— (root)"
                : "—"
              : `${parent} (val ${heap[parent]})`,
          tone: "tertiary",
        },
        { label: "Compare:", value: compare },
        { label: "Size:", value: String(heap.length) },
      ],
      note,
      status: settled ? "HEAP PROPERTY RESTORED" : undefined,
    });
  };

  snapshot({
    compare: "—",
    note: "The tree is only a way of looking at it: the heap is the flat array below. Node `i` keeps its children at `2i + 1` and `2i + 2` and its parent at `(i - 1) / 2` — no pointers are stored at all.",
  });

  heap.push(PUSH);
  let i = heap.length - 1;
  let p = parentOf(i);
  const mustSwap = heap[i] < heap[p];
  snapshot({
    moving: i,
    parent: p,
    settled: !mustSwap,
    compare: `${heap[i]} ${mustSwap ? "<" : "≥"} ${heap[p]} → ${mustSwap ? "swap" : "stop"}`,
    note: `push(${PUSH}) writes ${PUSH} into the first free slot, arr[${i}] — automatically the next leaf, child of index (${i} - 1) / 2 = ${p}. Compare with that parent: ${
      mustSwap
        ? `${heap[i]} < ${heap[p]}, so they must swap.`
        : `${heap[i]} ≥ ${heap[p]}, so the heap property already holds.`
    }`,
  });

  let swaps = 0;
  while (i > 0 && heap[i] < heap[parentOf(i)]) {
    p = parentOf(i);
    [heap[i], heap[p]] = [heap[p], heap[i]];
    swaps++;
    const from = i;
    i = p;

    if (i === 0) {
      snapshot({
        moving: i,
        compare: "reached the root",
        settled: true,
        note: `Swapped arr[${from}] ↔ arr[${i}]. Index 0 is the root, so sift-up stops: ${swaps} swaps for ${heap.length} elements, one per level of the tree — O(log n). The minimum is back at arr[0].`,
      });
      break;
    }

    const next = parentOf(i);
    const keepGoing = heap[i] < heap[next];
    snapshot({
      moving: i,
      parent: next,
      settled: !keepGoing,
      compare: `${heap[i]} ${keepGoing ? "<" : "≥"} ${heap[next]} → ${keepGoing ? "swap" : "stop"}`,
      note: `Swapped arr[${from}] ↔ arr[${i}]. ${heap[i]} now sits at index ${i}; its parent (${i} - 1) / 2 = ${next} holds ${heap[next]}. ${
        keepGoing
          ? `${heap[i]} < ${heap[next]}, so swap again.`
          : `${heap[i]} ≥ ${heap[next]}, so the heap property holds and sift-up stops after ${swaps} swap${swaps === 1 ? "" : "s"}.`
      }`,
    });
  }

  return steps;
}

export const heapSimulation: Simulation = {
  algorithm: "Min-Heap Push (Sift-Up)",
  lead: "A heap is a tree with no pointers — index arithmetic over a flat array does all the linking.",
  input: {
    label: "Input:",
    value: `heap = [${INITIAL.join(", ")}], push(${PUSH})`,
    rule: "Write the new value at the end of the array, then sift up: while it is smaller than its parent at `(i - 1) / 2`, swap the two.",
  },
  buffer: `heap_array[${CAPACITY}] · implicit tree`,
  badge: "O(log n) Push",
  output: { label: "Heap array", value: "[1, 2, 3, 4, 9, 5, 8, 7]" },
  steps: trace(),
};
