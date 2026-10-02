import { cell, gridTones, recorder, type Program, type Scalar } from "../types";

const code = `function generate(numRows) {
  const triangle = [];
  for (let r = 0; r < numRows; r++) {
    const row = new Array(r + 1).fill(1);
    for (let c = 1; c < r; c++) {
      row[c] = triangle[r - 1][c - 1] + triangle[r - 1][c];
    }
    triangle.push(row);
  }
  return triangle;
}`;

const program: Program = {
  title: "Pascal's triangle",
  code,
  fields: [{ key: "numRows", label: "numRows", kind: "number", min: 1, max: 7 }],
  examples: [
    { label: "5 rows", input: { numRows: 5 } },
    { label: "7 rows", input: { numRows: 7 } },
  ],
  run(input) {
    const numRows = input.numRows as number;
    const triangle: Scalar[][] = [];
    const r = recorder();

    r.step(2, `Each row starts and ends with 1, and every number inside is the **sum of the two numbers above it**.`, {
      grids: [{ name: "triangle", values: [] }],
      vars: { numRows },
    });

    for (let y = 0; y < numRows; y++) {
      const row: Scalar[] = new Array(y + 1).fill(1);
      triangle.push(row);
      r.step(
        4,
        y < 2
          ? `Row ${y} has ${y + 1} value${y === 0 ? "" : "s"}, all 1 — there is nothing inside to compute.`
          : `Row ${y} gets ${y + 1} slots, filled with 1. The ends are final; the ${y - 1} inside value${y - 1 === 1 ? "" : "s"} come from row ${y - 1}.`,
        {
          grids: [
            {
              name: "triangle",
              values: triangle,
              tones: gridTones(triangle, (yy, xx) => (yy === y ? (xx === 0 || xx === y ? "write" : "muted") : "done")),
            },
          ],
          vars: { r: y },
        }
      );
      for (let x = 1; x < y; x++) {
        const above = triangle[y - 1] as number[];
        row[x] = above[x - 1] + above[x];
        r.step(6, `\`row[${x}] = ${above[x - 1]} + ${above[x]} = ${row[x]}\` — the two numbers just above it.`, {
          grids: [
            {
              name: "triangle",
              values: triangle,
              tones: {
                ...gridTones(triangle, (yy, xx) => (yy < y ? "done" : xx > x && xx < y ? "muted" : null)),
                [cell(y - 1, x - 1)]: "tertiary",
                [cell(y - 1, x)]: "tertiary",
                [cell(y, x)]: "write",
              },
            },
          ],
          vars: { r: y, c: x },
        });
      }
    }

    r.step(
      10,
      `All ${numRows} rows are built. Each value takes one addition, so it's **O(numRows²)** — about as fast as writing the triangle down.`,
      { grids: [{ name: "triangle", values: triangle, tones: gridTones(triangle, () => "success") }], vars: {}, done: true }
    );
    return r.frames;
  },
};

export default program;
