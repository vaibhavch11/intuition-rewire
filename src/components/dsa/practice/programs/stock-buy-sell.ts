import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    } else if (prices[i] - minPrice > maxProfit) {
      maxProfit = prices[i] - minPrice;
    }
  }
  return maxProfit;
}`;

const program: Program = {
  title: "Best time to buy and sell stock",
  code,
  fields: [{ key: "prices", label: "prices", kind: "array", maxLength: 10, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { prices: [7, 1, 5, 3, 6, 4] } },
    { label: "Prices only fall", input: { prices: [7, 6, 4, 3, 1] } },
    { label: "Late dip", input: { prices: [3, 8, 2, 9, 1, 4] } },
  ],
  run(input) {
    const prices = input.prices as number[];
    const n = prices.length;
    const r = recorder();
    let minPrice = Infinity;
    let minAt: number | undefined;
    let maxProfit = 0;
    let bestBuy: number | undefined;
    let bestSell: number | undefined;

    const view = (i: number | undefined, tones: Record<number, CellTone>) => ({
      name: "prices",
      values: prices,
      chart: true,
      tones: {
        ...(minAt !== undefined ? { [minAt]: "tertiary" as CellTone } : {}),
        ...tones,
      },
      pointers: pointersAt(n, { i, min: minAt }, { min: "tertiary" }),
    });

    r.step(
      3,
      `Walk the days once. \`minPrice\` remembers the cheapest day **so far** (the best day to have bought), and \`maxProfit\` the best sale seen.`,
      { arrays: [view(undefined, {})], vars: { minPrice, maxProfit } }
    );

    for (let i = 0; i < n; i++) {
      const p = prices[i];
      if (p < minPrice) {
        const was = minPrice;
        minPrice = p;
        minAt = i;
        r.step(
          6,
          `Day ${i}: price **${p}** is cheaper than any day before (${was === Infinity ? "∞" : was}). Selling today can't make a profit, but it's the new best day to **buy**.`,
          { arrays: [view(i, { ...toneRange(0, i - 1, "done"), [i]: "write" })], vars: { i, "prices[i]": p, minPrice, maxProfit } }
        );
      } else if (p - minPrice > maxProfit) {
        maxProfit = p - minPrice;
        bestBuy = minAt;
        bestSell = i;
        r.step(
          8,
          `Day ${i}: selling at **${p}** after buying at ${minPrice} earns **${p - minPrice}** — the best so far.`,
          { arrays: [view(i, { ...toneRange(0, i - 1, "done"), [i]: "success" })], vars: { i, "prices[i]": p, minPrice, maxProfit } }
        );
      } else {
        r.step(
          7,
          `Day ${i}: selling at ${p} would earn ${p - minPrice}, which doesn't beat ${maxProfit}. Nothing changes.`,
          { arrays: [view(i, { ...toneRange(0, i - 1, "done"), [i]: "primary" })], vars: { i, "prices[i]": p, minPrice, maxProfit } }
        );
      }
    }

    r.step(
      11,
      maxProfit > 0
        ? `Buy on day ${bestBuy} (${prices[bestBuy!]}) and sell on day ${bestSell} (${prices[bestSell!]}) for a profit of **${maxProfit}**. One pass: O(n) time, O(1) space.`
        : `Prices never rose after a dip, so the best choice is **not to trade**: profit 0.`,
      {
        arrays: [
          {
            name: "prices",
            values: prices,
            chart: true,
            tones:
              maxProfit > 0 ? { [bestBuy!]: "tertiary", [bestSell!]: "success" } : {},
            pointers:
              maxProfit > 0
                ? pointersAt(n, { buy: bestBuy, sell: bestSell }, { buy: "tertiary", sell: "secondary" })
                : {},
          },
        ],
        vars: { maxProfit },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
