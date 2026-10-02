import { cell, gridTones, recorder, type CellTone, type Program } from "../types";

const code = `function setZeroes(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let firstColHasZero = false;
  for (let r = 0; r < rows; r++) {
    if (matrix[r][0] === 0) firstColHasZero = true;
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 1; c--) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0;
      }
    }
    if (firstColHasZero) matrix[r][0] = 0;
  }
  return matrix;
}`;

const program: Program = {
  title: "Set matrix zeroes",
  code,
  fields: [{ key: "matrix", label: "matrix", kind: "grid", maxLength: 4, min: 0, max: 9 }],
  examples: [
    { label: "One zero", input: { matrix: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] } },
    { label: "Zero in first row", input: { matrix: [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]] } },
  ],
  run(input) {
    const matrix = (input.matrix as number[][]).map((row) => [...row]);
    const original = matrix.map((row) => [...row]);
    const rows = matrix.length;
    const cols = matrix[0].length;
    const r = recorder();
    let firstColHasZero = false;

    const zeros = (): Record<string, CellTone> =>
      gridTones(original, (y, x) => (original[y][x] === 0 ? "primary" : null));
    const markers = (): Record<string, CellTone> =>
      gridTones(matrix, (y, x) => ((y === 0 || x === 0) && matrix[y][x] === 0 && original[y][x] !== 0 ? "tertiary" : null));

    r.step(
      4,
      `Zeroing a row as soon as we see a 0 would create **new** zeroes that trigger even more zeroing. So first **record** which rows and columns to clear, then **apply**. The trick: use row 0 and column 0 of the matrix itself as the notepad.`,
      { grids: [{ name: "matrix", values: matrix, tones: zeros() }], vars: { firstColHasZero } }
    );

    for (let y = 0; y < rows; y++) {
      if (matrix[y][0] === 0 && !firstColHasZero) {
        firstColHasZero = true;
        r.step(6, `Row ${y} starts with a 0, so **column 0** itself must be cleared at the end. Remember that in \`firstColHasZero\`.`, {
          grids: [{ name: "matrix", values: matrix, tones: { ...zeros(), ...markers(), [cell(y, 0)]: "write" } }],
          vars: { firstColHasZero },
        });
      }
      for (let x = 1; x < cols; x++) {
        if (matrix[y][x] === 0 && original[y][x] === 0) {
          matrix[y][0] = 0;
          matrix[0][x] = 0;
          r.step(
            10,
            `Found a 0 at \`[${y}][${x}]\`. Mark its row by writing 0 at \`[${y}][0]\`, and its column by writing 0 at \`[0][${x}]\`.`,
            {
              grids: [{ name: "matrix", values: matrix, tones: { ...zeros(), ...markers(), [cell(y, 0)]: "write", [cell(0, x)]: "write" } }],
              vars: { r: y, c: x, firstColHasZero },
            }
          );
        }
      }
    }

    r.step(
      14,
      `Recording is done. Now apply it, working from the **bottom-right** so the markers in row 0 and column 0 are read before they are overwritten.`,
      { grids: [{ name: "matrix", values: matrix, tones: { ...zeros(), ...markers() } }], vars: { firstColHasZero } }
    );

    const cleared = new Set<string>();
    for (let y = rows - 1; y >= 0; y--) {
      const before = cleared.size;
      for (let x = cols - 1; x >= 1; x--) {
        if (matrix[y][0] === 0 || matrix[0][x] === 0) {
          matrix[y][x] = 0;
          cleared.add(cell(y, x));
        }
      }
      if (firstColHasZero) {
        matrix[y][0] = 0;
        cleared.add(cell(y, 0));
      }
      const tones = gridTones(matrix, (yy, xx) =>
        cleared.has(cell(yy, xx)) ? (yy === y ? "write" : "done") : null
      );
      r.step(
        cleared.size > before ? 17 : 16,
        cleared.size > before
          ? `Row ${y}: every cell whose row marker \`[${y}][0]\` or column marker \`[0][c]\` is 0 becomes 0${firstColHasZero ? ", and so does column 0" : ""}.`
          : `Row ${y}: no marker applies, so the row is unchanged.`,
        { grids: [{ name: "matrix", values: matrix, tones }], vars: { r: y, firstColHasZero } }
      );
    }

    r.step(
      22,
      `Every affected row and column is zero, using only one extra boolean: **O(rows × cols) time, O(1) space**.`,
      {
        grids: [{ name: "matrix", values: matrix, tones: gridTones(matrix, (y, x) => (matrix[y][x] === 0 ? "success" : null)) }],
        vars: {},
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
