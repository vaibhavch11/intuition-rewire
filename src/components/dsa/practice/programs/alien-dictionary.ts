import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { graphView, lineOf, ringLayout } from "../graphs";
import { pointersAt, recorder, type ArrayView, type CellTone, type Program } from "../types";

const code = `function alienOrder(words) {
  const next = new Map();                     // letter -> letters that come after it
  const indegree = new Map();                 // letter -> how many letters must come first
  for (const word of words) {
    for (const ch of word) {
      if (!next.has(ch)) {
        next.set(ch, new Set());
        indegree.set(ch, 0);
      }
    }
  }
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    if (a.length > b.length && a.startsWith(b)) return "";   // "abc" before "ab": impossible
    for (let j = 0; j < Math.min(a.length, b.length); j++) {
      if (a[j] !== b[j]) {                    // the first difference is the only clue
        if (!next.get(a[j]).has(b[j])) {
          next.get(a[j]).add(b[j]);           // a[j] comes before b[j]
          indegree.set(b[j], indegree.get(b[j]) + 1);
        }
        break;
      }
    }
  }
  const queue = [...indegree.keys()].filter((ch) => indegree.get(ch) === 0);
  let order = "";
  for (let head = 0; head < queue.length; head++) {
    const ch = queue[head];
    order += ch;
    for (const after of next.get(ch)) {
      indegree.set(after, indegree.get(after) - 1);
      if (indegree.get(after) === 0) queue.push(after);
    }
  }
  return order.length === next.size ? order : "";   // letters left over sit on a cycle
}`;

const parseWords = (text: string) => text.split(/[\s,]+/).filter(Boolean);

