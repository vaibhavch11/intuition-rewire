import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function change(amount, coins) {
  const ways = new Array(amount + 1).fill(0);    // ways[a]: combinations that make a
  ways[0] = 1;                                   // take nothing
  for (const c of coins) {                       // coins outside: each combination counted once
    for (let a = c; a <= amount; a++) ways[a] += ways[a - c];   // forwards: c can repeat
  }
  return ways[amount];
}`;

const program: Program = {
  title: "Coin change II: count the combinations",
  code,
  fields: [
    { key: "amount", label: "amount", kind: "number", min: 0, max: 20 },
    { key: "coins", label: "coins (distinct)", kind: "array", maxLength: 4, min: 1, max: 20 },
  ],
  examples: [
    { label: "Example", input: { amount: 5, coins: [1, 2, 5] } },
    { label: "Order doesn't matter", input: { amount: 3, coins: [1, 2] } },
    { label: "Unreachable", input: { amount: 3, coins: [2] } },
    { label: "Bigger", input: { amount: 12, coins: [2, 3, 7] } },
  ],
  check: (input) => {
    const coins = input.coins as number[];
    if (!coins.length) return "Add at least one coin.";
    return new Set(coins).size === coins.length ? null : "Coin values must be different.";
  },
  run(input) {
    const amount = input.amount as number;
    const coins = input.coins as number[];
    const r = recorder();
    const ways: number[] = new Array(amount + 1).fill(0);
    ways[0] = 1;
    const view = (wt: Record<number, CellTone> = {}, ct: Record<number, CellTone> = {}, c?: number) => ({
      arrays: [
        { name: "coins", values: coins, tones: ct },
        { name: `ways[a] (a = 0..${amount})`, values: [...ways], tones: wt },
      ],
      vars: c === undefined ? { amount } : { amount, c },
    });

    r.step(lineOf(code, "ways[0] = 1;"), `ways[a] = the number of combinations of the coins seen so far that make a. Before any coin, only 0 can be made — by taking nothing — so ways[0] = **1**.`, view({ 0: "write" }));
    coins.forEach((c, i) => {
      const ct: Record<number, CellTone> = {};
      for (let j = 0; j < i; j++) ct[j] = "done";
      ct[i] = "primary";
      if (c > amount) {
        r.step(lineOf(code, "for (const c of coins) {"), `Coin ${c} is bigger than ${amount}: it can't be part of any combination. Nothing changes.`, view({}, ct, c));
        return;
      }
      r.step(lineOf(code, "for (const c of coins) {"), `Now allow coin **${c}**, as many times as you like. Each a from ${c} up gains the combinations for a − ${c}, plus one ${c}.`, view({}, ct, c));
      for (let a = c; a <= amount; a++) {
        if (ways[a - c] === 0) continue;
        const old = ways[a];
        ways[a] += ways[a - c];
        const reuse = a - c >= c ? ` (ways[${a - c}] was already updated for ${c}, so ${c} can repeat)` : "";
        r.step(lineOf(code, "for (let a = c; a <= amount; a++) ways[a] += ways[a - c];"), `a = ${a}: ${old} without any ${c}, plus ${ways[a - c]} that end${ways[a - c] === 1 ? "s" : ""} with a ${c}${reuse}. ways[${a}] = **${ways[a]}**.`, view({ [a - c]: "primary", [a]: "write" }, ct, c));
      }
    });
    r.step(lineOf(code, "return ways[amount];"), `**${ways[amount]}** combination${ways[amount] === 1 ? "" : "s"} make ${amount}. Coins in the outer loop add each coin type once, so 1 + 2 and 2 + 1 count as one. O(k · amount) time, O(amount) space.`, { ...view({ [amount]: ways[amount] ? "success" : "tertiary" }, Object.fromEntries(coins.map((_, i) => [i, "done"])) as Record<number, CellTone>), done: true });
    return r.frames;
  },
};

export default program;
