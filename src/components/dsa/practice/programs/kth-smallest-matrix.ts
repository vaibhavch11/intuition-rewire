import { SimHeap, heapTree, lineOf } from "../heap";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function kthSmallest(matrix, k) {
  const n = matrix.length;
  const heap = new Heap((a, b) => a[0] - b[0]);      // [value, row, col]: the smallest front on top
  for (let r = 0; r < Math.min(n, k); r++) heap.push([matrix[r][0], r, 0]);   // each row's first value
  for (let i = 1; i < k; i++) {
    const [, r, c] = heap.pop();                     // the next smallest overall
    if (c + 1 < n) heap.push([matrix[r][c + 1], r, c + 1]);   // its row moves forward
  }
  return heap.peek()[0];
}`;

const L = {
  heap: lineOf(code, "const heap = new Heap("),
  fronts: lineOf(code, "for (let r = 0; r < Math.min(n, k); r++)"),
  pop: lineOf(code, "const [, r, c] = heap.pop();"),
  next: lineOf(code, "if (c + 1 < n) heap.push("),
  ret: lineOf(code, "return heap.peek()[0];"),
};

type Item = [number, number, number];

const program: Program = {
  title: "Kth smallest in a sorted matrix (merge the rows with a heap)",
  code,
  fields: [
    { key: "matrix", label: "matrix (n × n, rows and columns sorted)", kind: "grid", maxLength: 4, min: -99, max: 999 },
    { key: "k", label: "k", kind: "number", min: 1, max: 16 },
  ],
  examples: [
    { label: "The lesson's example", input: { matrix: [[1, 5, 9], [10, 11, 13], [12, 13, 15]], k: 8 } },
    { label: "Duplicates", input: { matrix: [[1, 2], [1, 3]], k: 2 } },
    { label: "4 × 4", input: { matrix: [[1, 3, 7, 10], [2, 6, 8, 14], [4, 9, 12, 16], [5, 11, 15, 20]], k: 7 } },
  ],
  check(input) {
    const m = input.matrix as number[][];
    const n = m.length;
    if (m.some((row) => row.length !== n)) return "The matrix must be square: n rows of n values.";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (c + 1 < n && m[r][c] > m[r][c + 1]) return `Row ${r} isn't sorted: ${m[r][c]} comes before ${m[r][c + 1]}.`;
        if (r + 1 < n && m[r][c] > m[r + 1][c]) return `Column ${c} isn't sorted: ${m[r][c]} is above ${m[r + 1][c]}.`;
      }
    }
    return (input.k as number) > n * n ? `k can be at most ${n * n}, the number of entries.` : null;
  },
  run(input) {
    const matrix = input.matrix as number[][];
    const k = input.k as number;
    const n = matrix.length;
    const heap = new SimHeap((a: Item, b: Item) => a[0] - b[0]);
    const popped = new Set<string>();
    const order: number[] = [];
    const r = recorder();

    const views = (tones: Record<number, CellTone> = {}, extra: Record<string, CellTone> = {}) => {
      const gridTones: Record<string, CellTone> = {};
      for (const key of popped) gridTones[key] = "done";
      for (const [, row, col] of heap.items) gridTones[cell(row, col)] = "primary";
      Object.assign(gridTones, extra);
      return {
        trees: [heapTree("min-heap of row fronts: value in the node, row,col under it", heap.items.map(([v]) => v), {
          tones,
          captions: Object.fromEntries(heap.items.map(([, row, col], j) => [j, `${row},${col}`])),
        })],
        grids: [{ name: "matrix (blue: in the heap, green: popped)", values: matrix, tones: gridTones }],
        arrays: order.length ? [{ name: "popped so far, in order", values: order, tones: { [order.length - 1]: "write" as CellTone } }] : [],
      };
    };

    r.step(L.heap, `Each row is a sorted list, so merge the rows: a **min-heap** will hold the current front of each row, as [value, row, col].`, {
      ...views(),
      vars: { n, k, size: 0 },
    });
    for (let row = 0; row < Math.min(n, k); row++) {
      const at = heap.push([matrix[row][0], row, 0]);
      r.step(L.fronts, `Push row ${row}'s first value, **${matrix[row][0]}**.${n > k && row === k - 1 ? ` Rows past ${k - 1} can't hold the ${k}th smallest — their first value already has ${k} smaller-or-equal values above it.` : ""}`, {
        ...views({ [at]: "write" }),
        vars: { n, k, size: heap.size() },
      });
    }

    for (let i = 1; i < k; i++) {
      const [v, row, col] = heap.pop()!;
      popped.add(cell(row, col));
      order.push(v);
      r.step(L.pop, `Pop **${v}** (row ${row}, col ${col}): the **${i}${i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th"} smallest** value.`, {
        ...views(heap.size() ? { 0: "tertiary" } : {}, { [cell(row, col)]: "write" }),
        vars: { i, k, size: heap.size() },
      });
      if (col + 1 < n) {
        const at = heap.push([matrix[row][col + 1], row, col + 1]);
        r.step(L.next, `Row ${row} moves forward: push its next value, **${matrix[row][col + 1]}**${at === 0 ? " — the smallest front now" : ""}.`, {
          ...views({ [at]: "write" }),
          vars: { i, k, size: heap.size() },
        });
      } else {
        r.step(L.next, `Row ${row} is used up: nothing to push.`, { ...views(), vars: { i, k, size: heap.size() } });
      }
    }

    const [answer, row, col] = heap.peek()!;
    r.step(L.ret, `${k - 1} smaller values have been popped, so the top of the heap, **${answer}** (row ${row}, col ${col}), is the **${k}th smallest**.`, {
      ...views({ 0: "success" }, { [cell(row, col)]: "success" }),
      vars: { k, returned: answer },
      done: true,
    });
    return r.frames;
  },
};

export default program;
