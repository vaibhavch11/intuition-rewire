import { lineOf } from "../graphs";
import { mapView } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function relativeSortArray(arr1, arr2) {
  const rank = new Map(arr2.map((v, i) => [v, i]));                    // where each value of arr2 comes
  const key = (v) => (rank.has(v) ? rank.get(v) : arr2.length + v);   // the rest go after, ascending
  return [...arr1].sort((a, b) => key(a) - key(b));
}`;

const program: Program = {
  title: "Relative sort array (sort by a custom key)",
  code,
  fields: [
    { key: "arr1", label: "arr1", kind: "array", maxLength: 10, min: 0, max: 30 },
    { key: "arr2", label: "arr2 (distinct, all in arr1)", kind: "array", maxLength: 5, min: 0, max: 30 },
  ],
  examples: [
    { label: "Example", input: { arr1: [2, 3, 1, 3, 2, 4, 6, 7, 9, 2], arr2: [2, 1, 4, 3, 9] } },
    { label: "Some left over", input: { arr1: [28, 6, 22, 8, 44, 17], arr2: [22, 28, 8, 6] } },
  ],
  check(input) {
    const a1 = input.arr1 as number[];
    const a2 = input.arr2 as number[];
    if (new Set(a2).size !== a2.length) return "arr2: the values must be distinct.";
    return a2.every((v) => a1.includes(v)) ? null : "arr2: every value must also appear in arr1.";
  },
  run(input) {
    const arr1 = input.arr1 as number[];
    const arr2 = input.arr2 as number[];
    const rank = new Map(arr2.map((v, i) => [v, i]));
    const key = (v: number) => (rank.has(v) ? rank.get(v)! : arr2.length + v);
    const r = recorder();

    r.step(lineOf(code, "const rank = "), `The order isn't numeric any more: values in arr2 come first, **in arr2's order**. Record each one's position in arr2 — its **rank**.`, {
      arrays: [{ name: "arr2", values: arr2, tones: toneRange(0, arr2.length - 1, "primary") }],
      maps: [mapView("rank (value -> position)", rank)],
    });
    const keys = arr1.map(key);
    r.step(lineOf(code, "const key = "), `Turn every value into one **sort key**: its rank if it's in arr2, otherwise ${arr2.length} + the value — bigger than every rank, so leftovers go last, and in ascending order among themselves.`, {
      arrays: [
        { name: "arr1", values: arr1 },
        { name: "key", values: keys, tones: Object.fromEntries(arr1.map((v, i) => [i, rank.has(v) ? ("primary" as const) : ("tertiary" as const)])) },
      ],
      maps: [mapView("rank (value -> position)", rank)],
    });
    const out = [...arr1].sort((a, b) => key(a) - key(b));
    r.step(lineOf(code, "return [...arr1].sort"), `Sort by key: **[${out.join(", ")}]**. The comparator does all the work — \`key(a) - key(b)\` — so this is just one O(n log n) sort.`, {
      arrays: [
        { name: "sorted", values: out, tones: Object.fromEntries(out.map((v, i) => [i, rank.has(v) ? ("success" as const) : ("tertiary" as const)])) },
        { name: "key", values: out.map(key) },
      ],
      done: true,
    });
    return r.frames;
  },
};

export default program;
