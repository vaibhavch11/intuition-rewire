import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [[...intervals[0]]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const [start, end] = intervals[i];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}`;

const show = (pair: number[]) => `${pair[0]},${pair[1]}`;

const program: Program = {
  title: "Merge overlapping intervals",
  code,
  fields: [{ key: "intervals", label: "intervals", kind: "pairs", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { intervals: [[1, 3], [15, 18], [2, 6], [16, 17], [8, 9]] } },
    { label: "Nested", input: { intervals: [[1, 10], [2, 3], [4, 12], [14, 16]] } },
    { label: "Touching", input: { intervals: [[1, 4], [4, 5]] } },
  ],
  run(input) {
    const intervals = (input.intervals as number[][]).map((p) => [...p]).sort((a, b) => a[0] - b[0]);
    const n = intervals.length;
    const r = recorder();
    const merged = [[...intervals[0]]];
    const labels = () => intervals.map(show);

    r.step(
      2,
      `Sort by **start** time. Now any interval that overlaps the one we're building must come right after it — nothing further on can reach back.`,
      { arrays: [{ name: "intervals", values: labels() }], vars: {} }
    );
    r.step(3, `Start the answer with the first interval, **[${show(merged[0])}]**. It's the one we try to extend.`, {
      arrays: [
        { name: "intervals", values: labels(), tones: { 0: "done" } },
        { name: "merged", values: merged.map(show), tones: { 0: "tertiary" } },
      ],
      vars: { last: show(merged[0]) },
    });

    for (let i = 1; i < n; i++) {
      const last = merged[merged.length - 1];
      const [start, end] = intervals[i];
      const lastEnd = last[1];
      const intervalView = {
        name: "intervals",
        values: labels(),
        tones: { ...toneRange(0, i - 1, "done"), [i]: "primary" as const },
        pointers: pointersAt(n, { i }),
      };
      if (start <= last[1]) {
        last[1] = Math.max(last[1], end);
        r.step(
          8,
          end <= lastEnd
            ? `[${start},${end}] starts at ${start} ≤ ${lastEnd}, so it overlaps — and it sits entirely **inside**. The end stays ${last[1]} (that's why we take the max).`
            : `[${start},${end}] starts at ${start} ≤ ${lastEnd}, so it overlaps. Stretch the end to max(${lastEnd}, ${end}) = **${last[1]}**.`,
          {
            arrays: [
              intervalView,
              { name: "merged", values: merged.map(show), tones: { ...toneRange(0, merged.length - 2, "done"), [merged.length - 1]: "write" } },
            ],
            vars: { start, end, "last end": last[1] },
          }
        );
      } else {
        merged.push([start, end]);
        r.step(
          10,
          `[${start},${end}] starts at ${start} > ${lastEnd}: there's a **gap**, so [${show(last)}] is final. Start a new interval.`,
          {
            arrays: [
              intervalView,
              { name: "merged", values: merged.map(show), tones: { ...toneRange(0, merged.length - 2, "done"), [merged.length - 1]: "write" } },
            ],
            vars: { start, end, "last end": lastEnd },
          }
        );
      }
    }

    r.step(
      13,
      `${n} intervals became **${merged.length}**. Sorting costs O(n log n); the merge pass is only O(n).`,
      {
        arrays: [
          { name: "intervals", values: labels(), tones: toneRange(0, n - 1, "muted") },
          { name: "merged", values: merged.map(show), tones: toneRange(0, merged.length - 1, "success") },
        ],
        vars: { merged: `[${merged.map((p) => `[${show(p)}]`).join(", ")}]` },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
