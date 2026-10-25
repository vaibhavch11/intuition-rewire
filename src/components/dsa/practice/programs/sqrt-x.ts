import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function mySqrt(x) {
  let low = 0;
  let high = x;
  let answer = 0;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (mid * mid <= x) {
      answer = mid;                          // mid fits: remember it, then look for a bigger one
      low = mid + 1;
    } else {
      high = mid - 1;                        // mid is too big
    }
  }
  return answer;
}`;

/** The candidates low..high, with long runs folded into "…" so big ranges still fit. */
function candidates(low: number, high: number, mid?: number) {
  const shown = new Set<number>();
  if (high - low <= 10) for (let v = low; v <= high; v++) shown.add(v);
  else for (const v of [low, low + 1, mid === undefined ? low : mid - 1, mid ?? low, mid === undefined ? low : mid + 1, high - 1, high]) if (v >= low && v <= high) shown.add(v);
  const values: Scalar[] = [];
  const tones: Record<number, CellTone> = {};
  let last: number | null = null;
  for (const v of [...shown].sort((a, b) => a - b)) {
    if (last !== null && v > last + 1) values.push("…");
    if (v === mid) tones[values.length] = "primary";
    values.push(v);
    last = v;
  }
  return { name: "candidates low..high", values, tones };
}

const program: Program = {
  title: "Sqrt(x) by binary search",
  code,
  fields: [{ key: "x", label: "x", kind: "number", min: 0, max: 99999 }],
  examples: [
    { label: "Example", input: { x: 8 } },
    { label: "Perfect square", input: { x: 49 } },
    { label: "Bigger", input: { x: 2024 } },
  ],
  run(input) {
    const x = input.x as number;
    const r = recorder();
    let low = 0;
    let high = x;
    let answer = 0;

    r.step(lineOf(code, "let answer = 0;"), `The answer is a whole number in **0..${x}**. Asking "does m * m <= ${x}?" gives yes for small m and no once m passes the root — so binary search for the **last yes**, remembering each yes in \`answer\`.`, {
      arrays: [candidates(low, high)],
      vars: { x, low, high, answer },
    });
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      const square = mid * mid;
      r.step(lineOf(code, "const mid = low + "), `Try the middle candidate, **mid = ${mid}**: ${mid} × ${mid} = ${square}.`, {
        arrays: [candidates(low, high, mid)],
        vars: { x, low, mid, high, "mid * mid": square, answer },
      });
      if (square <= x) {
        answer = mid;
        low = mid + 1;
        r.step(lineOf(code, "answer = mid;"), `${square} <= ${x}: ${mid} fits. Remember it (\`answer = ${mid}\`) and look for a bigger one: \`low = ${low}\`.`, {
          arrays: [candidates(low, high)],
          vars: { x, low, high, answer },
        });
      } else {
        high = mid - 1;
        r.step(lineOf(code, "high = mid - 1;"), `${square} > ${x}: ${mid} is too big, and so is everything above it. \`high = ${high}\`.`, {
          arrays: [candidates(low, high)],
          vars: { x, low, high, answer },
        });
      }
    }
    r.step(lineOf(code, "return answer;"), `No candidates left. The last one that fit is **${answer}**: ${answer}² = ${answer * answer} <= ${x} < ${(answer + 1) * (answer + 1)} = ${answer + 1}². About log₂ x steps — **O(log x)**.`, {
      arrays: [{ name: "answer", values: [answer], tones: { 0: "success" } }],
      vars: { x, answer },
      done: true,
    });
    return r.frames;
  },
};

export default program;
