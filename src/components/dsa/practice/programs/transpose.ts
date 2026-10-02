import { cell, gridTones, recorder, type Program, type Scalar } from "../types";

const code = `function transpose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][r] = matrix[r][c];
    }
  }
  return result;
}`;

const program: Program = {
  title: "Transpose a matrix",
  code,
  fields: [{ key: "matrix", label: "matrix", kind: "grid", maxLength: 4 }],
  examples: [
    { label: "2 × 3", input: { matrix: [[1, 2, 3], [4, 5, 6]] } },
    { label: "3 × 3", input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] } },
  ],
  run(input) {
    const matrix = input.matrix as number[][];
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: Scalar[][] = Array.from({ length: cols }, () => new Array(rows).fill(null));
    const r = recorder();

    r.step(
      4,
      `A ${rows} × ${cols} matrix becomes a **${cols} × ${rows}** matrix: rows turn into columns. Make an empty result of that shape.`,
      {
        grids: [
          { name: "matrix", values: matrix },
          { name: "result", values: result },
        ],
        vars: { rows, cols },
      }
    );

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result[col][row] = matrix[row][col];
        r.step(
          7,
          `\`matrix[${row}][${col}] = ${matrix[row][col]}\` goes to \`result[${col}][${row}]\` — the row and column indexes simply **swap**.`,
          {
            grids: [
              {
                name: "matrix",
                values: matrix,
                tones: { ...gridTones(matrix, (y, x) => (y < row || (y === row && x < col) ? "done" : null)), [cell(row, col)]: "primary" },
              },
              {
                name: "result",
                values: result,
                tones: { ...gridTones(result, (y, x) => (result[y][x] !== null ? "done" : null)), [cell(col, row)]: "write" },
              },
            ],
            vars: { r: row, c: col },
          }
        );
      }
    }

    r.step(
      10,
      `Every cell was copied once: **O(rows × cols)** time and space. Row 0 of the input is now column 0 of the result.`,
      {
        grids: [
          { name: "matrix", values: matrix },
          { name: "result", values: result, tones: gridTones(result, () => "success") },
        ],
        vars: { result },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
