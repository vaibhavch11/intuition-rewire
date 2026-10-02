import { pointersAt, recorder, toneRange, type Program } from "../types";
import { requireSorted } from "./sorted";

const code = `function union(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    let next;
    if (j >= b.length || (i < a.length && a[i] <= b[j])) {
      next = a[i++];
    } else {
      next = b[j++];
    }
    if (result.length === 0 || result[result.length - 1] !== next) {
      result.push(next);
    }
  }
  return result;
}`;

const program: Program = {
  title: "Union of two sorted arrays",
  code,
  fields: [
    { key: "a", label: "a (sorted)", kind: "array", maxLength: 6 },
    { key: "b", label: "b (sorted)", kind: "array", maxLength: 6 },
  ],
  examples: [
    { label: "Example", input: { a: [1, 2, 3, 4, 5], b: [1, 2, 3, 6, 7] } },
    { label: "Repeats", input: { a: [1, 1, 2, 3], b: [2, 3, 3, 4] } },
  ],
  check: (input) => requireSorted(input, ["a", "b"]),
  run(input) {
    const a = input.a as number[];
    const b = input.b as number[];
    const r = recorder();
    const result: number[] = [];
    let i = 0;
    let j = 0;

    const views = (taken?: { from: "a" | "b"; at: number; added: boolean }) => [
      {
        name: "a",
        values: a,
        tones: {
          ...toneRange(0, i - 1, "muted"),
          ...(taken?.from === "a" ? { [taken.at]: taken.added ? ("write" as const) : ("primary" as const) } : {}),
        },
        pointers: pointersAt(a.length, { i }),
      },
      {
        name: "b",
        values: b,
        tones: {
          ...toneRange(0, j - 1, "muted"),
          ...(taken?.from === "b" ? { [taken.at]: taken.added ? ("write" as const) : ("primary" as const) } : {}),
        },
        pointers: pointersAt(b.length, { j }, { j: "tertiary" }),
      },
      {
        name: "result",
        values: result,
        tones: {
          ...toneRange(0, result.length - 1, "done"),
          ...(taken?.added ? { [result.length - 1]: "write" as const } : {}),
        },
      },
    ];

    r.step(
      3,
      `The union is every distinct value from either array, in sorted order. Walk both with \`i\` and \`j\`, always taking the **smaller** front — just like merging.`,
      { arrays: views(), vars: { i, j } }
    );

    while (i < a.length || j < b.length) {
      let next: number;
      let from: "a" | "b";
      let at: number;
      if (j >= b.length || (i < a.length && a[i] <= b[j])) {
        from = "a";
        at = i;
        next = a[i++];
      } else {
        from = "b";
        at = j;
        next = b[j++];
      }
      const added = result.length === 0 || result[result.length - 1] !== next;
      if (added) result.push(next);
      r.step(
        added ? 12 : 11,
        added
          ? `Take **${next}** from \`${from}\` (the smaller front). It's different from the last value added, so it joins the union.`
          : `Take ${next} from \`${from}\`, but the union already ends with ${next}. Skip it — each value appears once.`,
        { arrays: views({ from, at, added }), vars: { i, j, next } }
      );
    }

    r.step(
      15,
      `Both arrays are used up. The union is **[${result.join(", ")}]**, found in one pass: O(n + m) time.`,
      {
        arrays: [
          { name: "a", values: a, tones: toneRange(0, a.length - 1, "muted") },
          { name: "b", values: b, tones: toneRange(0, b.length - 1, "muted") },
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