const program: Program = {
  title: "Alien dictionary (letters as a graph)",
  code,
  fields: [{ key: "words", label: "words (in alien sorted order)", kind: "text", maxLength: 60, hint: "lowercase words separated by spaces, like wrt wrf er ett rftt" }],
  examples: [
    { label: "Example", input: { words: "wrt wrf er ett rftt" } },
    { label: "A contradiction", input: { words: "z x z" } },
    { label: "Prefix trap", input: { words: "abc ab" } },
  ],
  check: (input) => {
    const words = parseWords(input.words as string);
    if (words.length < 1 || words.length > 7) return "Enter between 1 and 7 words.";
    if (words.some((w) => !/^[a-z]{1,6}$/.test(w))) return "Use lowercase letters only, at most 6 per word.";
    if (new Set(words.join("")).size > 8) return "Use at most 8 different letters, so the graph stays readable.";
    return null;
  },
  run(input) {
    const words = parseWords(input.words as string);
    const letters = [...new Set(words.join(""))];
    const id = (ch: string) => letters.indexOf(ch);
    const next = new Map<string, Set<string>>(letters.map((ch) => [ch, new Set()]));
    const indegree = new Map<string, number>(letters.map((ch) => [ch, 0]));
    const r = recorder();

    // Every arrow the comparisons will find, so the vertices stay put from the first frame on.
    const allArrows: number[][] = [];
    for (let i = 0; i + 1 < words.length; i++) {
      const a = words[i];
      const b = words[i + 1];
      const j = [...Array(Math.min(a.length, b.length)).keys()].find((k) => a[k] !== b[k]);
      if (j !== undefined && !allArrows.some(([x, y]) => x === id(a[j]) && y === id(b[j]))) allArrows.push([id(a[j]), id(b[j])]);
    }
    const layout = ringLayout(letters.length, allArrows);
    const arrows: number[][] = [];
    const arrowTones: Record<string, EdgeTone> = {};
    let queue: string[] = [];
    let head = 0;
    let order = "";

    const wordsView = (i: number | null): ArrayView => ({
      name: "words",
      values: words,
      pointers: i === null ? {} : pointersAt(words.length, { a: i, b: i + 1 }, { b: "tertiary" }),
    });
    const lettersView = (name: string, word: string, j: number | null, tone: CellTone): ArrayView => ({
      name,
      values: word.split(""),
      tones: j === null ? {} : { [j]: tone },
    });
    const picture = (current: string | null) => {
      const tones: Record<number, CellTone> = {};
      for (const ch of order) tones[id(ch)] = "done";
      queue.slice(head).forEach((ch) => (tones[id(ch)] = "tertiary"));
      if (current) tones[id(current)] = "primary";
      return graphView("letters (arrow: comes before)", layout, arrows, {
        directed: true,
        labels: Object.fromEntries(letters.map((ch, k) => [k, ch])),
        tones,
        captions: Object.fromEntries(letters.map((ch, k) => [k, order.includes(ch) ? "placed" : `waits ${indegree.get(ch)}`])),
        edgeTones: arrowTones,
      });
    };

    r.step(
      lineOf(code, "indegree.set(ch, 0)"),
      `Each of the ${letters.length} letters is a vertex. The words are sorted in the alien alphabet, so each **neighbouring pair** of words can tell us which of two letters comes first.`,
      { graphs: [picture(null)], arrays: [wordsView(null)] }
    );

    for (let i = 0; i + 1 < words.length; i++) {
      const a = words[i];
      const b = words[i + 1];
      if (a.length > b.length && a.startsWith(b)) {
        r.step(
          lineOf(code, `if (a.length > b.length && a.startsWith(b)) return ""`),
          `"${a}" comes before "${b}", but "${b}" is the start of "${a}" — a shorter prefix always sorts first in **any** alphabet. The list can't be sorted: return "".`,
          { graphs: [picture(null)], arrays: [wordsView(i), lettersView("a", a, null, "primary"), lettersView("b", b, null, "tertiary")], done: true }
        );
        return r.frames;
      }
      let j = 0;
      while (j < Math.min(a.length, b.length) && a[j] === b[j]) j++;
      if (j === Math.min(a.length, b.length)) {
        r.step(
          lineOf(code, "for (let j = 0; j < Math.min(a.length, b.length); j++)"),
          `"${a}" and "${b}" agree letter for letter as far as the shorter one goes, so this pair tells us nothing.`,
          { graphs: [picture(null)], arrays: [wordsView(i), lettersView("a", a, null, "primary"), lettersView("b", b, null, "tertiary")] }
        );
        continue;
      }
      const x = a[j];
      const y = b[j];
      const known = next.get(x)!.has(y);
      if (!known) {
        next.get(x)!.add(y);
        indegree.set(y, indegree.get(y)! + 1);
        arrows.push([id(x), id(y)]);
      }
      arrowTones[`${id(x)}>${id(y)}`] = "active";
      r.step(
        lineOf(code, "next.get(a[j]).add(b[j])"),
        `"${a}" before "${b}": they first differ at position ${j}, **${x}** vs **${y}**. So in this alphabet ${x} comes before ${y}${known ? " — we already knew that" : ": add the arrow"}. Letters after the first difference tell us nothing.`,
        { graphs: [picture(null)], arrays: [wordsView(i), lettersView("a", a, j, "primary"), lettersView("b", b, j, "tertiary")], vars: { i, j } }
      );
      delete arrowTones[`${id(x)}>${id(y)}`];
    }

    queue = letters.filter((ch) => indegree.get(ch) === 0);
    r.step(
      lineOf(code, "const queue = "),
      queue.length
        ? `Now it's Course Schedule with letters: a letter with no arrows coming in (${queue.join(", ")}) can go first.`
        : `Every letter has an arrow coming in, so no letter can go first.`,
      { graphs: [picture(null)], arrays: [{ name: "queue (ready)", values: [...queue] }] }
    );
    while (head < queue.length) {
      const ch = queue[head++];
      order += ch;
      for (const after of next.get(ch)!) {
        indegree.set(after, indegree.get(after)! - 1);
        arrowTones[`${id(ch)}>${id(after)}`] = "done";
        if (indegree.get(after) === 0) queue.push(after);
      }
      const freed = [...next.get(ch)!].filter((after) => indegree.get(after) === 0);
      r.step(
        lineOf(code, "order += ch"),
        `Place **${ch}**.${next.get(ch)!.size ? ` Its arrows to ${[...next.get(ch)!].join(", ")} are used up${freed.length ? `; ${freed.join(", ")} now ${freed.length === 1 ? "has" : "have"} nothing left to wait for` : ""}.` : ""}`,
        { graphs: [picture(ch)], arrays: [{ name: "queue (ready)", values: queue.slice(head) }, { name: "order", values: order.split("") }] }
      );
    }
    const ok = order.length === letters.length;
    r.step(
      lineOf(code, "return order.length === next.size"),
      ok
        ? `Every letter was placed: the alphabet is **"${order}"**. Building the graph reads every letter once; the sort is **O(V + E)**.`
        : `Only ${order.length} of ${letters.length} letters could be placed: the rest wait on each other in a **cycle**, so the words contradict themselves. Return "".`,
      { graphs: [picture(null)], arrays: [{ name: "order", values: order.split("") }], done: true }
    );
    return r.frames;
  },
};

export default program;
