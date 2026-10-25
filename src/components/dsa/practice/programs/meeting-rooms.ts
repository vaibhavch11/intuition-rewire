import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function canAttendMeetings(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);   // by start time
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] < sorted[i - 1][1]) return false;          // starts before the previous one ends
  }
  return true;
}`;

const show = (p: number[]) => `${p[0]},${p[1]}`;

const program: Program = {
  title: "Meeting rooms (sort by start, check neighbours)",
  code,
  fields: [{ key: "intervals", label: "meetings [start, end]", kind: "pairs", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Clash", input: { intervals: [[0, 30], [5, 10], [15, 20]] } },
    { label: "No clash", input: { intervals: [[7, 10], [2, 4], [11, 13]] } },
    { label: "Back to back", input: { intervals: [[1, 5], [5, 8]] } },
  ],
  run(input) {
    const sorted = (input.intervals as number[][]).map((p) => [...p]).sort((a, b) => a[0] - b[0]);
    const n = sorted.length;
    const r = recorder();
    const values = sorted.map(show);

    r.step(lineOf(code, "const sorted = "), `Sort the meetings by **start time**. Now if any two meetings overlap, the clash shows up between **neighbours**: a meeting can only overlap the one just before it or a later one that starts even sooner after it.`, {
      arrays: [{ name: "meetings (by start)", values, tones: toneRange(0, n - 1, "done") }],
    });
    for (let i = 1; i < n; i++) {
      const clash = sorted[i][0] < sorted[i - 1][1];
      r.step(
        lineOf(code, clash ? "return false;" : "if (sorted[i][0] < sorted[i - 1][1])"),
        clash
          ? `[${values[i]}] starts at ${sorted[i][0]}, before [${values[i - 1]}] ends at ${sorted[i - 1][1]}: they overlap. **false**.`
          : `[${values[i]}] starts at ${sorted[i][0]}, not before [${values[i - 1]}] ends at ${sorted[i - 1][1]}: no clash.`,
        { arrays: [{ name: "meetings (by start)", values, tones: { ...toneRange(0, i - 2, "done"), [i - 1]: clash ? "write" : "primary", [i]: clash ? "write" : "primary" }, pointers: pointersAt(n, { i }) }], ...(clash ? { done: true } : {}) }
      );
      if (clash) return r.frames;
    }
    r.step(lineOf(code, "return true;"), `No meeting starts before the previous one ends: one person can attend them all — **true**. Sorting costs **O(n log n)**.`, {
      arrays: [{ name: "meetings (by start)", values, tones: toneRange(0, n - 1, "success") }],
      done: true,
    });
    return r.frames;
  },
};

export default program;
