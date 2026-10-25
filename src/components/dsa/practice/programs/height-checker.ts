import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function heightChecker(heights) {
  const count = new Array(101).fill(0);
  for (const h of heights) count[h]++;              // heights are 1..100
  let mismatches = 0, h = 1;
  for (const actual of heights) {
    while (count[h] === 0) h++;                     // the next height in sorted order
    if (actual !== h) mismatches++;
    count[h]--;
  }
  return mismatches;
}`;

const program: Program = {
  title: "Height checker (counting sort, compared on the fly)",
  code,
  fields: [{ key: "heights", label: "heights (1 to 9)", kind: "array", maxLength: 10, min: 1, max: 9 }],
  examples: [
    { label: "Example", input: { heights: [1, 1, 4, 2, 1, 3] } },
    { label: "Reversed", input: { heights: [5, 1, 2, 3, 4] } },
    { label: "In order", input: { heights: [1, 2, 3, 4, 5] } },
  ],
  run(input) {
    const heights = input.heights as number[];
    const n = heights.length;
    const max = Math.max(...heights);
    const count = new Array(max + 1).fill(0);
    const expected: Scalar[] = new Array(n).fill(null);
    const r = recorder();
    const frame = (i: number | null, tones: Record<number, CellTone> = {}, h: number | null = null, vars: Record<string, unknown> = {}) => ({
      arrays: [
        { name: "heights", values: heights, tones, pointers: i === null ? {} : pointersAt(n, { i }) },
        { name: "expected (sorted)", values: [...expected], tones: Object.fromEntries(Object.entries(tones).filter(([, t]) => t !== "primary")) },
        { name: "count (index = height)", values: count.map((c, v) => (v === 0 ? "" : c)), tones: h === null ? {} : { [h]: "tertiary" as const }, pointers: h === null ? {} : pointersAt(max + 1, { h }, { h: "tertiary" }) },
      ],
      vars,
    });

    heights.forEach((x) => count[x]++);
    r.step(lineOf(code, "for (const h of heights) count[h]++"), `Heights are small numbers (1 to 100), so **count** how many students have each height instead of comparing. The counts describe the sorted line completely.`, frame(null));
    let mismatches = 0;
    let h = 1;
    for (let i = 0; i < n; i++) {
      while (count[h] === 0) h++;
      expected[i] = h;
      const wrong = heights[i] !== h;
      if (wrong) mismatches++;
      r.step(
        lineOf(code, "if (actual !== h) mismatches++"),
        `The ${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} student in sorted order is ${h} tall; here stands ${heights[i]}. ${wrong ? `**Mismatch** (${mismatches} so far).` : "Same: fine."}`,
        frame(i, { [i]: wrong ? "write" : "success" }, h, { mismatches })
      );
      count[h]--;
    }
    r.step(lineOf(code, "return mismatches;"), `**${mismatches}** student${mismatches === 1 ? " is" : "s are"} out of place. One pass to count and one to compare: **O(n + k)** time for heights up to k, and **O(k)** space — no O(n log n) sort.`, { ...frame(null), vars: { mismatches }, done: true });
    return r.frames;
  },
};

export default program;
