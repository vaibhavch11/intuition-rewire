import { MemoryCells, type Cell, type CellTone, type Pointer } from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const SIZE = 7;
const KEYS = [10, 22, 31, 4, 15];
const LOOKUP = 4;

const hash = (key: number) => key % SIZE;

function trace(): SimulationStep[] {
  const table: (number | null)[] = Array(SIZE).fill(null);
  const steps: SimulationStep[] = [];

  const snapshot = ({
    note,
    key,
    probes = [],
    found,
    status,
  }: {
    note: string;
    key?: number;
    /** Buckets inspected, in order; the last one is where the key landed. */
    probes?: number[];
    found?: boolean;
    status?: string;
  }) => {
    const slots = [...table];
    const last = probes[probes.length - 1];
    const cells: Cell[] = slots.map((value, i) => {
      let tone: CellTone = value === null ? "empty" : "idle";
      let pointers: Pointer[] | undefined;
      if (probes.includes(i)) {
        // Every bucket before the last one was a collision.
        tone = i === last ? (found ? "success" : "write") : "tertiary";
        pointers = [
          {
            label: i === probes[0] ? "h(k)" : "+1",
            tone: i === last ? "primary" : "tertiary",
          },
        ];
      }
      return { value: value ?? "", tone, pointers };
    });
    const used = slots.filter((v) => v !== null).length;

    steps.push({
      visual: <MemoryCells cells={cells} />,
      registers: [
        {
          label: "[REGISTER] key:",
          value: key === undefined ? "—" : String(key),
          tone: "primary",
        },
        {
          label: "Hash h(k):",
          value:
            key === undefined ? "—" : `${key} % ${SIZE} = ${hash(key)}`,
          tone: "tertiary",
        },
        {
          label: "Probe path:",
          value: probes.length ? probes.join(" → ") : "—",
        },
        { label: "Load factor:", value: `${used} / ${SIZE}` },
      ],
      note,
      status,
    });
  };

  snapshot({
    note: `A hash table is a plain contiguous array of buckets. \`h(k) = k % ${SIZE}\` turns any key into a bucket index with one division — no searching.`,
  });

  for (const key of KEYS) {
    const probes = [hash(key)];
    while (table[probes[probes.length - 1]] !== null) {
      probes.push((probes[probes.length - 1] + 1) % SIZE);
    }
    const slot = probes[probes.length - 1];
    const blockers = probes
      .slice(0, -1)
      .map((i) => `bucket ${i} (${table[i]})`)
      .join(", then ");
    table[slot] = key;

    snapshot({
      key,
      probes,
      note:
        probes.length === 1
          ? `insert(${key}): h(${key}) = ${key} % ${SIZE} = ${slot}. Bucket ${slot} is empty, so ${key} is written straight into it — one memory access.`
          : `insert(${key}): h(${key}) = ${key} % ${SIZE} = ${probes[0]}, but ${blockers} ${probes.length > 2 ? "are" : "is"} taken — a collision. Linear probing walks on to bucket ${slot}, which is free, so ${key} lands there.`,
    });
  }

  const probes = [hash(LOOKUP)];
  while (
    table[probes[probes.length - 1]] !== LOOKUP &&
    table[probes[probes.length - 1]] !== null
  ) {
    probes.push((probes[probes.length - 1] + 1) % SIZE);
  }
  const slot = probes[probes.length - 1];
  const found = table[slot] === LOOKUP;
  const detours = probes
    .slice(0, -1)
    .map((i) => `bucket ${i} holds ${table[i]}`)
    .join(", ");
  snapshot({
    key: LOOKUP,
    probes,
    found,
    note: `lookup(${LOOKUP}): h(${LOOKUP}) = ${probes[0]}${detours ? `, but ${detours} — pushed there by an earlier collision` : ""}. Probing on to bucket ${slot} ${found ? `finds ${LOOKUP}` : "hits an empty bucket, so the key is absent"} after ${probes.length} probe${probes.length === 1 ? "" : "s"}. Fuller tables grow longer clusters, which is why load factor matters.`,
    status: found ? "KEY FOUND" : "KEY ABSENT",
  });

  return steps;
}

export const hashTableSimulation: Simulation = {
  algorithm: "Linear Probing (Open Addressing)",
  lead: "A hash table is just an array plus a function that turns keys into indices.",
  input: {
    label: "Keys:",
    value: KEYS.join(", "),
    rule: `Store key \`k\` at bucket \`k % ${SIZE}\`. If that bucket is taken, probe the next one (\`i + 1\`, wrapping around) until an empty bucket turns up. Lookups follow the same path.`,
  },
  buffer: `bucket_array[${SIZE}]`,
  badge: "O(1) Avg Lookup",
  output: { label: "get(4)", value: "found in bucket 5" },
  steps: trace(),
};
