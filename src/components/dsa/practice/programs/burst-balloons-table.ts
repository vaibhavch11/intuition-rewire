import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Pointer, type Program, type Scalar } from "../types";

const code = `function maxCoins(nums) {
  const vals = [1, ...nums, 1];
  const m = vals.length;
  // dp[l][r]: most coins for bursting every balloon strictly between l and r
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));
  for (let gap = 2; gap < m; gap++) {            // shorter ranges first
    for (let l = 0; l + gap < m; l++) {
      const r = l + gap;
      for (let k = l + 1; k < r; k++) {          // k bursts last, between l and r
        dp[l][r] = Math.max(dp[l][r], dp[l][k] + vals[l] * vals[k] * vals[r] + dp[k][r]);
      }
    }
  }
  return dp[0][m - 1];
}`;

const program: Program = {
  title: "Burst balloons: choose the last balloon in each range",
  code,
  fields: [{ key: "nums", label: "nums (balloons)", kind: "array", maxLength: 5, min: 0, max: 20 }],
  examples: [
    { label: "Example", input: { nums: [3, 1, 5, 8] } },
    { label: "Two balloons", input: { nums: [1, 5] } },
    { label: "A zero", input: { nums: [9, 0, 9] } },
    { label: "Equal", input: { nums: [2, 2, 2] } },
  ],
  check: (input) => ((input.nums as number[]).length ? null : "Add at least one balloon."),
  run(input) {
    const nums = input.nums as number[];
    const vals = [1, ...nums, 1];
    const m = vals.length;
    const rec = recorder();
    const dp: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
    const lastOf: number[][] = Array.from({ length: m }, () => new Array(m).fill(-1));
    const shown: Scalar[][] = Array.from({ length: m }, (_, l) => Array.from({ length: m }, (_, r) => (r - l === 1 ? 0 : "")));
    const muted: Record<string, CellTone> = {};
    for (let l = 0; l < m; l++) for (let r = 0; r <= l; r++) muted[cell(l, r)] = "muted";
    const view = (tones: Record<string, CellTone>, vt: Record<number, CellTone>, ptr: Record<number, Pointer[]> = {}) => ({
      arrays: [{ name: "vals (1 = wall)", values: vals, tones: vt, pointers: ptr }],
      grids: [{ name: "dp[l][r]: most coins strictly between l and r", values: shown.map((row) => [...row]), tones: { ...muted, ...tones } }],
    });
    const walls: Record<number, CellTone> = { 0: "muted", [m - 1]: "muted" };

    rec.step(lineOf(code, "const dp = "), `Pad the row with a 1 at each end. dp[l][r] = the most coins from bursting every balloon **strictly between** l and r. Neighbours (r = l + 1) have nothing between them: 0.`, view({}, walls));
    for (let gap = 2; gap < m; gap++) {
      for (let l = 0; l + gap < m; l++) {
        const r = l + gap;
        const tries: string[] = [];
        for (let k = l + 1; k < r; k++) {
          const coins = dp[l][k] + vals[l] * vals[k] * vals[r] + dp[k][r];
          tries.push(`k=${k}: ${dp[l][k]} + ${vals[l]}·${vals[k]}·${vals[r]} + ${dp[k][r]} = ${coins}`);
          if (coins > dp[l][r] || lastOf[l][r] < 0) {
            dp[l][r] = coins;
            lastOf[l][r] = k;
          }
        }
        shown[l][r] = dp[l][r];
        const k = lastOf[l][r];
        const tones: Record<string, CellTone> = { [cell(l, r)]: "write", [cell(l, k)]: "primary", [cell(k, r)]: "primary" };
        const vt: Record<number, CellTone> = { ...walls };
        for (let x = l + 1; x < r; x++) vt[x] = "primary";
        vt[k] = "success";
        const ptr: Record<number, Pointer[]> = { [l]: [{ label: "l" }], [r]: [{ label: "r" }], [k]: [{ label: "last", tone: "tertiary" }] };
        rec.step(lineOf(code, "dp[l][r] = Math.max(dp[l][r], dp[l][k]"), `Range (${l}, ${r}): which balloon bursts last? ${tries.join("; ")}. Best: balloon ${vals[k]} last, dp[${l}][${r}] = **${dp[l][r]}**.`, view(tones, vt, ptr));
      }
    }
    // Recover the order: a range's last balloon comes after both of its sides.
    const order: number[] = [];
    const walk = (l: number, r: number) => {
      if (r - l < 2) return;
      const k = lastOf[l][r];
      walk(l, k);
      walk(k, r);
      order.push(k);
    };
    walk(0, m - 1);
    rec.step(lineOf(code, "return dp[0][m - 1];"), `All balloons sit strictly between the two walls: **${dp[0][m - 1]}** coins — burst ${order.map((k) => vals[k]).join(", ")} (positions ${order.join(", ")}). O(n³) time, O(n²) space.`, { ...view({ [cell(0, m - 1)]: "success" }, { ...walls, [lastOf[0][m - 1]]: "success" }), done: true });
    return rec.frames;
  },
};

export default program;
