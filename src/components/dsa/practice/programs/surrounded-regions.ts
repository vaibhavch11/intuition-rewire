import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function solve(board) {
  const rows = board.length, cols = board[0].length;
  const markSafe = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== "O") return;
    board[r][c] = "S";                    // reachable from the border: safe
    markSafe(r - 1, c);
    markSafe(r + 1, c);
    markSafe(r, c - 1);
    markSafe(r, c + 1);
  };
  for (let r = 0; r < rows; r++) {        // left and right columns
    markSafe(r, 0);
    markSafe(r, cols - 1);
  }
  for (let c = 0; c < cols; c++) {        // top and bottom rows
    markSafe(0, c);
    markSafe(rows - 1, c);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === "O") board[r][c] = "X";        // never reached: surrounded
      else if (board[r][c] === "S") board[r][c] = "O";   // safe: put it back
    }
  }
}`;

const program: Program = {
  title: "Surrounded regions (start from the border)",
  code,
  fields: [{ key: "board", label: "board (1 = O, 0 = X)", kind: "grid", maxLength: 6, min: 0, max: 1 }],
  examples: [
    { label: "Example", input: { board: [[0, 0, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 1, 0, 0]] } },
    { label: "Escape route", input: { board: [[0, 0, 0, 0, 0], [0, 1, 1, 0, 0], [0, 0, 1, 1, 1], [0, 1, 0, 0, 0], [0, 0, 0, 0, 0]] } },
    { label: "Two pockets", input: { board: [[0, 0, 0, 0, 0], [0, 1, 0, 1, 0], [0, 0, 0, 0, 0], [1, 1, 0, 1, 0]] } },
  ],
  check: (input) => {
    const board = input.board as number[][];
    if (board.some((row) => row.length !== board[0].length)) return "Every row needs the same number of cells.";
    return null;
  },
  run(input) {
    const board: string[][] = (input.board as number[][]).map((row) => row.map((v) => (v === 1 ? "O" : "X")));
    const rows = board.length;
    const cols = board[0].length;
    const r = recorder();
    const captured = new Set<string>();

    const frame = (current: [number, number] | null, vars: Record<string, unknown> = {}) => {
      const tones: Record<string, CellTone> = {};
      board.forEach((row, y) =>
        row.forEach((v, x) => {
          if (v === "S") tones[cell(y, x)] = "done";
          else if (v === "X") tones[cell(y, x)] = captured.has(cell(y, x)) ? "write" : "muted";
        })
      );
      if (current) tones[cell(current[0], current[1])] = "primary";
      return { grids: [{ name: "board", values: board, tones }], vars };
    };

    const markSafe = (y: number, x: number) => {
      if (y < 0 || y >= rows || x < 0 || x >= cols || board[y][x] !== "O") return;
      board[y][x] = "S";
      r.step(
        lineOf(code, `board[r][c] = "S"`),
        `\`(${y}, ${x})\` is an O joined to the border, so it can never be surrounded: mark it **S** (safe) and keep walking.`,
        frame([y, x], { r: y, c: x })
      );
      markSafe(y - 1, x);
      markSafe(y + 1, x);
      markSafe(y, x - 1);
      markSafe(y, x + 1);
    };

    r.step(
      lineOf(code, "// left and right columns"),
      `An O region escapes only if it touches the border. So don't ask every O whether it's trapped — start at the **border** and mark every O you can reach from it.`,
      frame(null)
    );
    for (let y = 0; y < rows; y++) {
      markSafe(y, 0);
      markSafe(y, cols - 1);
    }
    for (let x = 0; x < cols; x++) {
      markSafe(0, x);
      markSafe(rows - 1, x);
    }
    const safe = board.flat().filter((v) => v === "S").length;
    r.step(
      lineOf(code, "// top and bottom rows"),
      safe === 0
        ? `No O touches the border, so nothing is safe: every O is surrounded.`
        : `The border walks are done: ${safe} O${safe === 1 ? " is" : "s are"} safe. Any O still unmarked has no path to the border.`,
      frame(null)
    );

    let flipped = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (board[y][x] === "O") {
          board[y][x] = "X";
          captured.add(cell(y, x));
          flipped++;
          r.step(lineOf(code, `if (board[r][c] === "O") board[r][c] = "X"`), `\`(${y}, ${x})\` is an O no border walk reached: it's surrounded, so **capture** it — flip it to X.`, frame([y, x], { r: y, c: x }));
        } else if (board[y][x] === "S") {
          board[y][x] = "O";
        }
      }
    }
    r.step(
      lineOf(code, `else if (board[r][c] === "S") board[r][c] = "O"`),
      `One sweep finishes it: ${flipped} surrounded O${flipped === 1 ? " was" : "s were"} captured, and every S went back to O. Each cell was handled a constant number of times: **O(m · n)**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
