import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function longestCommonSubsequence(text1, text2) {
  const n = text1.length, m = text2.length;
  // dp[i][j]: the LCS length of text1[0..i) and text2[0..j)
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;   // both letters join the LCS
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);              // drop one letter or the other
    }
  }
  return dp[n][m];
}`;

const program: Program = {
  title: "Longest common subsequence (DP table)",
  code,
  fields: [
    { key: "text1", label: "text1 (rows)", kind: "text", maxLength: 7, hint: "lowercase letters, like abcde" },
    { key: "text2", label: "text2 (columns)", kind: "text", maxLength: 6, hint: "lowercase letters, like ace" },
  ],
  examples: [
    { label: "Example", input: { text1: "abcde", text2: "ace" } },
    { label: "Two answers", input: { text1: "agcat", text2: "gac" } },
    { label: "Nothing shared", input: { text1: "abc", text2: "def" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.text1 as string) && /^[a-z]+$/.test(input.text2 as string) ? null : "text1 and text2: use lowercase letters only."),
  run(input) {
    const a = input.text1 as string;
    const b = input.text2 as string;
    const n = a.length;
    const m = b.length;
    const dp: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : null)));
    const r = recorder();
    const rowLabels = ["", ...a];
    const columnLabels = ["", ...b];

    const frame = (tones: Record<string, CellTone>, vars: Record<string, unknown> = {}) => ({
      grids: [{ name: "dp (rows: text1, columns: text2)", values: dp.map((row) => row.map((v): Scalar => (v === null ? "" : v))), tones, rowLabels, columnLabels }],
      vars,
    });

    r.step(lineOf(code, "const dp = Array.from"), `Cell [i][j] answers a smaller question: the LCS of the first i letters of "${a}" and the first j letters of "${b}". Row 0 and column 0 are an empty prefix, which shares nothing: **0**.`, frame({}));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = (dp[i - 1][j - 1] as number) + 1;
          r.step(
            lineOf(code, "dp[i][j] = dp[i - 1][j - 1] + 1"),
            `'${a[i - 1]}' = '${b[j - 1]}': both last letters can join the LCS. Take the diagonal and add one: ${dp[i - 1][j - 1]} + 1 = **${dp[i][j]}**.`,
            frame({ [cell(i - 1, j - 1)]: "success", [cell(i, j)]: "write" }, { i, j, "text1[i-1]": a[i - 1], "text2[j-1]": b[j - 1] })
          );
        } else {
          const up = dp[i - 1][j] as number;
          const left = dp[i][j - 1] as number;
          dp[i][j] = Math.max(up, left);
          r.step(
            lineOf(code, "else dp[i][j] = Math.max"),
            `'${a[i - 1]}' and '${b[j - 1]}' differ, so at least one of them is not in the LCS. Drop '${a[i - 1]}' (above: ${up}) or drop '${b[j - 1]}' (left: ${left}) and keep the better: **${dp[i][j]}**.`,
            frame({ [cell(i - 1, j)]: "tertiary", [cell(i, j - 1)]: "tertiary", [cell(i, j)]: "write" }, { i, j, "text1[i-1]": a[i - 1], "text2[j-1]": b[j - 1] })
          );
        }
      }
    }

    // Walk back from the corner to spell one LCS: diagonal steps are the shared letters.
    const path: Record<string, CellTone> = {};
    let word = "";
    for (let i = n, j = m; i > 0 && j > 0; ) {
      if (a[i - 1] === b[j - 1]) {
        path[cell(i, j)] = "success";
        word = a[i - 1] + word;
        i--;
        j--;
      } else {
        path[cell(i, j)] = "done";
        if ((dp[i - 1][j] as number) >= (dp[i][j - 1] as number)) i--;
        else j--;
      }
    }
    r.step(
      code.split("\n").length - 1,
      `The bottom-right cell covers both whole strings: the LCS has length **${dp[n][m]}**.${word ? ` Walking back from it, the diagonal (green) steps spell one LCS: "${word}".` : ""} ${n} × ${m} cells, each O(1): **O(n · m)**.`,
      { ...frame(path, { "LCS length": dp[n][m], "one LCS": word ? `"${word}"` : '""' }), done: true }
    );
    return r.frames;
  },
};

export default program;
