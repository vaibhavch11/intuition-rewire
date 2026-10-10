import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type Program, type Scalar } from "../types";

const code = `function canArrange(arr, k) {
  const count = new Map();                          // remainder -> how many
  for (const x of arr) {
    const r = ((x % k) + k) % k;                    // 0..k-1, even for negatives
    count.set(r, (count.get(r) ?? 0) + 1);
  }
  for (const [r, c] of count) {
    if (r === 0 || 2 * r === k) {
      if (c % 2 !== 0) return false;                // these pair among themselves
    } else if (c !== (count.get(k - r) ?? 0)) {
      return false;                                 // every r needs its own k - r
    }
  }
  return true;
}`;

const mod = (x: number, k: number) => ((x % k) + k) % k;

const program: Program = {
  title: "Pairs divisible by k (remainder counts)",
  code,
  fields: [
    { key: "arr", label: "arr", kind: "array", maxLength: 10, min: -50, max: 50 },
    { key: "k", label: "k", kind: "number", min: 1, max: 20 },
  ],
  examples: [
    { label: "Possible", input: { arr: [9, 7, 5, 3], k: 6 } },
    { label: "Not possible", input: { arr: [1, 2, 3, 4, 5, 6], k: 10 } },
    { label: "Negatives", input: { arr: [-1, 1, -2, 2, -3, 3, -4, 4], k: 3 } },
    { label: "Half of k", input: { arr: [2, 6, 4, 8], k: 4 } },
  ],
  check(input) {
    const n = (input.arr as number[]).length;
    if (n === 0) return "arr needs at least two numbers.";
    return n % 2 === 0 ? null : "arr needs an even number of values to split into pairs.";
  },
  run(input) {
    const arr = input.arr as number[];
    const k = input.k as number;
    const n = arr.length;
    const r = recorder();
    const count = new Map<number, number>();
    const rems: Scalar[] = arr.map(() => null);

    const views = (i: number, marks: MapMark<number>[] = []) => ({
      arrays: [
        // i >= 0: counting element i; -1: counting finished; -2: not started.
        {
          name: "arr",
          values: arr,
          tones: i >= 0 ? toneRange(0, i - 1, "done", { [i]: "primary" }) : i === -1 ? toneRange(0, n - 1, "done") : {},
          pointers: i >= 0 ? pointersAt(n, { x: i }) : {},
        },
        { name: `x % ${k} (kept in 0..${k - 1})`, values: [...rems] },
      ],
      maps: [mapView("count", count, { keyLabel: "remainder", valueLabel: "count", marks })],
    });

    r.step(2, `Two numbers add up to a multiple of ${k} exactly when their **remainders** add up to ${k} (or are both 0). So the exact values don't matter — only how many of each remainder there are. Count them first.`, {
      ...views(-2),
      vars: { k },
    });

    arr.forEach((x, i) => {
      const rem = mod(x, k);
      rems[i] = rem;
      const before = count.get(rem);
      count.set(rem, (before ?? 0) + 1);
      r.step(
        5,
        x < 0
          ? `${x} % ${k} is ${x % k} in most languages — negative! Adding ${k} and taking % ${k} again gives **${rem}**, the remainder that pairs correctly.`
          : `${x} leaves remainder **${rem}** when divided by ${k}. count[${rem}] becomes ${(before ?? 0) + 1}.`,
        { ...views(i, [[rem, "write", before === undefined ? "new" : "+1"]]), vars: { x, r: rem } }
      );
    });

    for (const [rem, c] of count) {
      if (rem === 0 || 2 * rem === k) {
        const ok = c % 2 === 0;
        r.step(
          ok ? 8 : 9,
          rem === 0
            ? `Remainder 0 (exact multiples of ${k}) can only pair with another remainder 0, so their count must be even: ${c} is ${ok ? "even — fine" : "odd — one is left without a partner: **false**"}.`
            : `Remainder ${rem} is half of ${k}, so it pairs with another ${rem}: the count must be even. ${c} is ${ok ? "even — fine" : "odd — one is left without a partner: **false**"}.`,
          { ...views(-1, [[rem, ok ? "success" : "tertiary", "r"]]), vars: { r: rem, "count[r]": c }, done: !ok }
        );
        if (!ok) return r.frames;
      } else {
        const partner = count.get(k - rem) ?? 0;
        const ok = c === partner;
        r.step(
          ok ? 10 : 11,
          ok
            ? `Remainder ${rem} needs remainder ${k - rem} (${rem} + ${k - rem} = ${k}). There are ${c} of each, so they can all pair up.`
            : `Remainder ${rem} needs remainder ${k - rem} (${rem} + ${k - rem} = ${k}), but there ${c === 1 ? "is" : "are"} ${c} of one and ${partner} of the other. Someone is left without a partner: **false**.`,
          { ...views(-1, [[rem, ok ? "success" : "tertiary", "r"], [k - rem, ok ? "success" : "tertiary", "k − r"]]), vars: { r: rem, "count[r]": c, "count[k − r]": partner }, done: !ok }
        );
        if (!ok) return r.frames;
      }
    }

    r.step(14, `Every remainder has a matching partner group, so the ${n} numbers can be split into ${n / 2} pairs whose sums are all divisible by ${k}: **true**.`, {
      ...views(-1, [...count.keys()].map((key) => [key, "success"] as MapMark<number>)),
      vars: { pairs: n / 2 },
      done: true,
    });
    return r.frames;
  },
};

export default program;
