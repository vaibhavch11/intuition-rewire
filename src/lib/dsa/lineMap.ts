/**
 * Matches each line of the simulator's JavaScript to the line doing the same
 * job in the same solution written in another language, so a dry run can
 * highlight the running line in Python, Java or C++ too.
 *
 * Lines are compared by their words (names, numbers, comparisons, comment
 * text), with each language's spelling of the same idea made equal
 * (`push` / `append` / `add` / `push_back`, `length` / `len()` / `size()`) and
 * type words dropped. Each line takes its best match, helped by whether its
 * neighbours match too, so a helper function written above the main one (as
 * C++ needs) still lines up.
 */

const SAME: Record<string, string> = {
  push: "add", append: "add", push_back: "add", add: "add", offer: "add", appendleft: "unshift", addFirst: "unshift", push_front: "unshift",
  length: "size", len: "size", size: "size", isEmpty: "size", empty: "size",
  // Taking something out: Java's list.remove(size - 1) is JavaScript's pop().
  pop: "pop", pop_back: "pop", removeLast: "pop", pollLast: "pop", remove: "pop", delete: "pop", erase: "pop", discard: "pop",
  shift: "shift", popleft: "shift", poll: "shift", pop_front: "shift", pollFirst: "shift", removeFirst: "shift",
  None: "null", nullptr: "null", NULL: "null", null: "null", undefined: "null",
  True: "true", False: "false", TRUE: "true", FALSE: "false",
  elif: "else",
  and: "&&", or: "||", not: "!",
  has: "contains", containsKey: "contains", count: "contains", contains: "contains", in: "contains",
  get: "get", getOrDefault: "get",
  set: "put", put: "put", insert: "put",
  floor: "floor", floorDiv: "floor",
  max: "max", min: "min",
  Infinity: "inf", MAX_VALUE: "inf", INT_MAX: "inf", inf: "inf", MIN_VALUE: "-inf", INT_MIN: "-inf",
  self: "", this: "",
};

const TYPE_WORDS = new Set([
  "const", "let", "var", "int", "long", "double", "float", "boolean", "bool", "auto", "char", "void", "byte", "short",
  "new", "def", "function", "public", "private", "protected", "static", "final", "class", "struct", "std",
  "vector", "List", "ArrayList", "LinkedList", "Integer", "Long", "Character", "Boolean", "Double", "String", "string",
  "Map", "HashMap", "TreeMap", "unordered_map", "map", "Set", "HashSet", "unordered_set", "Deque", "ArrayDeque", "Queue",
  "Stack", "PriorityQueue", "priority_queue", "deque", "queue", "stack", "pair", "Arrays", "Math", "math", "Collections",
  "Object", "Array", "int64_t", "size_t", "unsigned", "nonlocal", "global", "of", "range", "dict", "Node",
  "ListNode", "TreeNode", "Optional", "typing", "begin", "end",
]);

/** Generic type brackets (`List<Integer>`, `vector<vector<int>>`), which are types, not comparisons. */
const GENERIC = /<[\w\s,:*.[\]<>?]*>/g;

/** A line's words: its code, and its comment kept apart. */
interface LineWords {
  code: string[];
  comment: string[];
  /** Declares or assigns a value (`x = …`), as opposed to calling or testing. */
  assigns: boolean;
}

/** An `=` that assigns, not one inside `==`, `<=`, `>=`, `!=` or `=>`. */
const ASSIGNS = /(?:^|[^=!<>])=(?![=>])/;

