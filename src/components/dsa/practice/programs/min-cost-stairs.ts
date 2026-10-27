import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function minCostClimbingStairs(cost) {
  const n = cost.length;
  const reach = new Array(n + 1).fill(0);        // reach[0] = reach[1] = 0: start for free
  for (let i = 2; i <= n; i++) {
    reach[i] = Math.min(reach[i - 1] + cost[i - 1],   // from one step below
                        reach[i - 2] + cost[i - 2]);  // or from two below
  }
  return reach[n];                               // the top
}`;

const program: Program = {
  title: "Min cost climbing stairs",
  code,
  fields: [{ key: "cost", label: "cost", kind: "array", maxLength: 10, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { cost: [10, 15, 20] } },
    { label: "Cheap steps", input: { cost: [1, 100, 1, 1, 1, 100, 1, 1, 100, 1] } },
    { label: "Four steps", input: { cost: [5, 2, 8, 3] } },
  ],
  check: (input) => ((input.cost as number[]).length >= 2 ? null : "Use at least 2 steps."),
  run(input) {
    const cost = input.cost as number[];
    const n = cost.length;
    const r = recorder();
    const reach: Scalar[] = new Array(n + 1).fill("");
    reach[0] = 0;
    reach[1] = 0;
    const view = (rt: Record<number, CellTone> = {}, ct: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "cost (to step off)", values: [...cost, "top"], tones: ct },
        { name: "reach (cheapest arrival)", values: [...reach], tones: rt },
      ],
    });

    r.step(lineOf(code, "const reach = "), `reach[i] = the cheapest total paid to **arrive** at step i. You may start on step 0 or 1 for free, so both are 0. The top is step ${n}.`, view({ 0: "success", 1: "success" }));
    for (let i = 2; i <= n; i++) {
      const a = (reach[i - 1] as number) + cost[i - 1];
      const b = (reach[i - 2] as number) + cost[i - 2];
      reach[i] = Math.min(a, b);
      const fromOne = a <= b;
      r.step(lineOf(code, "reach[i] = Math.min(reach[i - 1] + cost[i - 1],"), `${i === n ? "The top" : `Step ${i}`}: from step ${i - 1} costs ${reach[i - 1]} + ${cost[i - 1]} = ${a}; from step ${i - 2} costs ${reach[i - 2]} + ${cost[i - 2]} = ${b}. Keep **${reach[i]}**.`, view({ [i - 1]: fromOne ? "success" : "primary", [i - 2]: fromOne ? "primary" : "success", [i]: "write" }, { [fromOne ? i - 1 : i - 2]: "success" }));
    }
    r.step(lineOf(code, "return reach[n];"), `The cheapest way to the top costs **${reach[n]}**. O(n) time; only two values are read each step.`, { ...view({ [n]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
