import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";
import { lineOf } from "../graphs";

const code = `function longestPalindromeSubseq(s) {
  const n = s.length;
  // dp[i][j]: the longest palindromic subsequence inside s[i..j]
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = n - 1; i >= 0; i--) {             // i goes down, so the row below is ready
    dp[i][i] = 1;                                // one letter is a palindrome
    for (let j = i + 1; j < n; j++) {
      if (s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1] + 2;     // both ends wrap the inside
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);   // drop one end or the other
    }
  }
  return dp[0][n - 1];
}`;

const program: Program = {
  title: "Longest palindromic subsequence: an interval table",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 8, hint: "lowercase letters, like bbbab" }],
  examples: [
    { label: "Example", input: { s: "bbbab" } },
    { label: "cbbd", input: { s: "cbbd" } },
    { label: "Scattered", input: { s: "agbdba" } },
    { label: "All different", input: { s: "abcd" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "s: use lowercase letters only."),
  run(input) {
    const s = input.s as string;
    const n = s.length;
    const r = recorder();
    const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const shown: Scalar[][] = Array.from({ length: n }, () => new Array(n).fill(""));
    const below: Record<string, CellTone> = {};
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) below[cell(i, j)] = "muted";
    const letters = [...s];
    const view = (tones: Record<string, CellTone>, lt: Record<number, CellTone>) => ({
      arrays: [{ name: "s", values: letters, tones: lt }],
      grids: [{ name: "dp[i][j]: answer inside s[i..j]", values: shown.map((row) => [...row]), tones: { ...below, ...tones }, rowLabels: letters.map((ch, k) => `${k} ${ch}`), columnLabels: letters.map((ch, k) => `${k} ${ch}`) }],
    });

    r.step(lineOf(code, "const dp = "), `dp[i][j] = the longest palindromic subsequence inside s[i..j]. Rows run **bottom to top**, because each cell reads the row below it. Cells below the diagonal are empty ranges.`, view({}, {}));
    for (let i = n - 1; i >= 0; i--) {
      dp[i][i] = 1;
      shown[i][i] = 1;
      r.step(lineOf(code, "dp[i][i] = 1;"), `Row ${i}: s[${i}..${i}] = "${s[i]}" is one letter, a palindrome of length **1**.`, view({ [cell(i, i)]: "write" }, { [i]: "write" }));
      for (let j = i + 1; j < n; j++) {
        const tones: Record<string, CellTone> = { [cell(i, j)]: "write" };
        let note: string;
        let line: string;
        if (s[i] === s[j]) {
          dp[i][j] = dp[i + 1][j - 1] + 2;
          if (i + 1 <= j - 1) tones[cell(i + 1, j - 1)] = "success";
          note = `s[${i}] = s[${j}] = '${s[i]}': both ends wrap the inside s[${i + 1}..${j - 1}] (${i + 1 <= j - 1 ? dp[i + 1][j - 1] : "empty, 0"}). dp[${i}][${j}] = ${i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0} + 2 = **${dp[i][j]}**.`;
          line = "if (s[i] === s[j]) dp[i][j] = ";
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
          tones[cell(i + 1, j)] = dp[i + 1][j] >= dp[i][j - 1] ? "success" : "primary";
          tones[cell(i, j - 1)] = dp[i + 1][j] >= dp[i][j - 1] ? "primary" : "success";
          note = `'${s[i]}' ≠ '${s[j]}': drop one end. Without s[${i}]: ${dp[i + 1][j]}, without s[${j}]: ${dp[i][j - 1]}. dp[${i}][${j}] = **${dp[i][j]}**.`;
          line = "else dp[i][j] = Math.max(";
        }
        shown[i][j] = dp[i][j];
        r.step(lineOf(code, line), note, view(tones, { [i]: s[i] === s[j] ? "success" : "primary", [j]: s[i] === s[j] ? "success" : "primary" }));
      }
    }
    // Walk back from the top-right corner to spell one longest palindrome.
    const left: string[] = [];
    let middle = "";
    const path: Record<string, CellTone> = {};
    const used: Record<number, CellTone> = {};
    let i = 0;
    let j = n - 1;
    while (i <= j) {
      path[cell(i, j)] = "success";
      if (i === j) {
        middle = s[i];
        used[i] = "success";
        break;
      }
      if (s[i] === s[j]) {
        left.push(s[i]);
        used[i] = "success";
        used[j] = "success";
        i++;
        j--;
      } else if (dp[i + 1][j] >= dp[i][j - 1]) i++;
      else j--;
    }
    const word = left.join("") + middle + [...left].reverse().join("");
    r.step(lineOf(code, "return dp[0][n - 1];"), `The whole string is s[0..${n - 1}]: **${dp[0][n - 1]}** — for example "${word}". O(n²) time and space.`, { ...view(path, used), done: true });
    return r.frames;
  },
};

export default program;
