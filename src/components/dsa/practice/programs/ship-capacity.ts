import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function shipWithinDays(weights, days) {
  const daysNeeded = (cap) => {
    let count = 1, load = 0;
    for (const w of weights) {
      if (load + w > cap) { count++; load = 0; }   // this package starts a new day
      load += w;
    }
    return count;
  };
  let low = Math.max(...weights);                  // the heaviest package must fit
  let high = weights.reduce((a, b) => a + b, 0);   // everything in one day
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (daysNeeded(mid) <= days) high = mid;       // big enough: try a smaller ship
    else low = mid + 1;                            // too small: needs a bigger ship
  }
  return low;
}`;

/** The day each package ships on when loading greedily at this capacity. */
function schedule(weights: number[], cap: number) {
  let day = 1;
  let load = 0;
  return weights.map((w) => {
    if (load + w > cap) {
      day++;
      load = 0;
    }
    load += w;
    return day;
  });
}

const program: Program = {
  title: "Capacity to ship packages within D days",
  code,
  fields: [
    { key: "weights", label: "weights", kind: "array", maxLength: 10, min: 1, max: 99 },
    { key: "days", label: "days", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "Example", input: { weights: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], days: 5 } },
    { label: "Three days", input: { weights: [3, 2, 2, 4, 1, 4], days: 3 } },
    { label: "Heavy one", input: { weights: [1, 1, 10, 1], days: 4 } },
  ],
  check: (input) => ((input.weights as number[]).length ? ((input.days as number) <= (input.weights as number[]).length ? null : "days can't be more than the number of packages.") : "Add at least one package."),
  run(input) {
    const weights = input.weights as number[];
    const days = input.days as number;
    const r = recorder();
    let low = Math.max(...weights);
    let high = weights.reduce((a, b) => a + b, 0);
    const dayTones = (plan: number[], ok: boolean): Record<number, CellTone> =>
      Object.fromEntries(plan.map((d, i) => [i, !ok && d > days ? "tertiary" : d % 2 ? "done" : "success"])) as Record<number, CellTone>;

    r.step(lineOf(code, "let high = weights.reduce"), `The capacity is between the heaviest package, **${low}**, and the total, **${high}** (everything in one day). A bigger ship never needs more days, so find the **first capacity that fits in ${days} day${days === 1 ? "" : "s"}**.`, {
      arrays: [{ name: "weights", values: weights }],
      vars: { days, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const plan = schedule(weights, mid);
      const need = plan[plan.length - 1];
      const ok = need <= days;
      r.step(lineOf(code, "const mid = low + "), `Try capacity **${mid}**: loading greedily in order, a package that doesn't fit starts a new day. That takes **${need}** day${need === 1 ? "" : "s"}.`, {
        arrays: [{ name: "weights", values: weights }, { name: `day at capacity ${mid}`, values: plan, tones: dayTones(plan, ok) }],
        vars: { days, low, mid, high, "days needed": need },
      });
      if (ok) {
        high = mid;
        r.step(lineOf(code, "if (daysNeeded(mid) <= days) high = mid;"), `${need} <= ${days}: capacity ${mid} is enough. Try a smaller ship — \`high = ${high}\`.`, { arrays: [{ name: "weights", values: weights }], vars: { days, low, high } });
      } else {
        low = mid + 1;
        r.step(lineOf(code, "else low = mid + 1;"), `${need} > ${days}: capacity ${mid} is too small, and so is anything smaller — \`low = ${low}\`.`, { arrays: [{ name: "weights", values: weights }], vars: { days, low, high } });
      }
    }
    const plan = schedule(weights, low);
    r.step(lineOf(code, "return low;"), `One capacity left: **${low}**, shipping in ${plan[plan.length - 1]} day${plan[plan.length - 1] === 1 ? "" : "s"}. **O(n log(total))**.`, {
      arrays: [{ name: "weights", values: weights }, { name: `day at capacity ${low}`, values: plan, tones: dayTones(plan, true) }],
      vars: { days, answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
