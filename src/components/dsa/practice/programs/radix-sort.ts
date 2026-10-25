import { lineOf } from "../graphs";
import { recorder, toneRange, type MapView, type Program } from "../types";

const code = `function radixSort(nums) {
  const max = Math.max(0, ...nums);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const buckets = Array.from({ length: 10 }, () => []);
    for (const x of nums) buckets[Math.floor(x / exp) % 10].push(x);   // stable: keep arrival order
    nums = buckets.flat();
  }
  return nums;
}`;

const program: Program = {
  title: "Radix sort (least significant digit first)",
  code,
  fields: [{ key: "nums", label: "nums (0 to 999)", kind: "array", maxLength: 8, min: 0, max: 999 }],
  examples: [
    { label: "Example", input: { nums: [170, 45, 75, 90, 802, 24, 2, 66] } },
    { label: "Two digits", input: { nums: [42, 17, 93, 15, 40] } },
  ],
  run(input) {
    let nums = [...(input.nums as number[])];
    const r = recorder();
    const max = Math.max(0, ...nums);
    const place = (exp: number) => (exp === 1 ? "ones" : exp === 10 ? "tens" : exp === 100 ? "hundreds" : `${exp}s`);
    const bucketView = (buckets: number[][], digit: number | null): MapView => ({
      name: "buckets (by digit)",
      entries: buckets.map((b, d) => [d, b.length ? b.join(", ") : "—"]),
      tones: digit === null ? {} : { [digit]: "write" },
      keyLabel: "digit",
      valueLabel: "values",
    });

    r.step(lineOf(code, "const max = Math.max(0, ...nums);"), `Radix sort sorts by **one digit at a time**, starting with the ones digit. Each round drops every value into one of 10 buckets by that digit, then reads the buckets back in order. The largest value, ${max}, has ${String(max).length} digit${String(max).length === 1 ? "" : "s"}, so that's how many rounds.`, { arrays: [{ name: "nums", values: [...nums] }] });
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      const buckets: number[][] = Array.from({ length: 10 }, () => []);
      nums.forEach((x, i) => {
        const d = Math.floor(x / exp) % 10;
        buckets[d].push(x);
        r.step(lineOf(code, "for (const x of nums) buckets"), `${x}: its ${place(exp)} digit is **${d}**, so it goes into bucket ${d} (after anything already there).`, { arrays: [{ name: "nums", values: [...nums], tones: { [i]: "primary" } }], maps: [bucketView(buckets, d)], vars: { exp } });
      });
      nums = buckets.flat();
      r.step(lineOf(code, "nums = buckets.flat();"), `Read the buckets back from 0 to 9: the values are now sorted by their last ${String(exp).length} digit${exp === 1 ? "" : "s"}. Because each bucket keeps arrival order (stable), the earlier rounds' order survives among equal digits.`, { arrays: [{ name: "nums", values: [...nums], tones: toneRange(0, nums.length - 1, "write") }], maps: [bucketView(buckets, null)], vars: { exp } });
    }
    r.step(lineOf(code, "return nums;"), `Sorted: **[${nums.join(", ")}]**. d rounds of O(n + 10) each: **O(d · (n + b))** time and **O(n + b)** space, for d digits in base b — linear when the numbers have a fixed number of digits.`, { arrays: [{ name: "nums", values: [...nums], tones: toneRange(0, nums.length - 1, "success") }], done: true });
    return r.frames;
  },
};

export default program;
