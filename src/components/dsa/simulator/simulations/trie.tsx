import {
  NodeDiagram,
  VisualLabel,
  type DiagramEdge,
  type DiagramNode,
  type NodeTone,
} from "../visuals";
import type { Simulation, SimulationStep } from "../types";

const EXISTING = ["cat", "cup"];
const WORD = "cap";
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
/** Handed out in allocation order. */
const ADDRESSES = ["0x8a00", "0x8a60", "0x8ac0", "0x8b20", "0x8b80", "0x8be0", "0x8c40"];

/** Keyed by the prefix each node spells; "" is the root. */
const POSITIONS: Record<string, { x: number; y: number }> = {
  "": { x: 180, y: 36 },
  c: { x: 180, y: 96 },
  ca: { x: 120, y: 156 },
  cu: { x: 250, y: 156 },
  cat: { x: 80, y: 216 },
  cap: { x: 160, y: 216 },
  cup: { x: 250, y: 216 },
};

interface TrieNode {
  children: Record<string, string>;
  end: boolean;
  address: string;
}
type Trie = Record<string, TrieNode>;

const slotOf = (ch: string) => ch.charCodeAt(0) - "a".charCodeAt(0);
const nameOf = (prefix: string) =>
  prefix === "" ? "root" : `'${prefix[prefix.length - 1]}'`;
const copyTrie = (trie: Trie): Trie =>
  Object.fromEntries(
    Object.entries(trie).map(([k, n]) => [
      k,
      { ...n, children: { ...n.children } },
    ])
  );

interface InsertState {
  trie: Trie;
  curr: string;
  /** Nodes already walked through, root first. */
  path: string[];
  lookup: string | null;
  created: string | null;
  finished: boolean;
}

