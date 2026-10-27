import { callTree, stackTones } from "../calltree";
import { lineOf } from "../graphs";
import { recorder, toneRange, type CellTone, type EdgeTone, type Program } from "../types";

const code = `function partition(s) {
  const result = [];
  const path = [];
  const isPal = (i, j) => {
    while (i < j) if (s[i++] !== s[j--]) return false;
    return true;
  };
  const cut = (start) => {
    if (start === s.length) {                // the whole string is split
      result.push([...path]);
      return;
    }
    for (let end = start; end < s.length; end++) {
      if (!isPal(start, end)) continue;      // prune: this piece isn't a palindrome
      path.push(s.slice(start, end + 1));    // choose the piece s[start..end]
      cut(end + 1);                          // split the rest
      path.pop();
    }
  };
  cut(0);
  return result;
}`;

const pal = (x: string) => x === [...x].reverse().join("");

const program: Program = {
  title: "Palindrome partitioning: cut off palindromic pieces",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 4, hint: "lowercase letters, like aab" }],
  examples: [
    { label: "Example", input: { s: "aab" } },
    { label: "aba", input: { s: "aba" } },
    { label: "All equal", input: { s: "aaaa" } },
  ],
  check: (input) => (/^[a-z]+$/.test(input.s as string) ? null : "Use lowercase letters."),
  run(input) {
    const s = input.s as string;
    const n = s.length;
    const r = recorder();
    const tree = callTree("decision tree: each node is the piece just cut off");
    const tones: Record<number, CellTone> = {};
    const edgeTones: Record<number, EdgeTone> = {};
    const result: string[] = [];
    const path: string[] = [];
    const view = (at: number, start: number, end: number | null) => ({
      graphs: [tree.view({ tones: { ...tones, ...stackTones(tree.pathTo(at)) }, edgeTones })],
      arrays: [
        { name: "s", values: [...s], tones: { ...toneRange(0, start - 1, "done"), ...(end === null ? {} : toneRange(start, end, pal(s.slice(start, end + 1)) ? "primary" : "tertiary")) } },
        { name: "result", values: [...result] },
      ],
      stacks: [{ name: "path (pieces)", values: [...path] }],
    });

    const cut = (start: number, at: number) => {
      if (start === n) {
        result.push(path.join("|"));
        tones[at] = "success";
        r.step(lineOf(code, "result.push([...path]);"), `The whole string is split into palindromes: **${path.join(" | ")}**. Record it.`, view(at, start, null));
        return;
      }
      for (let end = start; end < n; end++) {
        const piece = s.slice(start, end + 1);
        if (!pal(piece)) {
          const id = tree.add(at, piece);
          tones[id] = "muted";
          edgeTones[id] = "muted";
          r.step(lineOf(code, "if (!isPal(start, end)) continue;"), `"${piece}" isn't a palindrome — **prune**: no split starting with it is explored.`, view(at, start, end));
          continue;
        }
        path.push(piece);
        const child = tree.add(at, piece);
        r.step(lineOf(code, "path.push(s.slice(start, end + 1));"), `"${piece}" is a palindrome. Cut it off (pieces: ${path.join(" | ")}) and split the rest${end + 1 < n ? `, "${s.slice(end + 1)}"` : ""}.`, view(child, start, end));
        cut(end + 1, child);
        if (tones[child] !== "success") tones[child] = "done";
        path.pop();
      }
    };
    const root = tree.add(null, "·");
    r.step(lineOf(code, "cut(0);"), `Split "${s}" from the front: each level chooses where the next piece ends, keeping only pieces that are palindromes.`, view(root, 0, null));
    cut(0, root);
    tones[root] = "done";
    r.step(lineOf(code, "return result;"), `**${result.length}** way${result.length === 1 ? "" : "s"} to split "${s}": ${result.join(", ")}. Up to 2ⁿ⁻¹ splits, O(n) per check: O(n · 2ⁿ).`, {
      graphs: [tree.view({ tones: { ...tones }, edgeTones })],
      arrays: [{ name: "s", values: [...s] }, { name: "result", values: [...result] }],
      stacks: [{ name: "path (pieces)", values: [] }],
      done: true,
    });
    tree.place(r.frames);
    return r.frames;
  },
};

export default program;
