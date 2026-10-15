import { lineOf } from "../graphs";
import { dlinked, mapView, tagsAt, type DNodeState } from "../structures";
import { recorder, type Program } from "../types";

const code = `class Entry {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();              // key -> its node, so any entry is found in O(1)
    this.head = new Entry(0, 0);       // sentinels: head.next is the most recently used,
    this.tail = new Entry(0, 0);       // tail.prev the least recently used
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  remove(node) {                       // unlink a node in O(1)
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  addFront(node) {                     // insert right after the head sentinel
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }
  get(key) {
    const node = this.map.get(key);
    if (node === undefined) return -1;
    this.remove(node);                 // it was just used: move it to the front
    this.addFront(node);
    return node.value;
  }
  put(key, value) {
    if (this.map.has(key)) this.remove(this.map.get(key));
    const node = new Entry(key, value);
    this.map.set(key, node);
    this.addFront(node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;      // the least recently used is at the back
      this.remove(lru);
      this.map.delete(lru.key);
    }
  }
}`;

type Op = { name: "get"; key: number } | { name: "put"; key: number; value: number };

function parse(text: string): Op[] | string {
  const parts = text.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "Enter at least one operation, like put 1 10.";
  if (parts.length > 10) return "Use at most 10 operations so every step stays readable.";
  const ops: Op[] = [];
  const num = (s: string | undefined) => (s !== undefined && /^\d{1,2}$/.test(s) ? Number(s) : null);
  for (const part of parts) {
    const [name, a, b, ...rest] = part.split(/\s+/);
    if (rest.length > 0) return `"${part}": use put <key> <value> or get <key>.`;
    if (name === "get" && num(a) !== null && b === undefined) ops.push({ name, key: num(a)! });
    else if (name === "put" && num(a) !== null && num(b) !== null) ops.push({ name, key: num(a)!, value: num(b)! });
    else return `"${part}": use put <key> <value> or get <key>, with numbers from 0 to 99.`;
  }
  return ops;
}

const HEAD = 1000;
const TAIL = 1001;

const program: Program = {
  title: "LRU cache: hash map + doubly linked list",
  code,
  fields: [
    { key: "capacity", label: "capacity", kind: "number", min: 1, max: 4 },
    { key: "ops", label: "operations", kind: "text", maxLength: 120, hint: "put 1 1, put 2 2, get 1, put 3 3, get 2" },
  ],
  examples: [
    { label: "Example", input: { capacity: 2, ops: "put 1 1, put 2 2, get 1, put 3 3, get 2, put 4 4, get 1, get 3, get 4" } },
    { label: "Update a key", input: { capacity: 2, ops: "put 1 10, put 2 20, put 1 15, put 3 30, get 2, get 1" } },
  ],
  check(input) {
    const ops = parse(input.ops as string);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const capacity = input.capacity as number;
    const ops = parse(input.ops as string) as Op[];
    const r = recorder();
    const values = new Map<number, number>(); // key -> value; recency is kept in order
    let order: number[] = []; // keys, most recently used first

    const frame = (hot: string[] = [], touched: number | null = null, evicted: number | null = null, vars: Record<string, unknown> = {}) => {
      const ids = [HEAD, ...order, TAIL];
      const chain: DNodeState[] = ids.map((id, i) => ({
        id,
        value: id === HEAD ? "head" : id === TAIL ? "tail" : `${id}=${values.get(id)}`,
        prev: i > 0 ? ids[i - 1] : null,
        next: i + 1 < ids.length ? ids[i + 1] : null,
      }));
      const shown = new Map(order.map((k) => [k, `node ${k}=${values.get(k)}`]));
      return {
        lists: [
          dlinked("list (most recent first)", chain, {
            ends: false,
            tones: { [HEAD]: "muted", [TAIL]: "muted", ...(touched !== null ? { [touched]: "write" as const } : {}) },
            pointers: tagsAt(order.length > 0 ? { MRU: order[0], LRU: order[order.length - 1] } : {}, { LRU: "tertiary", MRU: "secondary" }),
            hot,
          }),
        ],
        maps: [mapView("map", shown, { keyLabel: "key", valueLabel: "node", marks: touched !== null && shown.has(touched) ? [[touched, "write"]] : [] })],
        vars: { capacity, size: order.length, ...(evicted !== null ? { evicted: evicted } : {}), ...vars },
      };
    };
    const linksOf = (key: number) => {
      const i = order.indexOf(key);
      const before = i === 0 ? HEAD : order[i - 1];
      const after = i === order.length - 1 ? TAIL : order[i + 1];
      return [`${key}.prev`, `${key}.next`, `${before}.next`, `${after}.prev`];
    };

    r.step(lineOf(code, "this.head.next = this.tail;"), `Two structures work together. The **doubly linked list** keeps entries in order of use — most recent right after **head**, least recent right before **tail** (two dummy sentinel nodes, so there are no null checks). The **map** finds any key's node in O(1). Capacity ${capacity}.`, frame());
    for (const op of ops) {
      if (op.name === "get") {
        if (!values.has(op.key)) {
          r.step(lineOf(code, "if (node === undefined) return -1"), `**get ${op.key}**: not in the map → return **-1**. Nothing moves.`, frame([], null, null, { returned: -1 }));
          continue;
        }
        order = [op.key, ...order.filter((k) => k !== op.key)];
        r.step(
          lineOf(code, "// it was just used: move it to the front"),
          `**get ${op.key}**: the map gives its node at once. It was just used, so **unlink** it (two pointers) and **add it at the front** (four pointers) — all O(1). Return **${values.get(op.key)}**.`,
          frame(linksOf(op.key), op.key, null, { returned: values.get(op.key) })
        );
      } else {
        const existed = values.has(op.key);
        values.set(op.key, op.value);
        order = [op.key, ...order.filter((k) => k !== op.key)];
        r.step(
          lineOf(code, existed ? "if (this.map.has(key)) this.remove" : "this.map.set(key, node);"),
          existed
            ? `**put ${op.key} ${op.value}**: ${op.key} is already cached, so remove its old node and add a fresh one with the new value at the front.`
            : `**put ${op.key} ${op.value}**: a new entry goes at the **front** — it's the most recently used — and into the map.`,
          frame(linksOf(op.key), op.key)
        );
        if (order.length > capacity) {
          const lru = order[order.length - 1];
          const before = order.length >= 2 ? order[order.length - 2] : HEAD;
          order = order.slice(0, -1);
          const evictedValue = values.get(lru);
          values.delete(lru);
          r.step(
            lineOf(code, "const lru = this.tail.prev;"),
            `Now ${order.length + 1} entries exceed the capacity of ${capacity}. The least recently used is **tail.prev**: key ${lru} (value ${evictedValue}). Unlink it and delete it from the map — O(1), no search.`,
            frame([`${before}.next`, `${TAIL}.prev`], null, lru)
          );
        }
      }
    }
    r.step(lineOf(code, "put(key, value) {"), `Every get and put was **O(1)**: the map jumps to a node, and the doubly linked list moves or removes it without searching. Space is **O(capacity)**.`, { ...frame(), done: true });
    return r.frames;
  },
};

export default program;
