import { pointersAt, recorder, toneRange, type Program, type Scalar } from "../types";
import { requireSorted } from "./sorted";

const code = `function merge(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      result.push(a[i]);
      i++;
    } else {
      result.push(b[j]);
      j++;
    }
  }
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}`;

const program: Program = {
  title: "Merge two sorted arrays",
  code,
  fields: [
    { key: "a", label: "a (sorted)", kind: "array", maxLength: 6 },
    { key: "b", label: "b (sorted)", kind: "array", maxLength: 6 },
  ],
  examples: [
    { label: "Example", input: { a: [1, 3, 5, 7], b: [2, 4, 6] } },
    { label: "Uneven", input: { a: [1, 2, 9], b: [3, 4, 5, 6, 10] } },
  ],
  check: (input) => requireSorted(input, ["a", "b"]),
  run(input) {
    const a = input.a as number[];
    const b = input.b as number[];
    const total = a.length + b.length;
    const r = recorder();
    const result: Scalar[] = new Array(total).fill(null);
    let filled = 0;
    let i = 0;
    let j = 0;

    const views = (writeAt?: number) => [
      { name: "a", values: a, tones: toneRange(0, i - 1, "muted"), pointers: pointersAt(a.length, { i }) },
      { name: "b", values: b, tones: toneRange(0, j - 1, "muted"), pointers: pointersAt(b.length, { j }, { j: "tertiary" }) },
      {
        name: "result",
        values: result,
        tones: { ...toneRange(0, filled - 1, "done"), ...(writeAt !== undefined ? { [writeAt]: "write" as const } : {}) },
      },
    ];

    r.step(
      3,
      `Both arrays are sorted, so the smallest remaining value is always at the **front** of one of them. Point \`i\` and \`j\` at those fronts.`,
      { arrays: views(), vars: { i, j } }
    );

    while (i < a.length && j < b.length) {
      if (a[i] <= b[j]) {
        result[filled] = a[i];
        r.step(
          6,
          `Compare fronts: ${a[i]} vs ${b[j]}. **${a[i]}** is smaller${a[i] === b[j] ? " (ties take from a)" : ""}, so it goes next into the result.`,
          { arrays: views(filled), vars: { i, j } }
        );
        filled++;
        i++;
      } else {
        result[filled] = b[j];
        r.step(9, `Compare fronts: ${a[i]} vs ${b[j]}. **${b[j]}** is smaller, so it goes next into the result.`, {
          arrays: views(filled),
          vars: { i, j },
        });
        filled++;
        j++;
      }
    }

    while (i < a.length) {
      result[filled] = a[i];
      r.step(13, `\`b\` is used up, so the rest of \`a\` (already sorted) is copied across: **${a[i]}**.`, {
        arrays: views(filled),
        vars: { i, j },
      });
      filled++;
      i++;
    }
    while (j < b.length) {
      result[filled] = b[j];
      r.step(14, `\`a\` is used up, so the rest of \`b\` is copied across: **${b[j]}**.`, {
        arrays: views(filled),
        vars: { i, j },
      });
      filled++;
      j++;
    }

    r.step(
      15,
      `Every value was placed exactly once: **O(n + m) time**, plus O(n + m) space for the result.`,
      {
        arrays: [
          { name: "a", values: a, tones: toneRange(0, a.length - 1, "muted") },
          { name: "b", values: b, tones: toneRange(0, b.length - 1, "muted") },
          { name: "result", values: result, tones: toneRange(0, total - 1, "success") },
        ],
        vars: { result },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
