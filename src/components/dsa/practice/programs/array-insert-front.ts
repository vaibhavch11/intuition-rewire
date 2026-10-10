import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function insertAtFront(arr, x) {
  for (let i = arr.length; i > 0; i--) {
    arr[i] = arr[i - 1];   // shift one place right
  }
  arr[0] = x;
}`;

const program: Program = {
  title: "Insert at the front of an array",
  code,
  fields: [
    { key: "arr", label: "array", kind: "array", maxLength: 7 },
    { key: "x", label: "new value", kind: "number" },
  ],
  examples: [
    { label: "Example", input: { arr: [10, 20, 30, 40], x: 5 } },
    { label: "Longer", input: { arr: [1, 2, 3, 4, 5, 6, 7], x: 0 } },
  ],
  run(input) {
    const arr: (number | null)[] = [...(input.arr as number[]), null];
    const x = input.x as number;
    const n = arr.length - 1;
    const r = recorder();
    let moves = 0;

    r.step(1, `To put **${x}** at index 0, every element must first move one place right to make room. There's an empty slot at the end.`, {
      arrays: [{ name: "arr", values: arr, tones: { [n]: "empty" } }],
      vars: { moves },
    });

    for (let i = n; i > 0; i--) {
      arr[i] = arr[i - 1];
      moves++;
      r.step(3, `Copy \`arr[${i - 1}] = ${arr[i]}\` into index ${i}. That's move **${moves}** of ${n}.`, {
        arrays: [{ name: "arr", values: arr, tones: { ...toneRange(i + 1, n, "done"), [i]: "write", [i - 1]: "primary" }, pointers: pointersAt(n + 1, { i }) }],
        vars: { i, moves },
      });
    }

    arr[0] = x;
    r.step(5, `Finally write **${x}** into index 0. Inserting one value cost **${moves} moves** — one per existing element: **O(n)**. A linked list does this in 2 pointer changes.`, {
      arrays: [{ name: "arr", values: arr, tones: { ...toneRange(1, n, "done"), 0: "success" } }],
      vars: { moves },
      done: true,
    });
    return r.frames;
  },
};

export default program;
