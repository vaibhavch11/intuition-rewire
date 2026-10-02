/*
 * A small, dependency-free syntax highlighter for the four languages the
 * lessons use. It only has to colour short, well-formed solutions, so a
 * single left-to-right scan with a handful of patterns is enough.
 */

export type TokenKind = "plain" | "comment" | "string" | "number" | "keyword" | "function" | "type" | "punct" | "meta";
export type Token = { kind: TokenKind; text: string };

type Lang = "js" | "py" | "java" | "cpp";

const LANGS: Record<string, Lang> = {
  javascript: "js",
  js: "js",
  typescript: "js",
  ts: "js",
  python: "py",
  py: "py",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  c: "cpp",
};

const words = (list: string) => new Set(list.split(/\s+/));

const KEYWORDS: Record<Lang, Set<string>> = {
  js: words(
    "const let var function return if else for while do break continue new class extends of in typeof instanceof this switch case default try catch finally throw async await yield import export from null undefined true false"
  ),
  py: words(
    "def return if elif else for while in not and or is None True False class import from as pass break continue lambda with yield try except finally raise global nonlocal del assert self"
  ),
  java: words(
    "public private protected static final void int long double float boolean char byte short class interface extends implements new return if else for while do break continue this null true false switch case default try catch finally throw throws import package var"
  ),
  cpp: words(
    "int long double float bool char void auto const static return if else for while do break continue new delete class struct public private protected this nullptr true false switch case default using namespace template typename unsigned signed size_t"
  ),
};

const BUILTINS: Record<Lang, Set<string>> = {
  js: words("Math Array Infinity NaN console Number String Object Set Map JSON"),
  py: words("len range print min max abs sum sorted enumerate zip list dict set int float str tuple reversed"),
  java: words("Math Integer Long System Arrays List ArrayList HashMap HashSet Map Set String Collections"),
  cpp: words("std vector string swap min max reverse sort INT_MIN INT_MAX LLONG_MAX abs unordered_map unordered_set pair"),
};

type Rule = [TokenKind | "word" | "space", RegExp];

function rulesFor(lang: Lang): Rule[] {
  const comment: Rule =
    lang === "py" ? ["comment", /#[^\n]*/y] : ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y];
  const string: Rule =
    lang === "py"
      ? ["string", /[rbfRBF]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y]
      : lang === "js"
        ? ["string", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y]
        : ["string", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y];
  const meta: Rule[] =
    lang === "cpp" ? [["meta", /#\s*[a-z]+[^\n]*/y]] : lang === "java" || lang === "py" ? [["meta", /@\w+/y]] : [];
  return [
    ["space", /\s+/y],
    comment,
    string,
    ...meta,
    ["number", /(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)[lLfF]?(?![\w$])/y],
    ["word", /[A-Za-z_$][\w$]*/y],
    ["punct", /[{}()[\];,.:?<>=!+\-*/%&|^~]+/y],
  ];
}

function classify(word: string, rest: string, lang: Lang): TokenKind {
  if (KEYWORDS[lang].has(word)) return "keyword";
  if (BUILTINS[lang].has(word)) return "type";
  if (/^\s*\(/.test(rest)) return "function";
  if (/^[A-Z]/.test(word)) return "type";
  return "plain";
}

/** Splits code into lines of coloured tokens. Unknown languages come back plain. */
export function highlight(code: string, language: string): Token[][] {
  const lang = LANGS[language.toLowerCase()];
  if (!lang) return code.split("\n").map((text) => [{ kind: "plain", text }]);

  const rules = rulesFor(lang);
  const tokens: Token[] = [];
  const push = (kind: TokenKind, text: string) => {
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === kind) prev.text += text;
    else tokens.push({ kind, text });
  };

  let i = 0;
  scan: while (i < code.length) {
    for (const [kind, pattern] of rules) {
      pattern.lastIndex = i;
      const match = pattern.exec(code);
      if (!match || match[0].length === 0) continue;
      const text = match[0];
      if (kind === "space") push("plain", text);
      else if (kind === "word") push(classify(text, code.slice(i + text.length, i + text.length + 40), lang), text);
      else push(kind, text);
      i += text.length;
      continue scan;
    }
    push("plain", code[i]);
    i++;
  }

  // Tokens can span lines (block comments, docstrings); cut them at newlines.
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    token.text.split("\n").forEach((part, n) => {
      if (n > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ kind: token.kind, text: part });
    });
  }
  return lines;
}
