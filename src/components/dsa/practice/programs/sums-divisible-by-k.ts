import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function subarraysDivByK(nums, k) {
  const seen = new Map([[0, 1]]);               // remainder -> times seen so far
  let sum = 0, count = 0;
  for (const x of nums) {
    sum += x;
    const r = ((sum % k) + k) % k;              // 0..k-1, even when sum is negative
    count += seen.get(r) ?? 0;                  // same remainder: the gap is a multiple of k
    seen.set(r, (seen.get(r) ?? 0) + 1);
  }
  return count;
}`;

const mod = (x: number, k: number) => ((x % k) + k) % k;

const program: Program = {
  title: "Subarray sums divisible by k (remainder counts)",
  code,
  fields: [
    { key: "nums", label: "nums", kind: "array", maxLength: 10, min: -20, max: 20 },
    { key: "k", label: "k", kind: "number", min: 1, max: 20 },
  ],
  examples: [
    { label: "Example", input: { nums: [4, 5, 0, -2, -3, 1], k: 5 } },
    { label: "Negatives", input: { nums: [-1, 2, 9], k: 2 } },
    { label: "None", input: { nums: [5], k: 9 } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const k = input.k as number;
    const n = nums.length;
    const r = recorder();
    const seen = new Map<number, number>([[0, 1]]);
    const sums: Scalar[] = nums.map(() => null);
    const rems: Scalar[] = nums.map(() => null);
    const remAt = [0]; // remAt[t] = remainder of the prefix before index t
    let sum = 0;
    let count = 0;

    const views = (i: number, tones: Record<number, CellTone>, marks: MapMark<number>[] = []) => ({
      arrays: [
        { name: "nums", values: nums, tones, pointers: i >= 0 ? pointersAt(n, { i }) : {} },
        { name: "prefix sum", values: [...sums], tones: i >= 0 ? { [i]: "muted" as const } : {} },
        { name: `prefix sum mod ${k}`, values: [...rems], tones: i >= 0 ? { [i]: "primary" as const } : {} },
      ],
      maps: [mapView("seen", seen, { keyLabel: "remainder", valueLabel: "times", marks })],
    });

    r.step(
      2,
      `A subarray's sum is prefix(i) − prefix(before it). That difference is divisible by ${k} exactly when the two prefixes leave the **same remainder** mod ${k}. So count remainders instead of sums. **0 → 1** is the empty start.`,
      { ...views(-1, {}), vars: { k, sum, count } }
    );

    for (let i = 0; i < n; i++) {
      sum += nums[i];
      const rem = mod(sum, k);
      sums[i] = sum;
      rems[i] = rem;
      const times = seen.get(rem) ?? 0;
      const starts: number[] = [];
      remAt.forEach((p, t) => p === rem && starts.push(t));
      count += times;
      r.step(
        7,
        `${sum < 0 && sum % k !== 0 ? `sum = ${sum} is negative: ${sum} % ${k} = ${sum % k} in JavaScript, Java and C++, so add ${k} and take % ${k} again → **${rem}**. ` : `sum = ${sum} leaves remainder **${rem}**. `}${
          times === 0
            ? `No earlier prefix had remainder ${rem}, so nothing new ends here.`
            : `${times} earlier ${times === 1 ? "prefix has" : "prefixes have"} remainder ${rem}: ${starts.map((t) => `nums[${t}..${i}]`).join(", ")} ${times === 1 ? "is" : "are"} divisible by ${k}. count = **${count}**.`
        }`,
        {
          ...views(i, times ? toneRange(starts[starts.length - 1], i, "success") : { [i]: "primary" }, times ? [[rem, "success", `×${times}`]] : []),
          vars: { i, sum, r: rem, count },
        }
      );
      seen.set(rem, times + 1);
      remAt.push(rem);
      r.step(8, `Record remainder ${rem}: seen[${rem}] = ${times + 1}.`, {
        ...views(i, { [i]: "primary" }, [[rem, "write", times ? "+1" : "new"]]),
        vars: { i, sum, r: rem, count },
      });
    }

    r.step(10, `Done: **${count}** ${count === 1 ? "subarray has a sum" : "subarrays have sums"} divisible by ${k}. The map never holds more than ${k} keys — one per possible remainder.`, {
      ...views(-1, {}),
      vars: { k, count },
      done: true,
    });
    return r.frames;
  },
};

export default program;
