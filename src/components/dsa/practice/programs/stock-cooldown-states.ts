import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function maxProfit(prices) {
  let hold = -prices[0], sold = 0, rest = 0;     // best profit ending the day holding / having just sold / resting
  for (const p of prices) {
    const prevSold = sold;
    sold = hold + p;                             // sell the share we held
    hold = Math.max(hold, rest - p);             // keep it, or buy: only from rest, never right after a sale
    rest = Math.max(rest, prevSold);             // yesterday's sale makes today a cooldown
  }
  return Math.max(sold, rest);
}`;

const HOLD = 0;
const SOLD = 1;
const REST = 2;

const program: Program = {
  title: "Stock with cooldown: three states a day",
  code,
  fields: [{ key: "prices", label: "prices", kind: "array", maxLength: 10, min: 0, max: 20 }],
  examples: [
    { label: "Example", input: { prices: [1, 2, 3, 0, 2] } },
    { label: "Falling", input: { prices: [5, 4, 3, 1] } },
    { label: "Two trades", input: { prices: [6, 1, 3, 2, 4, 7] } },
    { label: "Wait it out", input: { prices: [1, 4, 2, 7] } },
  ],
  check: (input) => ((input.prices as number[]).length ? null : "Add at least one price."),
  run(input) {
    const prices = input.prices as number[];
    const n = prices.length;
    const r = recorder();
    // table[state][d + 1]; column 0 is the start, before day 0.
    const table: number[][] = [[-prices[0]], [0], [0]];
    const shown: Scalar[][] = [0, 1, 2].map(() => new Array(n).fill(""));
    const view = (d: number, tones: Record<string, CellTone> = {}, pt: Record<number, CellTone> = {}) => ({
      arrays: [{ name: "prices", values: prices, tones: pt, chart: true }],
      grids: [{ name: "best profit at the end of each day", values: shown.map((row) => [...row]), tones, rowLabels: ["hold", "sold", "rest"], columnLabels: prices.map((_, k) => `day ${k}`) }],
      vars: d < 0 ? { hold: table[HOLD][0], sold: 0, rest: 0 } : { day: d, price: prices[d], hold: table[HOLD][d + 1], sold: table[SOLD][d + 1], rest: table[REST][d + 1] },
    });

    r.step(lineOf(code, "let hold = -prices[0]"), `Three states for the end of each day: **hold** a share, just **sold** one, or **rest** (no share, free to buy). Start: hold = −${prices[0]} (as if bought on day 0), sold = rest = 0.`, view(-1));
    for (let d = 0; d < n; d++) {
      const p = prices[d];
      const [h0, s0, r0] = [table[HOLD][d], table[SOLD][d], table[REST][d]];
      const sold = h0 + p;
      const hold = Math.max(h0, r0 - p);
      const rest = Math.max(r0, s0);
      table[HOLD].push(hold);
      table[SOLD].push(sold);
      table[REST].push(rest);
      shown[HOLD][d] = hold;
      shown[SOLD][d] = sold;
      shown[REST][d] = rest;
      const tones: Record<string, CellTone> = { [`${HOLD},${d}`]: "write", [`${SOLD},${d}`]: "write", [`${REST},${d}`]: "write" };
      if (d > 0) {
        tones[`${HOLD},${d - 1}`] = "primary";
        tones[`${SOLD},${d - 1}`] = "primary";
        tones[`${REST},${d - 1}`] = "primary";
      }
      const buy = r0 - p > h0;
      r.step(lineOf(code, "rest = Math.max(rest, prevSold);"), `Day ${d}, price ${p}. sold = ${h0} + ${p} = **${sold}**. hold = max(keep ${h0}, buy ${r0} − ${p} = ${r0 - p}) = ${hold}${buy ? " (buy today)" : ""}. rest = max(${r0}, yesterday's sold ${s0}) = ${rest}.`, view(d, tones, { [d]: "primary" }));
    }
    const answer = Math.max(table[SOLD][n], table[REST][n]);
    // Walk back through the states to recover the trades.
    const trades: [number, number][] = [];
    const path: Record<string, CellTone> = {};
    let state = table[SOLD][n] > table[REST][n] ? SOLD : REST;
    let sellDay = -1;
    for (let d = n - 1; d >= 0; d--) {
      path[`${state},${d}`] = "success";
      if (state === SOLD) {
        sellDay = d;
        state = HOLD;
      } else if (state === HOLD) {
        if (table[HOLD][d + 1] !== table[HOLD][d]) {
          trades.push([d, sellDay]);
          state = REST;
        }
      } else if (table[REST][d + 1] !== table[REST][d]) {
        state = SOLD;
      }
    }
    if (state === HOLD) trades.push([0, sellDay]); // the starting share, bought on day 0
    trades.reverse();
    const story = trades.length ? trades.map(([b, s]) => `buy day ${b} (${prices[b]}), sell day ${s} (${prices[s]})`).join("; ") : "no trade beats doing nothing";
    r.step(lineOf(code, "return Math.max(sold, rest);"), `End without a share: max(sold ${table[SOLD][n]}, rest ${table[REST][n]}) = **${answer}** — ${story}. O(n) time, O(1) space.`, { ...view(n - 1, path), done: true });
    return r.frames;
  },
};

export default program;
