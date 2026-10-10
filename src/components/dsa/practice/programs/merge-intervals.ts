import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let write = 0;
  for (let read = 1; read < intervals.length; read++) {
    const [start, end] = intervals[read];
    if (start <= intervals[write][1]) {
      intervals[write][1] = Math.max(intervals[write][1], end);
    } else {
      write++;
      intervals[write] = [start, end];
    }
  }
  intervals.length = write + 1;
  return intervals;
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
    let write = 0;

    // Slots 0..write hold the finished answer; the one at `write` can still grow.
    const view = (read: number, tones: Record<number, CellTone> = {}) => ({
      name: "intervals",
      values: intervals.map(show),
      tones: { ...toneRange(0, write - 1, "done"), [write]: "write" as const, ...tones },
      pointers: pointersAt(n, { write, read }, { write: "tertiary" }),
    });

    r.step(
      2,
      `Sort by **start**. Now an interval that overlaps the one we're building must come right after it — nothing further on can reach back.`,
      { arrays: [{ name: "intervals", values: intervals.map(show) }], vars: {} }
    );
    r.step(
      3,
      `No second list: the answer is written **back into the same array**. \`write = 0\` points at the interval we're trying to extend, **[${show(intervals[0])}]**.`,
      { arrays: [view(-1)], vars: { write } }
    );

    for (let read = 1; read < n; read++) {
      const [start, end] = intervals[read];
      const lastEnd = intervals[write][1];
      if (start <= lastEnd) {
        intervals[write][1] = Math.max(lastEnd, end);
        r.step(
          7,
          end <= lastEnd
            ? `[${start},${end}] starts at ${start} ≤ ${lastEnd}, so it overlaps — and sits entirely **inside**. The end stays ${lastEnd} (that's why we take the max).`
            : `[${start},${end}] starts at ${start} ≤ ${lastEnd}, so it overlaps. Stretch slot ${write} to end at max(${lastEnd}, ${end}) = **${intervals[write][1]}**.`,
          { arrays: [view(read, { [read]: "primary" })], vars: { read, write, start, end } }
        );
      } else {
        write++;
        intervals[write] = [start, end];
        r.step(
          10,
          `[${start},${end}] starts at ${start} > ${lastEnd}: there's a **gap**, so slot ${write - 1} is final. Move \`write\` to ${write} and copy [${start},${end}] there.`,
          { arrays: [view(read, read !== write ? { [read]: "primary" } : {})], vars: { read, write, start, end } }
        );
      }
    }

    const merged = intervals.slice(0, write + 1);
    r.step(
      13,
      `Cut the array after slot ${write}: ${n} intervals became **${merged.length}**. Sorting costs O(n log n), the pass is O(n), and no second list was needed.`,
      {
        arrays: [{ name: "intervals", values: merged.map(show), tones: toneRange(0, merged.length - 1, "success") }],
        vars: { result: `[${merged.map((p) => `[${show(p)}]`).join(", ")}]` },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
