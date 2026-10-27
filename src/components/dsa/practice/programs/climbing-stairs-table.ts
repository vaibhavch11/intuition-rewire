import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function climbStairs(n) {
  const ways = new Array(n + 1).fill(0);     // ways[i]: ways to stand on step i
  ways[0] = 1;
  ways[1] = 1;
  for (let i = 2; i <= n; i++) {
    ways[i] = ways[i - 1] + ways[i - 2];     // from one step below, or two
  }
  return ways[n];
}`;

const program: Program = {
  title: "Climbing stairs: a table of ways",
  code,
  fields: [{ key: "n", label: "n (steps)", kind: "number", min: 1, max: 15 }],
  examples: [
    { label: "n = 5", input: { n: 5 } },
    { label: "n = 3", input: { n: 3 } },
    { label: "n = 10", input: { n: 10 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const ways: Scalar[] = new Array(n + 1).fill("");
    ways[0] = 1;
    ways[1] = 1;
    const view = (tones: Record<number, CellTone> = {}) => ({ arrays: [{ name: "ways (index = step)", values: [...ways], tones }] });

    r.step(lineOf(code, "ways[1] = 1;"), `ways[i] = the number of ways to stand on step i. Base cases: **1 way** to be on step 0 (don't move) and 1 way to reach step 1.`, view({ 0: "success", 1: "success" }));
    for (let i = 2; i <= n; i++) {
      ways[i] = (ways[i - 1] as number) + (ways[i - 2] as number);
      r.step(lineOf(code, "ways[i] = ways[i - 1] + ways[i - 2];"), `Step ${i}: the last move came from step ${i - 1} (${ways[i - 1]} ways) or from step ${i - 2} (${ways[i - 2]} ways): **${ways[i]}**.`, view({ [i - 1]: "primary", [i - 2]: "primary", [i]: "write" }));
    }
    r.step(lineOf(code, "return ways[n];"), `**${ways[n]}** ways to climb ${n} step${n === 1 ? "" : "s"}. One pass, O(n) — and only the last two values are ever read, so two variables would do.`, { ...view({ [n]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
