import { lineOf } from "../graphs";
import { cell, gridTones, recorder, type CellTone, type Program } from "../types";

const code = `function searchMatrix(matrix, target) {
  let r = 0;
  let c = matrix[0].length - 1;                // start at the top-right corner
  while (r < matrix.length && c >= 0) {
    const value = matrix[r][c];
    if (value === target) return true;
    if (value > target) c--;                   // everything below it is bigger still: drop the column
    else r++;                                  // everything left of it is smaller still: drop the row
  }
  return false;
}`;

const program: Program = {
  title: "Search a 2D matrix II (staircase from the top-right corner)",
  code,
  fields: [
    { key: "matrix", label: "matrix (rows and columns sorted)", kind: "grid", maxLength: 5 },
    { key: "target", label: "target", kind: "number", min: -99, max: 999 },
  ],
  examples: [
    { label: "Found", input: { matrix: [[1, 4, 7, 11, 15], [2, 5, 8, 12, 19], [3, 6, 9, 16, 22], [10, 13, 14, 17, 24], [18, 21, 23, 26, 30]], target: 5 } },
    { label: "Not there", input: { matrix: [[1, 4, 7, 11, 15], [2, 5, 8, 12, 19], [3, 6, 9, 16, 22], [10, 13, 14, 17, 24], [18, 21, 23, 26, 30]], target: 20 } },
    { label: "Bottom-left", input: { matrix: [[1, 4, 7, 11, 15], [2, 5, 8, 12, 19], [3, 6, 9, 16, 22], [10, 13, 14, 17, 24], [18, 21, 23, 26, 30]], target: 18 } },
  ],
  check(input) {
    const m = input.matrix as number[][];
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (c > 0 && m[r][c] < m[r][c - 1]) return "Each row must be sorted from left to right.";
        if (r > 0 && m[r][c] < m[r - 1][c]) return "Each column must be sorted from top to bottom.";
      }
    }
    return null;
  },
  run(input) {
    const matrix = input.matrix as number[][];
    const target = input.target as number;
    const rows = matrix.length;
    const r0 = recorder();
    let r = 0;
    let c = matrix[0].length - 1;
    // Rows above r and columns right of c are ruled out.
    const view = (extra: Record<string, CellTone> = {}) => ({
      grids: [{ name: "matrix", values: matrix, tones: { ...gridTones(matrix, (y, x) => (y < r || x > c ? "muted" : null)), ...extra } }],
    });

    r0.step(lineOf(code, "let c = matrix[0].length - 1;"), `Start at the **top-right corner**, (0, ${c}). Everything to its left is smaller and everything below it is bigger, so one comparison always rules out a whole row or column.`, {
      ...view({ [cell(r, c)]: "primary" }),
      vars: { target, r, c },
    });
    while (r < rows && c >= 0) {
      const value = matrix[r][c];
      if (value === target) {
        r0.step(lineOf(code, "if (value === target) return true;"), `matrix[${r}][${c}] = ${value}: found it. Return **true**. At most rows + columns steps — **O(m + n)**.`, {
          ...view({ [cell(r, c)]: "success" }),
          vars: { target, r, c, value },
          done: true,
        });
        return r0.frames;
      }
      if (value > target) {
        const col = c;
        c--;
        r0.step(lineOf(code, "if (value > target) c--;"), `${value} > ${target}, and every value below it in column ${col} is bigger still. **Drop column ${col}**: move left.`, {
          ...view(c >= 0 ? { [cell(r, c)]: "primary" } : {}),
          vars: { target, r, c, value },
        });
      } else {
        const row = r;
        r++;
        r0.step(lineOf(code, "else r++;"), `${value} < ${target}, and every value left of it in row ${row} is smaller still. **Drop row ${row}**: move down.`, {
          ...view(r < rows ? { [cell(r, c)]: "primary" } : {}),
          vars: { target, r, c, value },
        });
      }
    }
    r0.step(lineOf(code, "return false;"), `The walk left the matrix: every row and column has been ruled out, so ${target} isn't there. Return **false**.`, {
      grids: [{ name: "matrix", values: matrix, tones: gridTones(matrix, () => "muted") }],
      vars: { target },
      done: true,
    });
    return r0.frames;
  },
};

export default program;
