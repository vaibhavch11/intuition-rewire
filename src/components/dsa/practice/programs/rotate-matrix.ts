import { cell, gridTones, recorder, type Program } from "../types";

const code = `function rotate(matrix) {
  const n = matrix.length;
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
    }
  }
  for (const row of matrix) {
    row.reverse();
  }
  return matrix;
}`;

const program: Program = {
  title: "Rotate a matrix by 90°",
  code,
  fields: [{ key: "matrix", label: "matrix (square)", kind: "grid", maxLength: 4 }],
  examples: [
    { label: "3 × 3", input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] } },
    { label: "4 × 4", input: { matrix: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] } },
  ],
  check(input) {
    const matrix = input.matrix as number[][];
    return matrix.length !== matrix[0].length ? "Rotation in place needs a square matrix (same number of rows and columns)." : null;
  },
  run(input) {
    const matrix = (input.matrix as number[][]).map((row) => [...row]);
    const n = matrix.length;
    const r = recorder();

    r.step(
      2,
      `Rotating clockwise in one go means chasing values around in cycles of four. Instead, do two easy steps: **transpose** (mirror across the diagonal), then **reverse every row**.`,
      { grids: [{ name: "matrix", values: matrix, tones: gridTones(matrix, (y, x) => (y === x ? "tertiary" : null)) }], vars: { n } }
    );

    for (let row = 0; row < n; row++) {
      for (let col = row + 1; col < n; col++) {
        const a = matrix[row][col];
        const b = matrix[col][row];
        [matrix[row][col], matrix[col][row]] = [matrix[col][row], matrix[row][col]];
        r.step(
          5,
          `Swap \`[${row}][${col}]\` (${a}) with its mirror \`[${col}][${row}]\` (${b}). Only cells **above** the diagonal start a swap, so each pair swaps once.`,
          {
            grids: [
              {
                name: "matrix",
                values: matrix,
                tones: {
                  ...gridTones(matrix, (y, x) => (y === x ? "tertiary" : null)),
                  [cell(row, col)]: "write",
                  [cell(col, row)]: "write",
                },
              },
            ],
            vars: { r: row, c: col },
          }
        );
      }
    }

    r.step(8, `The matrix is transposed: row 0 is now what column 0 was. Next, reverse each row.`, {
      grids: [{ name: "matrix", values: matrix, tones: gridTones(matrix, () => "done") }],
      vars: {},
    });

    matrix.forEach((row, y) => {
      row.reverse();
      r.step(9, `Reverse row ${y}: it becomes **[${row.join(", ")}]**.`, {
        grids: [
          {
            name: "matrix",
            values: matrix,
            tones: gridTones(matrix, (yy) => (yy === y ? "write" : yy < y ? "success" : "done")),
          },
        ],
        vars: { row: y },
      });
    });

    r.step(
      11,
      `Rotated 90° clockwise, in place: **O(n²) time, O(1) space**. The first column of the original, read bottom-up, is now the first row.`,
      { grids: [{ name: "matrix", values: matrix, tones: gridTones(matrix, () => "success") }], vars: {}, done: true }
    );
    return r.frames;
  },
};

export default program;
