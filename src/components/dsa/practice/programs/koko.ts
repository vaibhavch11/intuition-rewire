import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function minEatingSpeed(piles, h) {
  const hours = (k) => piles.reduce((sum, p) => sum + Math.ceil(p / k), 0);
  let low = 1;
  let high = Math.max(...piles);               // at this speed every pile takes one hour
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (hours(mid) <= h) high = mid;           // fast enough: the answer is mid or slower
    else low = mid + 1;                        // too slow: the answer is faster
  }
  return low;
}`;

const program: Program = {
  title: "Koko eating bananas (binary search on the speed)",
  code,
  fields: [
    { key: "piles", label: "piles", kind: "array", maxLength: 8, min: 1, max: 999 },
    { key: "h", label: "h (hours)", kind: "number", min: 1, max: 999 },
  ],
  examples: [
    { label: "Example", input: { piles: [3, 6, 7, 11], h: 8 } },
    { label: "Tight", input: { piles: [30, 11, 23, 4, 20], h: 5 } },
    { label: "One more hour", input: { piles: [30, 11, 23, 4, 20], h: 6 } },
  ],
  check: (input) => ((input.piles as number[]).length && (input.h as number) >= (input.piles as number[]).length ? null : "h must be at least the number of piles — she can only work on one pile per hour."),
  run(input) {
    const piles = input.piles as number[];
    const h = input.h as number;
    const r = recorder();
    const perPile = (k: number) => piles.map((p) => Math.ceil(p / k));
    const hours = (k: number) => perPile(k).reduce((a, b) => a + b, 0);
    let low = 1;
    let high = Math.max(...piles);
    const tones = (tone: CellTone): Record<number, CellTone> => Object.fromEntries(piles.map((_, i) => [i, tone]));

    r.step(lineOf(code, "let high = Math.max(...piles);"), `The speed is somewhere in **${low}..${high}**: at ${high} bananas an hour every pile takes one hour, ${piles.length} hours in all, within ${h}. Faster never takes longer, so find the **first speed that finishes in time**.`, {
      arrays: [{ name: "piles", values: piles }],
      vars: { h, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const t = hours(mid);
      const ok = t <= h;
      r.step(lineOf(code, "const mid = low + "), `Try **k = ${mid}**: each pile takes ⌈pile / ${mid}⌉ hours — ${perPile(mid).join(" + ")} = **${t}** hours.`, {
        arrays: [{ name: "piles", values: piles }, { name: `hours at k = ${mid}`, values: perPile(mid), tones: tones(ok ? "success" : "tertiary") }],
        vars: { h, low, mid, high, "hours(mid)": t },
      });
      if (ok) {
        high = mid;
        r.step(lineOf(code, "if (hours(mid) <= h) high = mid;"), `${t} <= ${h}: speed ${mid} is fast enough. The slowest that works is ${mid} or less — \`high = ${high}\`.`, { arrays: [{ name: "piles", values: piles }], vars: { h, low, high } });
      } else {
        low = mid + 1;
        r.step(lineOf(code, "else low = mid + 1;"), `${t} > ${h}: speed ${mid} is too slow, and so is anything slower — \`low = ${low}\`.`, { arrays: [{ name: "piles", values: piles }], vars: { h, low, high } });
      }
    }
    r.step(lineOf(code, "return low;"), `One speed left: Koko needs **${low}** bananas an hour (${hours(low)} hours). About log₂(max pile) checks of n piles each — **O(n log max)**.`, {
      arrays: [{ name: "piles", values: piles }, { name: `hours at k = ${low}`, values: perPile(low), tones: tones("success") }],
      vars: { h, answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
