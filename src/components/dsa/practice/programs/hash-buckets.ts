import { cell, recorder, type CellTone, type GridView, type Program, type Scalar } from "../types";

const code = `class HashMap {
  constructor(size) {
    this.buckets = Array.from({ length: size }, () => []);
  }
  index(key) {
    return key % this.buckets.length;           // the hash: key -> bucket number
  }
  put(key, value) {
    const bucket = this.buckets[this.index(key)];
    for (const entry of bucket) {
      if (entry[0] === key) { entry[1] = value; return; }   // already there: overwrite
    }
    bucket.push([key, value]);                  // a new key joins the chain
  }
  get(key) {
    const bucket = this.buckets[this.index(key)];
    for (const entry of bucket) {
      if (entry[0] === key) return entry[1];    // only this one bucket is searched
    }
    return undefined;                           // not in its bucket: not anywhere
  }
}`;

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

const program: Program = {
  title: "Hash buckets with chaining",
  code,
  fields: [
    { key: "keys", label: "keys to put", kind: "array", maxLength: 9, min: 0, max: 99 },
    { key: "size", label: "buckets", kind: "number", min: 2, max: 9 },
    { key: "find", label: "get", kind: "number", min: 0, max: 99 },
  ],
  examples: [
    { label: "Collisions", input: { keys: [10, 22, 31, 4, 15], size: 7, find: 31 } },
    { label: "Overwrite", input: { keys: [5, 12, 5], size: 7, find: 12 } },
    { label: "Missing key", input: { keys: [3, 8, 13], size: 5, find: 18 } },
  ],
  run(input) {
    const keys = input.keys as number[];
    const size = input.size as number;
    const find = input.find as number;
    const r = recorder();
    const buckets: [number, string][][] = Array.from({ length: size }, () => []);
    let next = 0;

    const view = (tones: Record<string, CellTone> = {}): GridView => ({
      name: `buckets (${size} of them; each holds a chain of key→value entries)`,
      // An empty bucket shows as one empty cell.
      values: buckets.map((b): Scalar[] => (b.length ? b.map(([k, v]) => `${k}→${v}`) : [null])),
      tones,
      rowLabels: buckets.map((_, i) => String(i)),
      columnLabels: [],
    });
    const used = () => buckets.reduce((n, b) => n + b.length, 0);
    const load = () => `${used()} / ${size}`;

    r.step(
      3,
      `A hash map is an **array of ${size} buckets**. A key's bucket comes from a hash function — here simply \`key % ${size}\`. Each bucket keeps a small list (a **chain**) of the entries that land in it.`,
      { grids: [view()], vars: { "load factor": load() } }
    );

    for (const key of keys) {
      const b = key % size;
      const value = LETTERS[next++ % 26];
      const bucket = buckets[b];
      const at = bucket.findIndex(([k]) => k === key);
      const scanned: Record<string, CellTone> = {};
      bucket.forEach((_, c) => (scanned[cell(b, c)] = "tertiary"));
      if (at >= 0) {
        bucket[at][1] = value;
        r.step(
          11,
          `put(${key}, ${value}): h(${key}) = ${key} % ${size} = **${b}**. Bucket ${b} already holds key ${key}, so its value is **overwritten** with ${value}. Keys stay unique.`,
          { grids: [view({ ...scanned, [cell(b, at)]: "write" })], vars: { key, "h(key)": `${key} % ${size} = ${b}`, "load factor": load() } }
        );
        continue;
      }
      bucket.push([key, value]);
      const collision = bucket.length > 1;
      r.step(
        13,
        collision
          ? `put(${key}, ${value}): h(${key}) = ${key} % ${size} = **${b}** — but bucket ${b} is already used by ${bucket.slice(0, -1).map(([k]) => k).join(", ")}. A **collision**: different keys, same bucket. Chaining simply adds ${key} to the end of the bucket's list.`
          : `put(${key}, ${value}): h(${key}) = ${key} % ${size} = **${b}**. Bucket ${b} is empty, so the entry ${key}→${value} goes straight in.`,
        { grids: [view({ ...scanned, [cell(b, bucket.length - 1)]: "write" })], vars: { key, "h(key)": `${key} % ${size} = ${b}`, "load factor": load() } }
      );
    }

    const b = find % size;
    const bucket = buckets[b];
    r.step(
      16,
      `get(${find}): h(${find}) = ${find} % ${size} = **${b}**. Only bucket ${b} can hold key ${find}, so only its ${bucket.length} ${bucket.length === 1 ? "entry is" : "entries are"} checked — the other buckets are never looked at.`,
      { grids: [view(Object.fromEntries(bucket.map((_, c) => [cell(b, c), "tertiary" as CellTone])))], vars: { key: find, "h(key)": `${find} % ${size} = ${b}` } }
    );
    for (let c = 0; c < bucket.length; c++) {
      const [k, v] = bucket[c];
      if (k === find) {
        r.step(
          18,
          `Entry ${c + 1} of bucket ${b} has key ${find} — found, value **${v}**, after ${c + 1} ${c === 0 ? "comparison" : "comparisons"}. With a good hash and few collisions this stays O(1) on average.`,
          { grids: [view({ [cell(b, c)]: "success" })], vars: { key: find, returned: v }, done: true }
        );
        return r.frames;
      }
      r.step(18, `Entry ${c + 1} of bucket ${b} has key ${k}, not ${find} — a collision we have to step past. Next.`, {
        grids: [view({ [cell(b, c)]: "muted" })],
        vars: { key: find },
      });
    }
    r.step(
      20,
      `No entry in bucket ${b} has key ${find}, so **${find} is not in the map** — returns undefined. Every other bucket was skipped without a look.`,
      { grids: [view()], vars: { key: find, returned: "undefined" }, done: true }
    );
    return r.frames;
  },
};

export default program;
