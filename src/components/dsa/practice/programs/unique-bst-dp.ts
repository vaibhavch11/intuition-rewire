import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function numTrees(n) {
  const G = new Array(n + 1).fill(0);
  G[0] = 1;
  G[1] = 1;
  for (let k = 2; k <= n; k++) {           // k values
    for (let r = 1; r <= k; r++) G[k] += G[r - 1] * G[k - r];
  }
  return G[n];
}`;

const program: Program = {
  title: "Count BSTs on n values (Catalan table)",
  code,
  fields: [{ key: "n", label: "n (1 to 12)", kind: "number" }],
  examples: [
    { label: "n = 3", input: { n: 3 } },
    { label: "n = 5", input: { n: 5 } },
    { label: "n = 8", input: { n: 8 } },
  ],
  check(input) {
    const n = input.n as number;
    return Number.isInteger(n) && n >= 1 && n <= 12 ? null : "Pick n from 1 to 12.";
  },
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const G = new Array<number>(n + 1).fill(0);
    G[0] = 1;
    G[1] = 1;
    const view = (k: number | null, extra: Record<number, CellTone> = {}, vars: Record<string, unknown> = {}) => ({
      arrays: [{
        name: "G[k] = BSTs on k values",
        values: G.map((v, i) => (k !== null && i > k ? null : v)),
        tones: { ...Object.fromEntries(G.map((_, i) => [i, k === null || i < k ? "done" : "idle"])), ...extra } as Record<number, CellTone>,
        pointers: {},
      }],
      vars,
    });

    r.step(lineOf(code, "G[1] = 1;"), "G[0] = 1 (the empty tree is one shape) and G[1] = 1. A tree on k values: pick the root, then any left shape pairs with any right shape.", view(1, { 1: "done" }));
    for (let k = 2; k <= n; k++) {
      const parts: string[] = [];
      for (let rt = 1; rt <= k; rt++) {
        G[k] += G[rt - 1] * G[k - rt];
        parts.push(`${G[rt - 1]}·${G[k - rt]}`);
        if (k <= 4) {
          r.step(lineOf(code, "for (let r = 1; r <= k; r++) G[k] += G[r - 1] * G[k - r];"), `k = ${k}, root = ${rt}: ${rt - 1} value${rt - 1 === 1 ? "" : "s"} on the left (G[${rt - 1}] = ${G[rt - 1]}) and ${k - rt} on the right (G[${k - rt}] = ${G[k - rt]}). Add ${G[rt - 1] * G[k - rt]}: G[${k}] = ${G[k]}.`, view(k, { [k]: "write", [rt - 1]: "primary", [k - rt]: "tertiary" }, { k, r: rt }));
        }
      }
      if (k > 4) r.step(lineOf(code, "for (let k = 2; k <= n; k++) {"), `k = ${k}: G[${k}] = ${parts.join(" + ")} = ${G[k]}.`, view(k, { [k]: "write" }, { k }));
    }
    r.step(lineOf(code, "return G[n];"), `There are **${G[n]}** different BSTs on ${n} value${n === 1 ? "" : "s"} — the ${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} Catalan number. O(n²) time, O(n) space.`, { ...view(null, { [n]: "success" }), done: true });
    return r.frames;
  },
};

export default program;
