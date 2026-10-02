import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";
import { requireSorted } from "./sorted";

const code = `function commonElements(a, b, c) {
  const result = [];
  let i = 0, j = 0, k = 0;
  while (i < a.length && j < b.length && k < c.length) {
    if (a[i] === b[j] && b[j] === c[k]) {
      if (result[result.length - 1] !== a[i]) result.push(a[i]);
      i++; j++; k++;
    } else {
      const smallest = Math.min(a[i], b[j], c[k]);
      if (a[i] === smallest) i++;
      if (b[j] === smallest) j++;
      if (c[k] === smallest) k++;
    }
  }
  return result;
}`;

const program: Program = {
  title: "Common elements in three sorted arrays",
  code,
  fields: [
    { key: "a", label: "a (sorted)", kind: "array", maxLength: 6 },
    { key: "b", label: "b (sorted)", kind: "array", maxLength: 6 },
    { key: "c", label: "c (sorted)", kind: "array", maxLength: 6 },
  ],
  examples: [
    { label: "Example", input: { a: [1, 5, 10, 20, 40, 80], b: [6, 7, 20, 80, 100], c: [3, 4, 15, 20, 30, 80] } },
    { label: "Repeats", input: { a: [1, 5, 5], b: [3, 4, 5, 5], c: [5, 5, 10] } },
  ],
  check: (input) => requireSorted(input, ["a", "b", "c"]),
  run(input) {
    const a = input.a as number[];
    const b = input.b as number[];
    const c = input.c as number[];
    const r = recorder();
    const result: number[] = [];
    let i = 0;
    let j = 0;
    let k = 0;

    const row = (name: string, values: number[], at: number, label: string, tone: CellTone | null) => ({
      name,
      values,
      tones: { ...toneRange(0, at - 1, "muted"), ...(tone ? { [at]: tone } : {}) },
      pointers: pointersAt(values.length, { [label]: at }, { j: "tertiary", k: "secondary" }),
    });
    const views = (tone: CellTone | null, moving: string[] = []) => [
      row("a", a, i, "i", moving.length === 0 || moving.includes("a") ? tone : null),
      row("b", b, j, "j", moving.length === 0 || moving.includes("b") ? tone : null),
      row("c", c, k, "k", moving.length === 0 || moving.includes("c") ? tone : null),
      { name: "result", values: result, tones: toneRange(0, result.length - 1, "done") },
    ];

    r.step(
      3,
      `Give each sorted array its own pointer. If the three fronts are equal we found a common value; otherwise the **smallest** front can never match anything ahead, so it can safely move.`,
      { arrays: views(null), vars: { i, j, k } }
    );

    while (i < a.length && j < b.length && k < c.length) {
      if (a[i] === b[j] && b[j] === c[k]) {
        const x = a[i];
        const fresh = result[result.length - 1] !== x;
        if (fresh) result.push(x);
        r.step(
          6,
          fresh
            ? `All three fronts are **${x}** — it's common to every array. Record it and move all three pointers.`
            : `All three fronts are ${x} again; it's already recorded, so just move all three pointers.`,
          { arrays: views("success"), vars: { i, j, k } }
        );
        i++;
        j++;
        k++;
      } else {
        const smallest = Math.min(a[i], b[j], c[k]);
        const moving = [
          a[i] === smallest ? "a" : null,
          b[j] === smallest ? "b" : null,
          c[k] === smallest ? "c" : null,
        ].filter((x): x is string => x !== null);
        r.step(
          10,
          `Fronts are ${a[i]}, ${b[j]}, ${c[k]}. The smallest, **${smallest}**, is missing from at least one array, so advance the pointer${moving.length > 1 ? "s" : ""} on ${moving.join(" and ")}.`,
          { arrays: views("primary", moving), vars: { i, j, k, smallest } }
        );
        if (a[i] === smallest) i++;
        if (b[j] === smallest) j++;
        if (c[k] === smallest) k++;
      }
    }

    r.step(
      15,
      result.length > 0
        ? `An array ran out, so nothing more can be common. Answer: **[${result.join(", ")}]**. Each pointer only moves forward: O(n1 + n2 + n3) time, no extra space besides the answer.`
        : `An array ran out without all three fronts ever matching — there are **no** common values.`,
      {
        arrays: [
          { name: "a", values: a, tones: toneRange(0, a.length - 1, "muted") },
          { name: "b", values: b, tones: toneRange(0, b.length - 1, "muted") },
          { name: "c", values: c, tones: toneRange(0, c.length - 1, "muted") },
          { name: "result", values: result, tones: toneRange(0, result.length - 1, "success") },
        ],
        vars: { result },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
