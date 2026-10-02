import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function intersection(a, b) {
  a.sort((x, y) => x - y);
  b.sort((x, y) => x - y);
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) {
      i++;
    } else if (a[i] > b[j]) {
      j++;
    } else {
      if (result.length === 0 || result[result.length - 1] !== a[i]) {
        result.push(a[i]);
      }
      i++;
      j++;
    }
  }
  return result;
}`;

const program: Program = {
  title: "Intersection of two arrays",
  code,
  fields: [
    { key: "a", label: "a", kind: "array", maxLength: 8 },
    { key: "b", label: "b", kind: "array", maxLength: 8 },
  ],
  examples: [
    { label: "Example", input: { a: [4, 9, 5], b: [9, 4, 9, 8, 4] } },
    { label: "Duplicates", input: { a: [1, 2, 2, 1], b: [2, 2] } },
    { label: "Nothing shared", input: { a: [1, 3, 5], b: [2, 4, 6] } },
  ],
  run(input) {
    const a = [...(input.a as number[])].sort((x, y) => x - y);
    const b = [...(input.b as number[])].sort((x, y) => x - y);
    const r = recorder();
    const result: number[] = [];
    let i = 0;
    let j = 0;

    const views = (extra: { ai?: "primary" | "success"; bj?: "primary" | "success" } = {}) => [
      {
        name: "a",
        values: a,
        tones: { ...toneRange(0, i - 1, "muted"), ...(extra.ai ? { [i]: extra.ai } : {}) },
        pointers: pointersAt(a.length, { i }),
      },
      {
        name: "b",
        values: b,
        tones: { ...toneRange(0, j - 1, "muted"), ...(extra.bj ? { [j]: extra.bj } : {}) },
        pointers: pointersAt(b.length, { j }, { j: "tertiary" }),
      },
      { name: "result", values: result, tones: toneRange(0, result.length - 1, "done") },
    ];

    r.step(
      3,
      `Sort both arrays first. Once sorted, equal values line up and we can walk both arrays **together** instead of comparing every pair.`,
      { arrays: views(), vars: { i, j } }
    );

    while (i < a.length && j < b.length) {
      if (a[i] < b[j]) {
        r.step(8, `${a[i]} < ${b[j]}: ${a[i]} can't appear in \`b\` from here on (b only grows), so move \`i\`.`, {
          arrays: views({ ai: "primary", bj: "primary" }),
          vars: { i, j },
        });
        i++;
      } else if (a[i] > b[j]) {
        r.step(10, `${a[i]} > ${b[j]}: ${b[j]} can't appear in \`a\` from here on, so move \`j\`.`, {
          arrays: views({ ai: "primary", bj: "primary" }),
          vars: { i, j },
        });
        j++;
      } else {
        const x = a[i];
        const fresh = result.length === 0 || result[result.length - 1] !== x;
        if (fresh) result.push(x);
        r.step(
          fresh ? 13 : 12,
          fresh
            ? `Both fronts are **${x}** — it's in both arrays. Add it to the result and move both pointers.`
            : `Both fronts are ${x} again, but ${x} is already in the result. Each value is reported once, so just move on.`,
          { arrays: views({ ai: "success", bj: "success" }), vars: { i, j } }
        );
        i++;
        j++;
      }
    }

    r.step(
      19,
      result.length > 0
        ? `One array ran out, so nothing else can match. The intersection is **[${result.join(", ")}]**. Sorting costs O(n log n + m log m); the walk itself is O(n + m).`
        : `One array ran out without a single match — the arrays share **no** values.`,
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
