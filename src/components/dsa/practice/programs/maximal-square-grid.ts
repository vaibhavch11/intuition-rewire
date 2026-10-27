import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function maximalSquare(matrix) {
  const m = matrix.length, n = matrix[0].length;
  const side = Array.from({ length: m }, () => new Array(n).fill(0));
  let best = 0;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] !== "1") continue;            // a 0 ends every square
      if (r === 0 || c === 0) side[r][c] = 1;        // on the edge: a 1x1 square at most
      else side[r][c] = 1 + Math.min(side[r - 1][c], side[r][c - 1], side[r - 1][c - 1]);
      best = Math.max(best, side[r][c]);
    }
  }
  return best * best;
}`;

const program: Program = {
  title: "Maximal square",
  code,
  fields: [{ key: "matrix", label: "matrix (0s and 1s)", kind: "grid", maxLength: 6, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { matrix: [[1, 0, 1, 0, 0], [1, 0, 1, 1, 1], [1, 1, 1, 1, 1], [1, 0, 0, 1, 0]] } },
    { label: "A 3 × 3 square", input: { matrix: [[0, 1, 1, 1], [1, 1, 1, 1], [0, 1, 1, 1]] } },
    { label: "Diagonal", input: { matrix: [[0, 1], [1, 0]] } },
  ],
  run(input) {
    const matrix = (input.matrix as number[][]).map((row) => row.map(String));
    const m = matrix.length;
    const n = matrix[0].length;
    const r0 = recorder();
    const side: Scalar[][] = matrix.map((row) => row.map(() => 0));
    let best = 0;
    let bestAt: [number, number] | null = null;
    const view = (tones: Record<string, CellTone> = {}, mt: Record<string, CellTone> = {}) => ({
      grids: [
        { name: "matrix", values: matrix, tones: mt },
        { name: "side (largest square ending here)", values: side.map((row) => [...row]), tones },
      ],
      vars: { best, area: best * best },
    });

    r0.step(lineOf(code, "const side = "), `side[r][c] = the side of the largest all-1 square whose **bottom-right corner** is (r, c). A 1 extends the smallest of the squares to its left, above and above-left.`, view());
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c] !== "1") continue;
        let note: string;
        const tones: Record<string, CellTone> = { [cell(r, c)]: "write" };
        if (r === 0 || c === 0) {
          side[r][c] = 1;
          note = `(${r}, ${c}) is a 1 on the edge: at most a 1 × 1 square ends here. side = **1**.`;
        } else {
          const up = side[r - 1][c] as number;
          const left = side[r][c - 1] as number;
          const diag = side[r - 1][c - 1] as number;
          side[r][c] = 1 + Math.min(up, left, diag);
          tones[cell(r - 1, c)] = "primary";
          tones[cell(r, c - 1)] = "primary";
          tones[cell(r - 1, c - 1)] = "primary";
          note = `(${r}, ${c}) is a 1. Above ${up}, left ${left}, above-left ${diag}: 1 + ${Math.min(up, left, diag)} = **${side[r][c]}**.`;
        }
        if ((side[r][c] as number) > best) {
          best = side[r][c] as number;
          bestAt = [r, c];
        }
        r0.step(lineOf(code, r === 0 || c === 0 ? "if (r === 0 || c === 0) side[r][c] = 1;" : "else side[r][c] = 1 + Math.min("), note, view(tones, { [cell(r, c)]: "primary" }));
      }
    }
    const sq: Record<string, CellTone> = {};
    if (bestAt) for (let i = 0; i < best; i++) for (let j = 0; j < best; j++) sq[cell(bestAt[0] - i, bestAt[1] - j)] = "success";
    r0.step(lineOf(code, "return best * best;"), best ? `The largest side is ${best}, so the largest square has area **${best * best}** (green). O(m · n).` : `No 1s at all: area **0**.`, { ...view(bestAt ? { [cell(bestAt[0], bestAt[1])]: "success" } : {}, sq), done: true });
    return r0.frames;
  },
};

export default program;
