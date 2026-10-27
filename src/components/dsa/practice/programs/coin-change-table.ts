import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function coinChange(coins, amount) {
  const fewest = new Array(amount + 1).fill(Infinity);   // fewest[a]: coins to make a
  fewest[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) fewest[a] = Math.min(fewest[a], fewest[a - c] + 1);   // end with coin c
    }
  }
  return fewest[amount] === Infinity ? -1 : fewest[amount];
}`;

const show = (v: number) => (v === Infinity ? "∞" : v);

const program: Program = {
  title: "Coin change: the fewest coins for every amount",
  code,
  fields: [
    { key: "coins", label: "coins", kind: "array", maxLength: 4, min: 1, max: 20 },
    { key: "amount", label: "amount", kind: "number", min: 0, max: 20 },
  ],
  examples: [
    { label: "Greedy trap", input: { coins: [1, 3, 4], amount: 6 } },
    { label: "Example", input: { coins: [1, 2, 5], amount: 11 } },
    { label: "Impossible", input: { coins: [2], amount: 3 } },
    { label: "No 1-coin", input: { coins: [3, 5], amount: 11 } },
  ],
  check: (input) => ((input.coins as number[]).length ? null : "Add at least one coin."),
  run(input) {
    const coins = input.coins as number[];
    const amount = input.amount as number;
    const r = recorder();
    const fewest: number[] = new Array(amount + 1).fill(Infinity);
    fewest[0] = 0;
    const view = (ft: Record<number, CellTone> = {}, ct: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "coins", values: coins, tones: ct },
        { name: `fewest[a] (a = 0..${amount})`, values: fewest.map(show), tones: ft },
      ],
    });

    r.step(lineOf(code, "fewest[0] = 0;"), `fewest[a] = the fewest coins that make exactly a. Making 0 takes **0** coins; every other amount starts at ∞ ("not possible yet").`, view({ 0: "write" }));
    for (let a = 1; a <= amount; a++) {
      const tries: string[] = [];
      const ft: Record<number, CellTone> = {};
      const ct: Record<number, CellTone> = {};
      let bestCoin = -1;
      coins.forEach((c, i) => {
        if (c > a) return;
        ct[i] = "primary";
        ft[a - c] = "primary";
        tries.push(`coin ${c} → fewest[${a - c}] + 1 = ${fewest[a - c] === Infinity ? "∞" : fewest[a - c] + 1}`);
        if (fewest[a - c] + 1 < fewest[a]) {
          fewest[a] = fewest[a - c] + 1;
          bestCoin = i;
        }
      });
      if (bestCoin >= 0) {
        ft[a - coins[bestCoin]] = "success";
        ct[bestCoin] = "success";
      }
      ft[a] = "write";
      const note = !tries.length
        ? `a = ${a}: every coin is bigger than ${a}. fewest[${a}] stays **∞**.`
        : `a = ${a}: ${tries.join("; ")}. fewest[${a}] = **${show(fewest[a])}**${bestCoin >= 0 ? ` (last coin ${coins[bestCoin]})` : ""}.`;
      r.step(lineOf(code, "if (c <= a) fewest[a] = Math.min("), note, view(ft, ct));
    }
    if (fewest[amount] === Infinity) {
      r.step(lineOf(code, "return fewest[amount] === Infinity"), `fewest[${amount}] is still ∞: no mix of these coins makes ${amount}. Return **-1**.`, { ...view({ [amount]: "tertiary" }), done: true });
      return r.frames;
    }
    // Walk back: some coin c always has fewest[a - c] one less than fewest[a].
    const used: number[] = [];
    const path: Record<number, CellTone> = { [amount]: "success" };
    for (let a = amount; a > 0; ) {
      const c = coins.find((coin) => coin <= a && fewest[a - coin] === fewest[a] - 1) as number;
      used.push(c);
      a -= c;
      path[a] = "done";
    }
    r.step(lineOf(code, "return fewest[amount] === Infinity"), `The fewest coins for ${amount}: **${fewest[amount]}**${used.length ? ` — ${used.join(" + ")}` : ""}. O(amount · k) time, O(amount) space.`, { ...view(path), done: true });
    return r.frames;
  },
};

export default program;
