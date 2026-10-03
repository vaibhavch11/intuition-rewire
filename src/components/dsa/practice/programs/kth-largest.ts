import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

// The lesson picks a random pivot; the simulator uses the middle one so every run is repeatable.
const code = `function findKthLargest(nums, k) {
  let lo = 0, hi = nums.length - 1;
  while (true) {
    const pivot = nums[Math.floor((lo + hi) / 2)];
    let lt = lo, i = lo, gt = hi;
    while (i <= gt) {
      if (nums[i] > pivot) {
        [nums[lt], nums[i]] = [nums[i], nums[lt]];
        lt++; i++;
      } else if (nums[i] < pivot) {
        [nums[i], nums[gt]] = [nums[gt], nums[i]];
        gt--;
      } else {
        i++;
      }
    }
    if (k - 1 < lt) hi = lt - 1;
    else if (k - 1 > gt) lo = gt + 1;
    else return pivot;
  }
}`;

const program: Program = {
  title: "Kth largest element (quickselect)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10 },
    { key: "k", label: "k", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "Example", input: { nums: [3, 2, 1, 5, 6, 4], k: 2 } },
    { label: "Duplicates", input: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 } },
    { label: "Largest", input: { nums: [9, 1, 8, 2, 7, 3], k: 1 } },
  ],
  check(input) {
    const n = (input.nums as number[]).length;
    return (input.k as number) > n ? `k can be at most ${n}, the number of elements.` : null;
  },
  run(input) {
    const nums = [...(input.nums as number[])];
    const k = input.k as number;
    const n = nums.length;
    const target = k - 1;
    const r = recorder();
    let lo = 0;
    let hi = n - 1;

    const outside = () => ({ ...toneRange(0, lo - 1, "muted"), ...toneRange(hi + 1, n - 1, "muted") });
    // Zones while partitioning: [lo, lt) bigger, [lt, i) equal, (gt, hi] smaller.
    const zones = (lt: number, i: number, gt: number): Record<number, CellTone> => ({
      ...outside(),
      ...toneRange(lo, lt - 1, "tertiary"),
      ...toneRange(lt, i - 1, "primary"),
      ...toneRange(gt + 1, hi, "done"),
    });

    r.step(
      2,
      `In descending order the kth largest sits at index **k − 1 = ${target}**. We don't need the whole array sorted — only to find what lands at index ${target}.`,
      { arrays: [{ name: "nums", values: nums, pointers: pointersAt(n, { "k-1": target }, { "k-1": "muted" }) }], vars: { k, lo, hi } }
    );

    for (;;) {
      const pivot = nums[Math.floor((lo + hi) / 2)];
      let lt = lo;
      let i = lo;
      let gt = hi;
      r.step(
        4,
        `Search range [${lo}, ${hi}]. Pick the middle value, **pivot = ${pivot}**, and split the range into three zones: **bigger** than ${pivot} (left), **equal** (middle) and **smaller** (right).`,
        {
          arrays: [{ name: "nums", values: nums, tones: { ...outside(), [Math.floor((lo + hi) / 2)]: "primary" }, pointers: pointersAt(n, { lo, hi, "k-1": target }, { hi: "tertiary", "k-1": "muted" }) }],
          vars: { pivot, lo, hi },
        }
      );

      while (i <= gt) {
        const value = nums[i];
        let line: number;
        let note: string;
        if (value > pivot) {
          [nums[lt], nums[i]] = [nums[i], nums[lt]];
          lt++;
          i++;
          line = 9;
          note = `${value} > ${pivot}: it belongs in the **bigger** zone. Swap it to the front of the range and grow that zone.`;
        } else if (value < pivot) {
          [nums[i], nums[gt]] = [nums[gt], nums[i]];
          gt--;
          line = 12;
          note = `${value} < ${pivot}: it belongs in the **smaller** zone. Swap it to the back. (Don't move i — the value swapped in hasn't been checked yet.)`;
        } else {
          i++;
          line = 14;
          note = `${value} equals the pivot: leave it in the **middle** zone.`;
        }
        r.step(line, note, {
          arrays: [{ name: "nums", values: nums, tones: zones(lt, i, gt), pointers: pointersAt(n, { lt, i, gt }, { lt: "tertiary", gt: "secondary" }) }],
          vars: { pivot, lt, i, gt },
        });
      }

      const done = { name: "nums", values: nums, tones: zones(lt, i, gt) };
      if (target < lt) {
        r.step(17, `Index ${target} is in the **bigger** zone [${lo}, ${lt - 1}]. Throw away everything else: \`hi = ${lt - 1}\`.`, {
          arrays: [{ ...done, pointers: pointersAt(n, { "k-1": target }, { "k-1": "muted" }) }],
          vars: { pivot, lt, gt },
        });
        hi = lt - 1;
      } else if (target > gt) {
        r.step(18, `Index ${target} is in the **smaller** zone [${gt + 1}, ${hi}]. Throw away everything else: \`lo = ${gt + 1}\`.`, {
          arrays: [{ ...done, pointers: pointersAt(n, { "k-1": target }, { "k-1": "muted" }) }],
          vars: { pivot, lt, gt },
        });
        lo = gt + 1;
      } else {
        r.step(
          19,
          `Index ${target} landed in the **equal** zone [${lt}, ${gt}], so the ${k}${k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th"} largest is **${pivot}**. Each round keeps only one side, so the work shrinks like n + n/2 + n/4 + … ≈ **2n: O(n) on average**.`,
          {
            arrays: [{ name: "nums", values: nums, tones: { ...toneRange(0, n - 1, "muted"), [target]: "success" }, pointers: pointersAt(n, { "k-1": target }, { "k-1": "secondary" }) }],
            vars: { answer: pivot },
            done: true,
          }
        );
        return r.frames;
      }
    }
  },
};

export default program;
