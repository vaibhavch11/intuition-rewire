import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function solveSudoku(board) {
  const n = board.length, box = Math.sqrt(n);                 // 9 and 3 for a normal sudoku
  const ok = (r, c, d) => {
    for (let i = 0; i < n; i++) {
      if (board[r][i] === d || board[i][c] === d) return false;   // row and column
      const br = box * Math.floor(r / box) + Math.floor(i / box);
      const bc = box * Math.floor(c / box) + (i % box);
      if (board[br][bc] === d) return false;                      // box
    }
    return true;
  };
  const solve = () => {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] !== ".") continue;
        for (let d = 1; d <= n; d++) {
          if (!ok(r, c, String(d))) continue;
          board[r][c] = String(d);                            // choose
          if (solve()) return true;                           // explore: the rest worked
          board[r][c] = ".";                                  // un-choose
        }
        return false;                                         // no digit fits: back up
      }
    }
    return true;                                              // no empty cell left: solved
  };
  solve();
}`;

const parse = (text: string) => text.trim().split(/[\s,;]+/).map((row) => [...row]);

const program: Program = {
  title: "Sudoku solver on a 4 × 4 board",
  code,
  fields: [{ key: "board", label: "board (4 rows, . = empty)", kind: "text", maxLength: 24, hint: "4 rows of 4 separated by spaces, like 1..4 ..1. .1.. 4..1" }],
  examples: [
    { label: "Example", input: { board: "1..4 ..1. .1.. 4..1" } },
    { label: "Needs backtracking", input: { board: ".... .4.. ..2. 3..." } },
    { label: "Nearly empty", input: { board: "1... .... .... ...4" } },
  ],
  check(input) {
    const b = parse(input.board as string);
    if (b.length !== 4 || b.some((row) => row.length !== 4)) return "Enter 4 rows of 4 cells.";
    if (b.some((row) => row.some((ch) => !/[1-4.]/.test(ch)))) return "Use the digits 1–4 and . for empty cells.";
    for (let i = 0; i < 4; i++) {
      const groups = [b[i], b.map((row) => row[i]), [0, 1, 2, 3].map((k) => b[2 * Math.floor(i / 2) + Math.floor(k / 2)][2 * (i % 2) + (k % 2)])];
      for (const g of groups) {
        const ds = g.filter((ch) => ch !== ".");
        if (new Set(ds).size !== ds.length) return "A digit repeats in a row, column or box.";
      }
    }
    return null;
  },
  run(input) {
    const board = parse(input.board as string);
    const n = 4;
    const box = 2;
    const givens = board.map((row) => row.map((ch) => ch !== "."));
    const r0 = recorder();
    let guesses = 0;
    let backs = 0;
    const ok = (r: number, c: number, d: string) => {
      for (let i = 0; i < n; i++) {
        if (board[r][i] === d || board[i][c] === d) return false;
        if (board[box * Math.floor(r / box) + Math.floor(i / box)][box * Math.floor(c / box) + (i % box)] === d) return false;
      }
      return true;
    };
    const view = (extra: Record<string, CellTone> = {}) => {
      const tones: Record<string, CellTone> = {};
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) tones[cell(r, c)] = givens[r][c] ? "muted" : board[r][c] !== "." ? "primary" : "idle";
      return { grids: [{ name: "board (grey = given)", values: board.map((row) => row.map((ch) => (ch === "." ? "" : ch))), tones: { ...tones, ...extra } }] };
    };

    const solve = (): boolean => {
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (board[r][c] !== ".") continue;
          const fits = ["1", "2", "3", "4"].filter((d) => ok(r, c, d));
          r0.step(lineOf(code, "if (!ok(r, c, String(d))) continue;"), fits.length ? `The first empty cell is (${r}, ${c}). Digits that don't clash with its row, column or box: **${fits.join(", ")}**.` : `The first empty cell is (${r}, ${c}), and **no digit fits** — an earlier guess was wrong.`, { ...view({ [cell(r, c)]: fits.length ? "write" : "tertiary" }), vars: { guesses, "back-ups": backs } });
          for (const d of fits) {
            board[r][c] = d;
            guesses++;
            r0.step(lineOf(code, "board[r][c] = String(d);"), `Try **${d}** at (${r}, ${c}) and solve the rest.`, { ...view({ [cell(r, c)]: "write" }), vars: { guesses, "back-ups": backs } });
            if (solve()) return true;
            board[r][c] = ".";
            backs++;
            r0.step(lineOf(code, "board[r][c] = \".\";"), `${d} at (${r}, ${c}) led to a dead end. Erase it${d !== fits[fits.length - 1] ? " and try the next digit" : ""}.`, { ...view({ [cell(r, c)]: "tertiary" }), vars: { guesses, "back-ups": backs } });
          }
          r0.step(lineOf(code, "return false;"), `Every option for (${r}, ${c}) failed: return false so the previous cell tries its next digit.`, { ...view({ [cell(r, c)]: "tertiary" }), vars: { guesses, "back-ups": backs } });
          return false;
        }
      }
      return true;
    };
    r0.step(lineOf(code, "const n = board.length"), `A 4 × 4 Sudoku: digits 1–4, each once per row, column and 2 × 2 box. Fill the empty cells in order, backing up when one has no digit left.`, view());
    const solved = solve();
    const done: Record<string, CellTone> = {};
    if (solved) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!givens[r][c]) done[cell(r, c)] = "success";
    r0.step(lineOf(code, "return true;"), solved ? `No empty cell left: **solved** with ${guesses} guess${guesses === 1 ? "" : "es"} and ${backs} back-up${backs === 1 ? "" : "s"}. On a 9 × 9 board the same code works; choosing the cell with the fewest options first keeps the guesses down.` : `**No solution**: every option was tried.`, { ...view(done), vars: { guesses, "back-ups": backs }, done: true });
    return r0.frames;
  },
};

export default program;