function words(line: string): LineWords {
  // Strings go first, so a "#" or "//" inside one isn't read as a comment.
  const plain = line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`/g, " str ");
  const at = plain.search(/\/\/|#(?!include)/);
  const code = at < 0 ? plain : plain.slice(0, at);
  const comment = at < 0 ? "" : plain.slice(at);
  return {
    code: tokens(code),
    comment: (comment.match(/[A-Za-z]{3,}/g) ?? []).map((w) => w.toLowerCase()),
    assigns: ASSIGNS.test(code),
  };
}

function tokens(line: string): string[] {
  const out: string[] = [];
  let bare = line;
  for (let prev = ""; prev !== bare; ) {
    prev = bare;
    bare = bare.replace(GENERIC, " ");
  }
  for (const raw of bare.match(/[A-Za-z_]\w*|\d+|<=|>=|==|!=|===|!==|&&|\|\||[<>]/g) ?? []) {
    let t = raw === "===" ? "==" : raw === "!==" ? "!=" : raw;
    if (TYPE_WORDS.has(t) || t === "0" || t === "1") continue;
    if (Object.hasOwn(SAME, t)) t = SAME[t];
    if (t) out.push(t.toLowerCase());
  }
  return out;
}

/** Dice similarity of two token multisets, 0 to 1. */
function similarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const counts = new Map<string, number>();
  for (const t of a) counts.set(t, (counts.get(t) ?? 0) + 1);
  let common = 0;
  for (const t of b) {
    const n = counts.get(t) ?? 0;
    if (n > 0) {
      common++;
      counts.set(t, n - 1);
    }
  }
  return (2 * common) / (a.length + b.length);
}

/** Below this, a line is left unmatched rather than pointing at the wrong one. */
const MIN_MATCH = 0.34;

/**
 * For each 1-based line of `from`, the 1-based line of `to` doing the same
 * work, or 0 when nothing matches well enough.
 */
export function mapLines(from: string, to: string): number[] {
  const a = from.split("\n").map(words);
  const b = to.split("\n").map(words);
  const aLines = a.flatMap((w, i) => (w.code.length ? [i] : []));
  const bLines = b.flatMap((w, j) => (w.code.length ? [j] : []));
  // The code decides; a comment both lines share (the lessons repeat them
  // across languages) can strengthen a match, but a one-sided comment can't hide one.
  // A JavaScript line that sets a value (`const path = []`) prefers a line that
  // sets one too over a call that merely uses the same name (`path.add(x)`).
  const control = (line: string) => /^\s*(?:\}\s*)?(?:if|for|while|else|switch|catch|do|return)\b/.test(line);
  // And a function's first line matches only another function's first line.
  const header = (line: string) =>
    /^\s*(?:def|function|class)\s/.test(line) ||
    /=>\s*\{\s*$/.test(line) ||
    (/\)\s*(?:const\s*)?\{\s*$/.test(line) && !control(line) && !/=/.test(line));
  const fromLines = from.split("\n");
  const toLines = to.split("\n");
  const sim = aLines.map((i) =>
    bLines.map((j) => {
      let score = Math.max(similarity(a[i].code, b[j].code), similarity(a[i].comment, b[j].comment));
      const sets = a[i].assigns && !control(fromLines[i]) && !header(fromLines[i]);
      if (sets && !b[j].assigns && !header(toLines[j])) score *= 0.6;
      if (header(fromLines[i]) !== header(toLines[j])) score *= 0.6;
      return score;
    })
  );

  const result = new Array<number>(a.length + 1).fill(0);
  aLines.forEach((i, ai) => {
    let best = -1;
    let bestScore = -Infinity;
    bLines.forEach((j, bj) => {
      const own = sim[ai][bj];
      if (own < MIN_MATCH) return;
      // Neighbours that match too make this the same spot, not a look-alike line.
      const before = ai > 0 && bj > 0 ? sim[ai - 1][bj - 1] : 0;
      const after = ai + 1 < aLines.length && bj + 1 < bLines.length ? sim[ai + 1][bj + 1] : 0;
      const drift = Math.abs(ai / Math.max(1, aLines.length - 1) - bj / Math.max(1, bLines.length - 1));
      const score = own + 0.35 * (before + after) - 0.08 * drift;
      if (score > bestScore) {
        bestScore = score;
        best = j;
      }
    });
    if (best >= 0) result[i + 1] = best + 1;
  });
  return result;
}

/**
 * Below this share of matched lines the two versions are written differently
 * (a loop against recursion, a library call against a hand-written search),
 * so following along line by line would mislead.
 */
const TRUSTED_SHARE = 0.8;

/**
 * The line map from the simulator's JavaScript to `to`, or null when the two
 * versions differ too much for a line-by-line match to be trusted.
 */
export function trustedLineMap(from: string, to: string): number[] | null {
  const map = mapLines(from, to);
  const lines = from.split("\n").flatMap((line, i) => (/[A-Za-z0-9]/.test(line) ? [i + 1] : []));
  const matched = lines.filter((n) => map[n] > 0).length;
  return lines.length > 0 && matched / lines.length >= TRUSTED_SHARE ? map : null;
}
