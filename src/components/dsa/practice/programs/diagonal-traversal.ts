import { cell, gridTones, recorder, type Program, type Scalar } from "../types";

const code = `function diagonalGroups(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const diagonals = Array.from({ length: rows + cols - 1 }, () => []);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      diagonals[r + c].push(matrix[r][c]);
    }
  }
  return diagonals;
}`;

const program: Program = {
  title: "Diagonal traversal",
  code,
  fields: [{ key: "matrix", label: "matrix", kind: "grid", maxLength: 4 }],
  examples: [
    { label: "3 × 3", input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] } },
    { label: "2 × 4", input: { matrix: [[1, 2, 3, 4], [5, 6, 7, 8]] } },
  ],
  run(input) {
    const matrix = input.matrix as number[][];
    const rows = matrix.length;
    const cols = matrix[0].length;
    const diagonals: Scalar[][] = Array.from({ length: rows + cols - 1 }, () => []);
    const r = recorder();

    r.step(
      4,
      `Every cell on the same diagonal has the same **r + c**. A ${rows} × ${cols} matrix has ${rows + cols - 1} diagonals, so make one bucket per value of r + c.`,
      { grids: [{ name: "matrix", values: matrix }, { name: "diagonals", values: diagonals }], vars: { rows, cols } }
    );

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = y + x;
        diagonals[d].push(matrix[y][x]);
        r.step(7, `\`[${y}][${x}]\` has r + c = **${d}**, so ${matrix[y][x]} goes into bucket ${d}.`, {
          grids: [
            {
              name: "matrix",
              values: matrix,
              tones: { ...gridTones(matrix, (yy, xx) => (yy + xx === d ? "tertiary" : null)), [cell(y, x)]: "primary" },
            },
            {
              name: "diagonals",
              values: diagonals,
              tones: { ...gridTones(diagonals, (yy) => (yy === d ? "done" : null)), [cell(d, diagonals[d].length - 1)]: "write" },
            },
          ],
          vars: { r: y, c: x, "r + c": d },
        });
      }
    }

    r.step(
      10,
      `One ordinary row-by-row sweep filled every bucket: **O(rows × cols)** time. Each bucket lists its diagonal from top-right to bottom-left.`,
      {
        grids: [
          { name: "matrix", values: matrix },
          { name: "diagonals", values: diagonals, tones: gridTones(diagonals, () => "success") },
        ],
        vars: {},
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
