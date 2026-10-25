import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function searchRange(nums, target) {
  const lowerBound = (t) => {               // the first index with nums[i] >= t
    let low = 0, high = nums.length;
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      if (nums[mid] < t) low = mid + 1;
      else high = mid;
    }
    return low;
  };
  const first = lowerBound(target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];   // not there
  const last = lowerBound(target + 1) - 1;  // just before the first value bigger than target
  return [first, last];
}`;

const program: Program = {
  title: "Find first and last position (two lower bounds)",
  code,
  fields: [
    { key: "nums", label: "nums (sorted)", kind: "array", maxLength: 12, min: -99, max: 99 },
    { key: "target", label: "target", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Example", input: { nums: [5, 7, 7, 8, 8, 10], target: 8 } },
    { label: "Not there", input: { nums: [5, 7, 7, 8, 8, 10], target: 6 } },
    { label: "Long run", input: { nums: [1, 2, 2, 2, 2, 2, 2, 3], target: 2 } },
  ],
  check(input) {
    const nums = input.nums as number[];
    for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return "nums must be sorted from smallest to largest.";
    return null;
  },
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    let first: number | null = null;
    const found = (): Record<number, CellTone> => (first !== null && first < n && nums[first] === target ? { [first]: "done" } : {});

    const lowerBound = (t: number, purpose: string) => {
      let low = 0;
      let high = n;
      const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
        arrays: [{ name: "nums", values: nums, tones: { ...found(), ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted"), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
      });
      r.step(lineOf(code, "let low = 0, high = nums.length;"), `Lower bound of **${t}** — ${purpose}. It's somewhere in ${low}..${high} (${n} means past the end).`, {
        ...view({}, { low, high }),
        vars: { target, t, low, high },
      });
      while (low < high) {
        const mid = low + Math.floor((high - low) / 2);
        r.step(lineOf(code, "const mid = low + "), `mid = ${mid}: nums[${mid}] = ${nums[mid]}${nums[mid] < t ? `, less than ${t}` : `, at least ${t}`}.`, {
          ...view({ [mid]: "primary" }, { low, mid, high }),
          vars: { target, t, low, mid, high },
        });
        if (nums[mid] < t) {
          low = mid + 1;
          r.step(lineOf(code, "if (nums[mid] < t) low = mid + 1;"), `Too small: the first value >= ${t} is to the right. \`low = ${low}\`.`, { ...view({}, { low, high }), vars: { target, t, low, high } });
        } else {
          high = mid;
          r.step(lineOf(code, "else high = mid;"), `Big enough: it might be the first one, keep it. \`high = ${high}\`.`, { ...view({}, { low, high }), vars: { target, t, low, high } });
        }
      }
      r.step(lineOf(code, "return low;"), `One candidate left: the first index with a value >= ${t} is **${low}**${low === n ? " (past the end)" : ""}.`, {
        arrays: [{ name: "nums", values: nums, tones: { ...found(), ...(low < n ? { [low]: "primary" } : {}) }, pointers: pointersAt(n, { low }) }],
        vars: { target, t, low },
      });
      return low;
    };

    first = lowerBound(target, `the first copy of ${target}, if there is one`);
    r.step(lineOf(code, "const first = lowerBound(target);"), `first = ${first}.`, {
      arrays: [{ name: "nums", values: nums, pointers: pointersAt(n, { first }) }],
      vars: { target, first },
    });
    if (first === n || nums[first] !== target) {
      const why = first === n ? `Every value is smaller than ${target}` : `The first value >= ${target} is ${nums[first]}, not ${target}`;
      first = null;
      r.step(lineOf(code, "if (first === nums.length || nums[first] !== target) return [-1, -1];"), `${why}, so ${target} isn't in the array. Return **[-1, -1]**. One O(log n) search was enough.`, {
        arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }],
        vars: { target },
        done: true,
      });
      return r.frames;
    }
    const start = first;
    const past = lowerBound(target + 1, `the first value bigger than ${target}, one step past the last ${target}`);
    const last = past - 1;
    r.step(lineOf(code, "const last = lowerBound(target + 1) - 1;"), `The last ${target} sits just before index ${past}: last = ${past} − 1 = ${last}.`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(start, last, "done"), pointers: pointersAt(n, { first: start, last }) }],
      vars: { target, first: start, last },
    });
    r.step(lineOf(code, "return [first, last];"), `The ${target}s run from index ${start} to ${last}: return **[${start}, ${last}]**. Two binary searches — **O(log n)** however long the run is.`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(start, last, "success"), pointers: pointersAt(n, { first: start, last }) }],
      vars: { target, first: start, last },
      done: true,
    });
    return r.frames;
  },
};

export default program;