function ChildrenStrip({ state }: { state: InsertState }) {
  const { trie, curr, lookup, created } = state;
  const children = trie[curr].children;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-space-sm">
        <VisualLabel>{nameOf(curr)}.children[26]</VisualLabel>
        <span className="font-code-sm text-code-sm text-on-surface-variant">
          {lookup ? (
            <>
              children[&apos;{lookup}&apos; - &apos;a&apos;] = children[
              {slotOf(lookup)}]
            </>
          ) : (
            `${LETTERS.length - Object.keys(children).length} of ${LETTERS.length} slots null`
          )}
        </span>
      </div>
      <div className="mt-space-xs grid grid-cols-[repeat(26,minmax(0,1fr))] gap-px">
        {LETTERS.map((ch) => {
          const filled = ch in children;
          const isLookup = ch === lookup;
          const tone = isLookup
            ? created
              ? "bg-primary-container"
              : "bg-primary"
            : filled
              ? "bg-primary-fixed-dim"
              : "bg-surface-container-high";
          return (
            <div key={ch} className="flex flex-col items-center gap-0.5">
              <div
                className={`h-5 w-full rounded-sm transition-colors duration-300 ${tone}`}
              />
              <span
                className={`font-code-sm text-[9px] leading-none ${
                  isLookup
                    ? "font-semibold text-primary"
                    : "text-on-surface-variant/60"
                }`}
              >
                {ch}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrieView({ state }: { state: InsertState }) {
  const { trie, curr, path, lookup, created, finished } = state;
  const walked = new Set(path);
  const target = lookup ? trie[curr].children[lookup] : undefined;

  const nodes: DiagramNode[] = Object.entries(trie).map(([prefix, node]) => {
    let tone: NodeTone = "idle";
    if (walked.has(prefix)) tone = "done";
    if (prefix === curr) tone = finished ? "success" : "primary";
    if (prefix === created) tone = "write";
    return {
      id: prefix || "root",
      ...POSITIONS[prefix],
      label: prefix === "" ? "•" : prefix[prefix.length - 1],
      tone,
      ring: node.end,
      caption: prefix === "" ? `root ${node.address}` : node.address,
      tags: prefix === curr ? [{ label: "curr", tone: "primary" }] : undefined,
    };
  });

  const edges: DiagramEdge[] = Object.entries(trie).flatMap(([prefix, node]) =>
    Object.values(node.children).map((child) => ({
      from: prefix || "root",
      to: child,
      tone:
        child === created
          ? "write"
          : prefix === curr && child === target
            ? "active"
            : walked.has(prefix) && (walked.has(child) || child === curr)
              ? "done"
              : "idle",
    }))
  );

  return (
    <div className="flex flex-col gap-space-md">
      <NodeDiagram width={330} height={256} nodes={nodes} edges={edges} />
      <ChildrenStrip state={state} />
    </div>
  );
}

function trace(): SimulationStep[] {
  const trie: Trie = {};
  let allocated = 0;
  const allocate = (prefix: string) => {
    trie[prefix] = { children: {}, end: false, address: ADDRESSES[allocated++] };
  };

  allocate("");
  for (const word of EXISTING) {
    let prefix = "";
    for (const ch of word) {
      if (!trie[prefix].children[ch]) {
        allocate(prefix + ch);
        trie[prefix].children[ch] = prefix + ch;
      }
      prefix += ch;
    }
    trie[prefix].end = true;
  }

  const steps: SimulationStep[] = [];
  const path: string[] = [];
  let curr = "";

  const snapshot = ({
    note,
    lookup = null,
    created = null,
    slot,
    i,
    finished = false,
  }: {
    note: string;
    lookup?: string | null;
    created?: string | null;
    slot: string;
    i: number;
    finished?: boolean;
  }) => {
    steps.push({
      visual: (
        <TrieView
          state={{
            trie: copyTrie(trie),
            curr,
            path: [...path],
            lookup,
            created,
            finished,
          }}
        />
      ),
      registers: [
        {
          label: "[REGISTER] curr:",
          value: `${nameOf(curr)} @${trie[curr].address}`,
          tone: "primary",
        },
        {
          label: "[REGISTER] i:",
          value: i < WORD.length ? `${i} → '${WORD[i]}'` : `${i} (end of word)`,
          tone: "tertiary",
        },
        { label: "Slot:", value: slot },
        { label: "Nodes:", value: String(Object.keys(trie).length) },
      ],
      note,
      status: finished ? "WORD INSERTED" : undefined,
    });
  };

  let createdCount = 0;
  for (let i = 0; i < WORD.length; i++) {
    const ch = WORD[i];
    const index = slotOf(ch);
    const prefix = curr + ch;
    const existing = trie[curr].children[ch];
    const opening =
      i === 0
        ? `Each trie node reserves 26 child pointers — one per letter — plus an end-of-word flag. insert("${WORD}") starts at the root. `
        : "";

    if (existing) {
      const sharers = EXISTING.filter((w) => w.startsWith(prefix));
      snapshot({
        i,
        lookup: ch,
        slot: `children[${index}] = ${trie[existing].address}`,
        note: `${opening}i = ${i} is '${ch}': \`children[${index}]\` of the ${nameOf(curr)} node already holds ${trie[existing].address}, a node shared with ${sharers.map((w) => `"${w}"`).join(" and ")}. Follow it — the prefix "${prefix}" costs no new memory.`,
      });
      path.push(curr);
      curr = existing;
      continue;
    }

    allocate(prefix);
    trie[curr].children[ch] = prefix;
    createdCount++;
    snapshot({
      i,
      lookup: ch,
      created: prefix,
      slot: `children[${index}]: null → ${trie[prefix].address}`,
      note: `${opening}i = ${i} is '${ch}': \`children[${index}]\` of the ${nameOf(curr)} node is null — no stored word continues "${curr}" with '${ch}'. Allocate a node at ${trie[prefix].address} and write its address into that slot.`,
    });
    path.push(curr);
    curr = prefix;
  }

  trie[curr].end = true;
  const shared = WORD.length - createdCount;
  snapshot({
    i: WORD.length,
    finished: true,
    slot: "isEnd = true",
    note: `All ${WORD.length} characters are placed, so set \`isEnd = true\` on the last node. Only ${createdCount} node${createdCount === 1 ? " was" : "s were"} allocated; ${shared} ${shared === 1 ? "was" : "were"} shared with existing words. The new node's own 26 child slots are all still null — tries buy fast prefix sharing with memory.`,
  });

  return steps;
}

export const trieSimulation: Simulation = {
  algorithm: "Trie Insert",
  lead: "A trie spends 26 pointer slots on every node so that shared prefixes are stored exactly once.",
  input: {
    label: "Insert word:",
    value: `insert("${WORD}")`,
    rule: "For each character, follow `children[ch - 'a']`. If that slot is null, allocate a node there. After the last character, mark `isEnd = true`.",
  },
  buffer: "trie_nodes · 26 slots each",
  badge: "O(L) Insert",
  steps: trace(),
};
