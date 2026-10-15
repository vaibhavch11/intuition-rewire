import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function minDistance(word1, word2) {
  const n = word1.length, m = word2.length;
  // dp[i][j]: the fewest edits to turn word1[0..i) into word2[0..j)
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;           // delete all i letters
  for (let j = 0; j <= m; j++) dp[0][j] = j;           // insert all j letters
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];   // last letters match: free
      else dp[i][j] = 1 + Math.min(
        dp[i - 1][j - 1],                              // replace word1[i-1] with word2[j-1]
        dp[i - 1][j],                                  // delete word1[i-1]
        dp[i][j - 1]                                   // insert word2[j-1]
      );
    }
  }
  return dp[n][m];
}`;

const program: Program = {
  title: "Edit distance (DP table)",
  code,
  fields: [
    { key: "word1", label: "word1 (rows)", kind: "text", maxLength: 6, hint: "lowercase letters, like horse" },
    { key: "word2", label: "word2 (columns)", kind: "text", maxLength: 7, hint: "lowercase letters, like ros" },
  ],
  examples: [
    { label: "Example", input: { word1: "horse", word2: "ros" } },
    { label: "Classic", input: { word1: "kitten", word2: "sitting" } },
    { label: "One letter apart", input: { word1: "cat", word2: "cut" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.word1 as string) && /^[a-z]+$/.test(input.word2 as string) ? null : "word1 and word2: use lowercase letters only."),
  run(input) {
    const a = input.word1 as string;
    const b = input.word2 as string;
    const n = a.length;
    const m = b.length;
    const dp: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : null)));
    const r = recorder();
    const rowLabels = ["", ...a];
    const columnLabels = ["", ...b];

    const frame = (tones: Record<string, CellTone>, vars: Record<string, unknown> = {}) => ({
      grids: [{ name: "dp (rows: word1, columns: word2)", values: dp.map((row) => row.map((v): Scalar => (v === null ? "" : v))), tones, rowLabels, columnLabels }],
      vars,
    });

    const edges: Record<string, CellTone> = {};
    for (let i = 0; i <= n; i++) edges[cell(i, 0)] = "tertiary";
    for (let j = 0; j <= m; j++) edges[cell(0, j)] = "tertiary";
    r.step(
      lineOf(code, "dp[0][j] = j"),
      `Cell [i][j] is the fewest edits to turn the first i letters of "${a}" into the first j letters of "${b}". The edges are easy: turning i letters into nothing takes **i deletes** (column 0), and building j letters from nothing takes **j inserts** (row 0).`,
      frame(edges)
    );
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const vars = { i, j, "word1[i-1]": a[i - 1], "word2[j-1]": b[j - 1] };
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
          r.step(
            lineOf(code, "dp[i][j] = dp[i - 1][j - 1];"),
            `'${a[i - 1]}' = '${b[j - 1]}': the last letters already match, so they cost nothing. Copy the diagonal: **${dp[i][j]}**.`,
            frame({ [cell(i - 1, j - 1)]: "success", [cell(i, j)]: "write" }, vars)
          );
        } else {
          const replace = dp[i - 1][j - 1] as number;
          const remove = dp[i - 1][j] as number;
          const insert = dp[i][j - 1] as number;
          dp[i][j] = 1 + Math.min(replace, remove, insert);
          const best = replace <= remove && replace <= insert ? `replace '${a[i - 1]}' with '${b[j - 1]}'` : remove <= insert ? `delete '${a[i - 1]}'` : `insert '${b[j - 1]}'`;
          r.step(
            lineOf(code, "else dp[i][j] = 1 + Math.min("),
            `'${a[i - 1]}' and '${b[j - 1]}' differ: one edit plus the cheapest of replace (diagonal ${replace}), delete (above ${remove}) or insert (left ${insert}). Best: ${best}, for **${dp[i][j]}**.`,
            frame({ [cell(i - 1, j - 1)]: "tertiary", [cell(i - 1, j)]: "tertiary", [cell(i, j - 1)]: "tertiary", [cell(i, j)]: "write" }, vars)
          );
        }
      }
    }

    // Walk back from the corner to list one shortest sequence of edits.
    const path: Record<string, CellTone> = {};
    const ops: string[] = [];
    const at = (i: number, j: number) => dp[i][j] as number;
    for (let i = n, j = m; i > 0 || j > 0; ) {
      path[cell(i, j)] = "write";
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && at(i, j) === at(i - 1, j - 1)) {
        path[cell(i, j)] = "success";
        i--;
        j--;
      } else if (i > 0 && j > 0 && at(i, j) === at(i - 1, j - 1) + 1) {
        ops.unshift(`replace '${a[i - 1]}' with '${b[j - 1]}'`);
        i--;
        j--;
      } else if (i > 0 && at(i, j) === at(i - 1, j) + 1) {
        ops.unshift(`delete '${a[i - 1]}'`);
        i--;
      } else {
        ops.unshift(`insert '${b[j - 1]}'`);
        j--;
      }
    }
    r.step(
      code.split("\n").length - 1,
      `The bottom-right cell covers both whole words: **${dp[n][m]}** edit${dp[n][m] === 1 ? "" : "s"}.${ops.length ? ` Walking back from it gives one way: ${ops.join(", ")}.` : " They're already equal."} ${n + 1} × ${m + 1} cells, each O(1): **O(n · m)**.`,
      { ...frame(path, { edits: dp[n][m] }), done: true }
    );
    return r.frames;
  },
};

export default program;
