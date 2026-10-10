import { mapView, type MapMark } from "../structures";
import { recorder, type Program, type Scalar } from "../types";

const code = `function run(ops) {
  const map = new Map();
  const out = [];
  for (const [op, key, value] of ops) {
    if (op === "put") map.set(key, value);              // add, or overwrite
    else if (op === "get") out.push(map.get(key));      // the value, or undefined
    else if (op === "has") out.push(map.has(key));      // true or false
    else if (op === "remove") map.delete(key);          // no error if missing
    else if (op === "size") out.push(map.size);         // how many keys
  }
  return out;
}`;

type Op = { name: "put" | "get" | "has" | "remove" | "size"; key?: string; value?: number };

const KEY = /^[a-z][a-z0-9]{0,7}$/i;

function parse(text: string): Op[] | string {
  const parts = text.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "Enter at least one operation, like put apple 3.";
  if (parts.length > 12) return "Use at most 12 operations so every step stays readable.";
  const ops: Op[] = [];
  for (const part of parts) {
    const [rawName, key, value, ...rest] = part.split(/\s+/);
    const name = rawName.toLowerCase();
    const usage = `"${part}" isn't an operation. Use put apple 3, get apple, has apple, remove apple or size.`;
    if (rest.length > 0) return usage;
    if (name === "size") {
      if (key !== undefined) return `"${part}": size doesn't take a key.`;
      ops.push({ name });
    } else if (name === "put") {
      if (!key || !KEY.test(key)) return `"${part}": put needs a key (a short word) and a whole number, like put apple 3.`;
      if (value === undefined || !/^-?\d+$/.test(value) || Math.abs(Number(value)) > 999) {
        return `"${part}": put needs a whole number between -999 and 999 after the key.`;
      }
      ops.push({ name, key, value: Number(value) });
    } else if (name === "get" || name === "has" || name === "remove") {
      if (!key || !KEY.test(key) || value !== undefined) return `"${part}": ${name} needs one key, like ${name} apple.`;
      ops.push({ name, key });
    } else return usage;
  }
  return ops;
}

const LINE = { put: 5, get: 6, has: 7, remove: 8, size: 9 } as const;

const program: Program = {
  title: "Put, get and remove in a hash map",
  code,
  fields: [
    { key: "ops", label: "operations", kind: "text", maxLength: 200, hint: "put apple 3, get apple, remove apple, size" },
  ],
  examples: [
    { label: "Fruit prices", input: { ops: "put apple 3, put pear 5, get apple, put apple 7, get apple, has kiwi, remove pear, size" } },
    { label: "Missing keys", input: { ops: "get mango, put mango 4, get mango, remove mango, has mango, remove mango" } },
    { label: "Word counts", input: { ops: "put the 1, put cat 1, put sat 1, put the 2, size, get the" } },
  ],
  check(input) {
    const ops = parse(input.ops as string);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const ops = parse(input.ops as string) as Op[];
    const r = recorder();
    const map = new Map<string, number>();
    const out: Scalar[] = [];

    const views = (marks: MapMark<string>[] = []) => ({
      maps: [mapView("map", map, { marks })],
      arrays: [{ name: "out (what get, has and size returned)", values: [...out], tones: out.length ? { [out.length - 1]: "write" as const } : {} }],
    });

    r.step(2, "A new, empty map. Every entry will be a **key** (here a word) paired with a **value** (a number). Keys are unique: one key, one value.", {
      ...views(),
      vars: { size: 0 },
    });

    for (const op of ops) {
      const key = op.key as string;
      if (op.name === "put") {
        const old = map.get(key);
        map.set(key, op.value as number);
        r.step(
          LINE.put,
          old === undefined
            ? `**put ${key} ${op.value}**: "${key}" is a new key, so a new entry is added. No searching — the key itself says where the entry goes.`
            : `**put ${key} ${op.value}**: "${key}" is already a key, so its value is **overwritten**: ${old} → ${op.value}. A map never holds the same key twice.`,
          { ...views([[key, "write", old === undefined ? "new" : "updated"]]), vars: { size: map.size } }
        );
      } else if (op.name === "get") {
        const value = map.get(key);
        out.push(value === undefined ? "undefined" : value);
        r.step(
          LINE.get,
          value === undefined
            ? `**get ${key}**: there is no key "${key}", so get returns **undefined** (Python raises KeyError; use .get to avoid it).`
            : `**get ${key}**: jumps straight to "${key}" and returns **${value}** — O(1) on average, however big the map is.`,
          { ...views(value === undefined ? [] : [[key, "success", "get"]]), vars: { size: map.size, returned: value ?? "undefined" } }
        );
      } else if (op.name === "has") {
        const found = map.has(key);
        out.push(String(found));
        r.step(
          LINE.has,
          `**has ${key}**: is "${key}" a key? **${found}**. Checking for a key is just as fast as getting its value.`,
          { ...views(found ? [[key, "success", "has"]] : []), vars: { size: map.size, returned: found } }
        );
      } else if (op.name === "remove") {
        const had = map.delete(key);
        r.step(
          LINE.remove,
          had
            ? `**remove ${key}**: the entry for "${key}" is gone, key and value together. ${map.size} ${map.size === 1 ? "entry is" : "entries are"} left.`
            : `**remove ${key}**: there is no "${key}" to remove. Nothing happens — no error.`,
          { ...views(), vars: { size: map.size } }
        );
      } else {
        out.push(map.size);
        r.step(LINE.size, `**size**: the map holds **${map.size}** ${map.size === 1 ? "key" : "keys"}. Overwriting never adds one; only a new key does.`, {
          ...views(),
          vars: { size: map.size, returned: map.size },
        });
      }
    }

    r.step(
      11,
      `Done. The map ends with ${map.size === 0 ? "no entries" : [...map].map(([k, v]) => `${k} → ${v}`).join(", ")}, and the calls returned [${out.join(", ")}].`,
      { ...views(), vars: { size: map.size }, done: true }
    );
    return r.frames;
  },
};

export default program;
