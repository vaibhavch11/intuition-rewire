import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `function exist(board, word) {
  const m = board.length, n = board[0].length;
  const dfs = (r, c, i) => {
    if (i === word.length) return true;                       // every letter matched
    if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[i]) return false;
    const saved = board[r][c];
    board[r][c] = "#";                                        // mark: on the current path
    const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) ||
                  dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    board[r][c] = saved;                                      // un-mark when backing out
    return found;
  };
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true;
  }
  return false;
}`;

const parseBoard = (text: string) => text.trim().split(/[\s,;]+/).map((row) => [...row.toUpperCase()]);

const program: Program = {
  title: "Word search: DFS with marking",
  code,
  fields: [
    { key: "board", label: "board (rows of letters)", kind: "text", maxLength: 24, hint: "rows separated by spaces, like ABCE SFCS ADEE" },
    { key: "word", label: "word", kind: "text", maxLength: 6, hint: "letters, like ABCCED" },
  ],
  examples: [
    { label: "Found", input: { board: "ABCE SFCS ADEE", word: "ABCCED" } },
    { label: "SEE", input: { board: "ABCE SFCS ADEE", word: "SEE" } },
    { label: "Reuse not allowed", input: { board: "ABCE SFCS ADEE", word: "ABCB" } },
  ],
  check(input) {
    const rows = parseBoard(input.board as string);
    if (rows.length > 4 || rows.some((r) => r.length !== rows[0].length || r.length > 4)) return "Use up to 4 rows of up to 4 letters, all the same length.";
    if (rows.some((r) => r.some((ch) => !/[A-Z]/.test(ch)))) return "The board may only contain letters.";
    return /^[a-zA-Z]+$/.test(input.word as string) ? null : "The word may only contain letters.";
  },
  run(input) {
    const board = parseBoard(input.board as string);
    const word = (input.word as string).toUpperCase();
    const m = board.length;
    const n = board[0].length;
    const r0 = recorder();
    const path: [number, number][] = [];
    let checks = 0;
    const view = (extra: Record<string, CellTone> = {}) => {
      const tones: Record<string, CellTone> = {};
      path.forEach(([r, c]) => {
        tones[cell(r, c)] = "primary";
      });
      return {
        grids: [{ name: "board (# = on the current path)", values: board.map((row) => [...row]), tones: { ...tones, ...extra } }],
        arrays: [{ name: "word", values: [...word], tones: Object.fromEntries([...word].map((_, i) => [i, i < path.length ? "success" : "idle"])) as Record<number, CellTone> }],
      };
    };

    const dfs = (r: number, c: number, i: number): boolean => {
      checks++;
      if (i === word.length) {
        r0.step(lineOf(code, "if (i === word.length) return true;"), `All ${word.length} letters are matched — the word is on the board.`, view());
        return true;
      }
      if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[i]) {
        if (path.length > 0) {
          const why = r < 0 || r >= m || c < 0 || c >= n ? `(${r}, ${c}) is off the board` : board[r][c] === "#" ? `(${r}, ${c}) is already on the path` : `(${r}, ${c}) holds ${board[r][c]}, not ${word[i]}`;
          r0.step(lineOf(code, "if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[i]) return false;"), `Looking for **${word[i]}** (letter ${i + 1}): ${why}. Dead end.`, view(r >= 0 && r < m && c >= 0 && c < n ? { [cell(r, c)]: board[r][c] === "#" ? "write" : "tertiary" } : {}));
        }
        return false;
      }
      const saved = board[r][c];
      board[r][c] = "#";
      path.push([r, c]);
      r0.step(lineOf(code, "board[r][c] = \"#\";"), `(${r}, ${c}) holds **${saved}** = letter ${i + 1}. Mark it # so this path can't reuse it, then look for ${i + 1 < word.length ? word[i + 1] : "nothing more"} in its neighbours.`, view({ [cell(r, c)]: "write" }));
      const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
      board[r][c] = saved;
      path.pop();
      if (!found) {
        r0.step(lineOf(code, "board[r][c] = saved;"), `No neighbour of (${r}, ${c}) continues the word. Restore the ${saved} and back up.`, view({ [cell(r, c)]: "tertiary" }));
      }
      return found;
    };

    let answer = false;
    r0.step(lineOf(code, "const m = board.length"), `Try every cell as the start of "${word}". From each matched letter, search its four neighbours for the next one.`, view());
    outer: for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (dfs(r, c, 0)) {
          answer = true;
          break outer;
        }
      }
    }
    r0.step(lineOf(code, answer ? "for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true;" : "return false;"), answer ? `Found: return **true** (${checks} calls). The board was restored as the search backed out.` : `No start cell spells "${word}": return **false** (${checks} calls). O(m · n · 3ᴸ) in the worst case.`, view());
    r0.frames[r0.frames.length - 1].done = true;
    return r0.frames;
  },
};

export default program;
