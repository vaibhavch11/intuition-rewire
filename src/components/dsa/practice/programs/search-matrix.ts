import { cell, gridTones, recorder, type Program } from "../types";

const code = `function searchMatrix(matrix, target) {
  const rows = matrix.length, cols = matrix[0].length;
  let low = 0, high = rows * cols - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const r = Math.floor(mid / cols), c = mid % cols;
    if (matrix[r][c] === target) return true;
    if (matrix[r][c] < target) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}`;

const program: Program = {
  title: "Search a sorted 2D matrix",
  code,
  fields: [
    { key: "matrix", label: "matrix (sorted row by row)", kind: "grid", maxLength: 4 },
    { key: "target", label: "target", kind: "number", min: -99, max: 999 },
  ],
  examples: [
    { label: "Found", input: { matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 3 } },
    { label: "Not found", input: { matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 13 } },
  ],
  check(input) {
    const flat = (input.matrix as number[][]).flat();
    for (let i = 1; i < flat.length; i++) {
      if (flat[i] < flat[i - 1]) return "Read row by row, the matrix must be sorted (each row sorted, and each row starting after the previous one ends).";
    }
    return null;
  },
  run(input) {
    const matrix = input.matrix as number[][];
    const target = input.target as number;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const r = recorder();
    let low = 0;
    let high = rows * cols - 1;
    const index = (y: number, x: number) => y * cols + x;

    r.step(
      3,
      `Read row by row, this matrix is one sorted list of ${rows * cols} values. So binary-search **positions 0 to ${high}** and convert a position to (row, col) only when we need a value.`,
      { grids: [{ name: "matrix", values: matrix }], vars: { target, low, high } }
    );

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const y = Math.floor(mid / cols);
      const x = mid % cols;
      const value = matrix[y][x];
      const tones = {
        ...gridTones(matrix, (yy, xx) => (index(yy, xx) < low || index(yy, xx) > high ? "muted" : null)),
        [cell(y, x)]: value === target ? ("success" as const) : ("primary" as const),
      };
      if (value === target) {
        r.step(7, `Position ${mid} is row ${mid} ÷ ${cols} = **${y}**, column ${mid} % ${cols} = **${x}**. It holds ${value} — **found** ${target}.`, {
          grids: [{ name: "matrix", values: matrix, tones }],
          vars: { target, low, mid, high, "(r, c)": `(${y}, ${x})` },
          done: true,
        });
        return r.frames;
      }
      if (value < target) {
        r.step(8, `Position ${mid} → (${y}, ${x}) holds ${value}, which is **smaller** than ${target}. Everything up to it is too small: \`low = ${mid + 1}\`.`, {
          grids: [{ name: "matrix", values: matrix, tones }],
          vars: { target, low, mid, high, "(r, c)": `(${y}, ${x})` },
        });
        low = mid + 1;
      } else {
        r.step(9, `Position ${mid} → (${y}, ${x}) holds ${value}, which is **bigger** than ${target}. Everything from it on is too big: \`high = ${mid - 1}\`.`, {
          grids: [{ name: "matrix", values: matrix, tones }],
          vars: { target, low, mid, high, "(r, c)": `(${y}, ${x})` },
        });
        high = mid - 1;
      }
    }

    r.step(
      11,
      `\`low > high\`: the search space is empty, so ${target} is **not** in the matrix. Halving each step makes this **O(log(rows × cols))**.`,
      { grids: [{ name: "matrix", values: matrix, tones: gridTones(matrix, () => "muted") }], vars: { target, low, high }, done: true }
    );
    return r.frames;
  },
};

export default program;
