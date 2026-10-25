import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function maxDistance(position, m) {
  const pos = [...position].sort((a, b) => a - b);
  const fits = (gap) => {                        // can m balls be placed at least gap apart?
    let count = 1, last = pos[0];
    for (const p of pos) {
      if (p - last >= gap) { count++; last = p; }   // greedy: the first basket far enough away
    }
    return count >= m;
  };
  let low = 1;
  let high = pos[pos.length - 1] - pos[0];       // the widest any gap could be
  while (low < high) {
    const mid = low + Math.ceil((high - low) / 2);   // round up: low = mid must make progress
    if (fits(mid)) low = mid;                    // possible: try a bigger gap
    else high = mid - 1;                         // impossible: the answer is smaller
  }
  return low;
}`;

/** Baskets that get a ball when placing greedily at least `gap` apart. */
function place(pos: number[], gap: number) {
  const chosen = [0];
  let last = pos[0];
  pos.forEach((p, i) => {
    if (p - last >= gap) {
      chosen.push(i);
      last = p;
    }
  });
  return chosen;
}

const program: Program = {
  title: "Magnetic force between two balls (largest minimum gap)",
  code,
  fields: [
    { key: "position", label: "position (distinct)", kind: "array", maxLength: 10, min: 1, max: 999 },
    { key: "m", label: "m (balls)", kind: "number", min: 2, max: 10 },
  ],
  examples: [
    { label: "Example", input: { position: [1, 2, 3, 4, 7], m: 3 } },
    { label: "Two balls", input: { position: [5, 4, 3, 2, 1, 100], m: 2 } },
    { label: "Spread out", input: { position: [1, 3, 8, 12, 15, 20, 28], m: 4 } },
  ],
  check(input) {
    const p = input.position as number[];
    if (new Set(p).size !== p.length) return "Basket positions must be different.";
    return (input.m as number) <= p.length ? null : "There must be at least as many baskets as balls.";
  },
  run(input) {
    const pos = [...(input.position as number[])].sort((a, b) => a - b);
    const m = input.m as number;
    const r = recorder();
    let low = 1;
    let high = pos[pos.length - 1] - pos[0];
    const view = (gap: number) => {
      const chosen = new Set(place(pos, gap));
      const tones: Record<number, CellTone> = {};
      pos.forEach((_, i) => {
        tones[i] = chosen.has(i) ? (chosen.size >= m ? "success" : "tertiary") : "idle";
      });
      return [{ name: `positions (balls at gap ${gap})`, values: pos, tones }];
    };

    r.step(lineOf(code, "let high = pos[pos.length - 1] - pos[0];"), `Sorted: [${pos.join(", ")}]. The smallest gap between ${m} balls can be anything from **1** to **${high}**. Smaller gaps are always easier, so the answers go yes, …, yes, no, …: find the **last yes**.`, {
      arrays: [{ name: "positions", values: pos }],
      vars: { m, low, high },
    });
    while (low < high) {
      const mid = low + Math.ceil((high - low) / 2);
      const placed = place(pos, mid).length;
      const ok = placed >= m;
      r.step(lineOf(code, "const mid = low + "), `Try **gap ${mid}** (mid rounds up). Greedy: first ball at ${pos[0]}, each next one in the first basket at least ${mid} further. **${placed}** ball${placed === 1 ? "" : "s"} fit.`, {
        arrays: view(mid),
        vars: { m, low, mid, high, placed },
      });
      if (ok) {
        low = mid;
        r.step(lineOf(code, "if (fits(mid)) low = mid;"), `${placed} >= ${m}: a gap of ${mid} is possible. Keep it and try bigger — \`low = ${low}\`.`, { arrays: [{ name: "positions", values: pos }], vars: { m, low, high } });
      } else {
        high = mid - 1;
        r.step(lineOf(code, "else high = mid - 1;"), `${placed} < ${m}: a gap of ${mid} is too wide, and so is anything wider — \`high = ${high}\`.`, { arrays: [{ name: "positions", values: pos }], vars: { m, low, high } });
      }
    }
    r.step(lineOf(code, "return low;"), `One gap left: the largest possible minimum distance is **${low}**. **O(n log n + n log(range))**.`, {
      arrays: view(low),
      vars: { m, answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
