import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function minSteps(n) {
  const dp = new Array(n + 1).fill(0);             // dp[i]: fewest steps from i down to 1
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + 1;                         // subtract 1
    if (i % 2 === 0) dp[i] = Math.min(dp[i], dp[i / 2] + 1);   // or divide by 2
    if (i % 3 === 0) dp[i] = Math.min(dp[i], dp[i / 3] + 1);   // or divide by 3
  }
  return dp[n];
}`;

const program: Program = {
  title: "Minimum steps to one (tabulation)",
  code,
  fields: [{ key: "n", label: "n", kind: "number", min: 1, max: 20 }],
  examples: [
    { label: "n = 10", input: { n: 10 } },
    { label: "n = 15", input: { n: 15 } },
    { label: "n = 7", input: { n: 7 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const dp: Scalar[] = new Array(n + 1).fill("");
    dp[1] = 0;
    const view = (tones: Record<number, CellTone> = {}) => ({ arrays: [{ name: "dp (index = the number)", values: [...dp], tones: { 0: "muted" as CellTone, ...tones } }] });

    r.step(lineOf(code, "const dp = "), `dp[i] = the fewest steps from i down to 1, using −1, ÷2 or ÷3. Base case: **dp[1] = 0**. Fill i = 2, 3, …, ${n}: every move goes to a smaller number, which is already filled.`, view({ 1: "success" }));
    for (let i = 2; i <= n; i++) {
      const opts: [string, number][] = [[`${i} − 1 = ${i - 1}`, i - 1]];
      if (i % 2 === 0) opts.push([`${i} ÷ 2 = ${i / 2}`, i / 2]);
      if (i % 3 === 0) opts.push([`${i} ÷ 3 = ${i / 3}`, i / 3]);
      let best = opts[0];
      for (const o of opts) if ((dp[o[1]] as number) < (dp[best[1]] as number)) best = o;
      dp[i] = (dp[best[1]] as number) + 1;
      const tones: Record<number, CellTone> = {};
      for (const o of opts) tones[o[1]] = o === best ? "success" : "primary";
      tones[i] = "write";
      r.step(lineOf(code, opts.length === 1 ? "dp[i] = dp[i - 1] + 1;" : i % 3 === 0 ? "if (i % 3 === 0)" : "if (i % 2 === 0)"), `dp[${i}]: ${opts.map(([t, j]) => `${t} (${dp[j]} more)`).join(", ")}. Best: ${best[0]}, so dp[${i}] = ${dp[best[1]]} + 1 = **${dp[i]}**.`, view(tones));
    }
    const path = [n];
    for (let x = n; x > 1; ) {
      const next = [x - 1, x % 2 === 0 ? x / 2 : -1, x % 3 === 0 ? x / 3 : -1].filter((y) => y >= 1).find((y) => (dp[y] as number) === (dp[x] as number) - 1) as number;
      path.push(next);
      x = next;
    }
    r.step(lineOf(code, "return dp[n];"), `dp[${n}] = **${dp[n]}**: ${path.join(" → ")}. ${n - 1} cells, O(1) each — O(n).`, { ...view(Object.fromEntries(path.map((x) => [x, "success"])) as Record<number, CellTone>), done: true });
    return r.frames;
  },
};

export default program;
