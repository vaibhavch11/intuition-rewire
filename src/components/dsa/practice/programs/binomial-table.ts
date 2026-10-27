import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function binomial(n, k) {
  // dp[i][j]: the number of ways to choose j items from i
  const dp = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0));
  for (let i = 0; i <= n; i++) {
    dp[i][0] = 1;                                   // choose nothing: one way
    for (let j = 1; j <= Math.min(i, k); j++) {
      dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];  // item i is in, or it's out
    }
  }
  return dp[n][k];
}`;

const program: Program = {
  title: "C(n, k) by tabulation: Pascal's rule",
  code,
  fields: [
    { key: "n", label: "n", kind: "number", min: 0, max: 8 },
    { key: "k", label: "k", kind: "number", min: 0, max: 5 },
  ],
  examples: [
    { label: "C(5, 2)", input: { n: 5, k: 2 } },
    { label: "C(6, 3)", input: { n: 6, k: 3 } },
    { label: "C(4, 4)", input: { n: 4, k: 4 } },
  ],
  check: (input) => ((input.k as number) <= (input.n as number) ? null : "k can't be bigger than n."),
  run(input) {
    const n = input.n as number;
    const k = input.k as number;
    const r = recorder();
    const dp: Scalar[][] = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(""));
    const view = (tones: Record<string, CellTone> = {}) => ({
      grids: [{ name: "dp[i][j] (rows i, columns j)", values: dp.map((row) => [...row]), tones }],
    });

    r.step(lineOf(code, "const dp = "), `One cell per subproblem: **dp[i][j]** = ways to choose j items from i. Cells with j > i stay blank (0 ways). Fill row by row: every cell reads only the row above.`, view());
    for (let i = 0; i <= n; i++) {
      dp[i][0] = 1;
      r.step(lineOf(code, "dp[i][0] = 1;"), `Row ${i}: choosing nothing from ${i} item${i === 1 ? "" : "s"} can be done one way. dp[${i}][0] = 1.`, view({ [cell(i, 0)]: "success" }));
      for (let j = 1; j <= Math.min(i, k); j++) {
        const a = dp[i - 1][j - 1] === "" ? 0 : (dp[i - 1][j - 1] as number);
        const b = dp[i - 1][j] === "" ? 0 : (dp[i - 1][j] as number);
        dp[i][j] = a + b;
        r.step(lineOf(code, "dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];"), `dp[${i}][${j}]: item ${i} is chosen (dp[${i - 1}][${j - 1}] = ${a} ways for the rest) or not (dp[${i - 1}][${j}] = ${b}). ${a} + ${b} = **${a + b}**.`, view({ [cell(i - 1, j - 1)]: "primary", [cell(i - 1, j)]: "primary", [cell(i, j)]: "write" }));
      }
    }
    r.step(lineOf(code, "return dp[n][k];"), `C(${n}, ${k}) = dp[${n}][${k}] = **${dp[n][k]}**. ${(n + 1) * (k + 1)} cells, O(1) each: O(n · k) time and space.`, { ...view({ [cell(n, k)]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
