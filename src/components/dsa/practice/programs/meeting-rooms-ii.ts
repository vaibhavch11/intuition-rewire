import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function minMeetingRooms(intervals) {
  const starts = intervals.map((m) => m[0]).sort((a, b) => a - b);
  const ends = intervals.map((m) => m[1]).sort((a, b) => a - b);
  let rooms = 0, best = 0, j = 0;
  for (let i = 0; i < starts.length; i++) {
    while (ends[j] <= starts[i]) {   // a meeting ended before this one starts: its room is free
      rooms--;
      j++;
    }
    rooms++;                         // this meeting takes a room
    best = Math.max(best, rooms);
  }
  return best;
}`;

const program: Program = {
  title: "Meeting rooms II (sorted starts and ends)",
  code,
  fields: [{ key: "intervals", label: "meetings [start, end]", kind: "pairs", maxLength: 7, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { intervals: [[0, 30], [5, 10], [15, 20]] } },
    { label: "Chain", input: { intervals: [[1, 5], [5, 8], [8, 9]] } },
    { label: "All at once", input: { intervals: [[1, 10], [2, 9], [3, 8], [4, 7]] } },
  ],
  check: (input) => ((input.intervals as number[][]).every(([s, e]) => s < e) ? null : "Each meeting must end after it starts."),
  run(input) {
    const intervals = input.intervals as number[][];
    const starts = intervals.map((m) => m[0]).sort((a, b) => a - b);
    const ends = intervals.map((m) => m[1]).sort((a, b) => a - b);
    const n = starts.length;
    const r = recorder();
    let rooms = 0;
    let best = 0;
    let j = 0;

    const frame = (i: number | null, tones: { s?: number; e?: number } = {}) => ({
      arrays: [
        { name: "starts", values: starts, tones: { ...toneRange(0, (i ?? n) - 1, "done"), ...(tones.s !== undefined ? { [tones.s]: "primary" as const } : {}) }, pointers: i === null ? {} : pointersAt(n, { i }) },
        { name: "ends", values: ends, tones: { ...toneRange(0, j - 1, "muted"), ...(tones.e !== undefined ? { [tones.e]: "write" as const } : {}) }, pointers: pointersAt(n, { j }, { j: "tertiary" }) },
      ],
      vars: { rooms, best },
    });

    r.step(lineOf(code, "const ends = "), `Which meeting uses which room doesn't matter — only **how many are running at once**. So sort the start times and the end times **separately** and walk through time: each start needs a room, each end frees one.`, frame(0));
    for (let i = 0; i < n; i++) {
      while (ends[j] <= starts[i]) {
        rooms--;
        j++;
        r.step(lineOf(code, "rooms--;"), `A meeting ended at ${ends[j - 1]}, at or before ${starts[i]}: its room is free again.`, frame(i, { e: j - 1 }));
      }
      rooms++;
      best = Math.max(best, rooms);
      r.step(lineOf(code, "rooms++;"), `A meeting starts at ${starts[i]}: ${rooms} room${rooms === 1 ? "" : "s"} in use now${rooms === best ? " — the most so far" : ""}.`, frame(i, { s: i }));
    }
    r.step(lineOf(code, "return best;"), `At the busiest moment **${best}** meeting${best === 1 ? " was" : "s were"} running, so that's how many rooms are needed. Two sorts and one pass: **O(n log n)** time, **O(n)** space.`, { ...frame(null), done: true });
    return r.frames;
  },
};

export default program;
