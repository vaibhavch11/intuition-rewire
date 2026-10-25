import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function maximumGap(nums) {
  const n = nums.length;
  if (n < 2) return 0;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  if (lo === hi) return 0;
  const size = Math.max(1, Math.floor((hi - lo) / (n - 1)));   // the biggest gap is at least this wide
  const count = Math.floor((hi - lo) / size) + 1;
  const bucketMin = new Array(count).fill(Infinity);
  const bucketMax = new Array(count).fill(-Infinity);
  for (const x of nums) {
    const b = Math.floor((x - lo) / size);
    bucketMin[b] = Math.min(bucketMin[b], x);
    bucketMax[b] = Math.max(bucketMax[b], x);
  }
  let best = 0, prevMax = lo;
  for (let b = 0; b < count; b++) {
    if (bucketMin[b] === Infinity) continue;          // empty bucket
    best = Math.max(best, bucketMin[b] - prevMax);    // gaps inside a bucket are never the biggest
    prevMax = bucketMax[b];
  }
  return best;
}`;

const program: Program = {
  title: "Maximum gap (buckets, linear time)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 8, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [3, 6, 9, 1] } },
    { label: "Spread", input: { nums: [1, 10, 5, 50, 52, 25] } },
    { label: "One value", input: { nums: [10] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    if (n < 2) {
      r.step(lineOf(code, "if (n < 2) return 0;"), `Fewer than two values: no gaps at all, the answer is **0**.`, { arrays: [{ name: "nums", values: nums }], done: true });
      return r.frames;
    }
    const lo = Math.min(...nums);
    const hi = Math.max(...nums);
    if (lo === hi) {
      r.step(lineOf(code, "if (lo === hi) return 0;"), `Every value is ${lo}: the answer is **0**.`, { arrays: [{ name: "nums", values: nums }], done: true });
      return r.frames;
    }
    const size = Math.max(1, Math.floor((hi - lo) / (n - 1)));
    const count = Math.floor((hi - lo) / size) + 1;
    const bucketMin: Scalar[] = new Array(count).fill("");
    const bucketMax: Scalar[] = new Array(count).fill("");
    const ranges = Array.from({ length: count }, (_, b) => `${lo + b * size}–${lo + (b + 1) * size - 1}`);
    const view = (tones: Record<number, CellTone> = {}, numsTones: Record<number, CellTone> = {}, marks: Record<string, number> = {}) => ({
      arrays: [
        { name: "nums", values: nums, tones: numsTones },
        { name: "bucket covers", values: ranges, tones, pointers: pointersAt(count, marks) },
        { name: "bucket min", values: [...bucketMin], tones },
        { name: "bucket max", values: [...bucketMax], tones },
      ],
    });

    r.step(lineOf(code, "const size = "), `Values run from ${lo} to ${hi}. With ${n} values there are ${n - 1} gaps adding up to ${hi - lo}, so the **biggest gap is at least ${size}** (${hi - lo} / ${n - 1}, rounded down). Cut the range into ${count} buckets of width ${size}: two values in the same bucket are at most ${size - 1} apart, too close to be the answer.`, view());
    nums.forEach((x, i) => {
      const b = Math.floor((x - lo) / size);
      bucketMin[b] = bucketMin[b] === "" ? x : Math.min(bucketMin[b] as number, x);
      bucketMax[b] = bucketMax[b] === "" ? x : Math.max(bucketMax[b] as number, x);
      r.step(lineOf(code, "const b = Math.floor((x - lo) / size);"), `${x} falls in bucket ${b} (${ranges[b]}). Each bucket only remembers its smallest and largest value.`, view({ [b]: "write" }, { [i]: "primary" }));
    });
    let best = 0;
    let prevMax = lo;
    for (let b = 0; b < count; b++) {
      if (bucketMin[b] === "") {
        r.step(lineOf(code, "if (bucketMin[b] === Infinity) continue;"), `Bucket ${b} is empty: skip it — a gap can stretch across empty buckets.`, { ...view({ [b]: "muted" }, {}, { b }), vars: { best, prevMax } });
        continue;
      }
      const gap = (bucketMin[b] as number) - prevMax;
      const better = gap > best;
      best = Math.max(best, gap);
      r.step(lineOf(code, "best = Math.max(best, bucketMin[b] - prevMax);"), `The gap from the previous bucket's max ${prevMax} to this bucket's min ${bucketMin[b]} is ${gap}${better ? ": the biggest so far" : ""}.`, { ...view({ [b]: better ? "success" : "primary" }, {}, { b }), vars: { best, prevMax } });
      prevMax = bucketMax[b] as number;
    }
    r.step(lineOf(code, "return best;"), `The maximum gap is **${best}**. Only gaps **between** buckets were checked, never inside one: O(n) to fill the buckets and O(n) to scan them — **linear time**, no sort.`, { ...view(), vars: { best }, done: true });
    return r.frames;
  },
};

export default program;
