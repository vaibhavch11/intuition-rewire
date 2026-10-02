import { cell, gridTones, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function spiralOrder(matrix) {
  const result = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) result.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) result.push(matrix[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) result.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) result.push(matrix[r][left]);
      left++;
    }
  }
  return result;
}`;

const program: Program = {
  title: "Spiral order traversal",
  code,
  fields: [{ key: "matrix", label: "matrix", kind: "grid", maxLength: 4 }],
  examples: [
    { label: "3 × 3", input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] } },
    { label: "3 × 4", input: { matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] } },
    { label: "Single row", input: { matrix: [[1, 2, 3]] } },
  ],
  run(input) {
    const matrix = input.matrix as number[][];
    const r = recorder();
    const result: number[] = [];
    const visited = new Set<string>();
    let top = 0;
    let bottom = matrix.length - 1;
    let left = 0;
    let right = matrix[0].length - 1;

    const frame = (line: number, note: string, current?: [number, number]) => {
      const tones: Record<string, CellTone> = gridTones(matrix, (y, x) => {
        if (visited.has(cell(y, x))) return "done";
        return y < top || y > bottom || x < left || x > right ? "muted" : null;
      });
      if (current) tones[cell(current[0], current[1])] = "primary";
      r.step(line, note, {
        grids: [{ name: "matrix", values: matrix, tones }],
        arrays: [
          {
            name: "result",
            values: result,
            tones: { ...toneRange(0, result.length - 1, "done"), ...(current ? { [result.length - 1]: "write" as const } : {}) },
          },
        ],
        vars: { top, bottom, left, right },
      });
    };
    const take = (line: number, y: number, x: number, edge: string) => {
      result.push(matrix[y][x]);
      visited.add(cell(y, x));
      frame(line, `${edge}: add \`matrix[${y}][${x}] = ${matrix[y][x]}\`.`, [y, x]);
    };

    frame(4, `Four boundaries mark the part of the matrix not yet visited. Walk its outer ring clockwise, then **shrink** the boundaries and repeat.`);

    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) take(6, top, c, "Top row, left → right");
      top++;
      frame(7, `The top row is done, so move \`top\` down to ${top}.`);
      for (let y = top; y <= bottom; y++) take(8, y, right, "Right column, top → bottom");
      right--;
      frame(9, `The right column is done, so move \`right\` left to ${right}.`);
      if (top <= bottom) {
        for (let c = right; c >= left; c--) take(11, bottom, c, "Bottom row, right → left");
        bottom--;
        frame(12, `The bottom row is done, so move \`bottom\` up to ${bottom}.`);
      } else {
        frame(10, `\`top > bottom\` — no row is left, so skip the bottom row. Without this check we'd visit a row twice.`);
      }
      if (left <= right) {
        for (let y = bottom; y >= top; y--) take(15, y, left, "Left column, bottom → top");
        left++;
        frame(16, `The left column is done, so move \`left\` right to ${left}.`);
      } else {
        frame(14, `\`left > right\` — no column is left, so skip the left column.`);
      }
    }

    r.step(
      19,
      `The boundaries crossed, so every cell has been visited exactly once: **O(rows × cols)** time, no extra space besides the result.`,
      {
        grids: [{ name: "matrix", values: matrix, tones: gridTones(matrix, () => "done") }],
        arrays: [{ name: "result", values: result, tones: toneRange(0, result.length - 1, "success") }],
        vars: { result },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
