import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Pointer, type Program } from "../types";

const code = `function ladderLength(beginWord, endWord, wordList) {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;        // the ladder must end on a real word
  const queue = [beginWord];
  const steps = new Map([[beginWord, 1]]);  // word -> words in the shortest ladder to it
  let head = 0;
  while (head < queue.length) {
    const word = queue[head++];
    if (word === endWord) return steps.get(word);   // first arrival = shortest ladder
    for (let i = 0; i < word.length; i++) {
      for (let k = 0; k < 26; k++) {        // try every letter in every position
        const next = word.slice(0, i) + String.fromCharCode(97 + k) + word.slice(i + 1);
        if (words.has(next) && !steps.has(next)) {   // a real word, not reached yet
          steps.set(next, steps.get(word) + 1);
          queue.push(next);
        }
      }
    }
  }
  return 0;                                 // endWord can't be reached
}`;

const parseWords = (text: string) => text.split(/[\s,]+/).filter(Boolean);
const oneApart = (a: string, b: string) => a.length === b.length && [...a].filter((ch, i) => ch !== b[i]).length === 1;

const program: Program = {
  title: "Word ladder (BFS over words)",
  code,
  fields: [
    { key: "beginWord", label: "beginWord", kind: "text", maxLength: 4, hint: "a lowercase word, like hit" },
    { key: "endWord", label: "endWord", kind: "text", maxLength: 4, hint: "a lowercase word, like cog" },
    { key: "wordList", label: "wordList", kind: "text", maxLength: 48, hint: "lowercase words separated by spaces, like hot dot dog lot log cog" },
  ],
  examples: [
    { label: "Example", input: { beginWord: "hit", endWord: "cog", wordList: "hot dot dog lot log cog" } },
    { label: "End not in list", input: { beginWord: "hit", endWord: "cog", wordList: "hot dot dog lot log" } },
    { label: "Two routes", input: { beginWord: "cat", endWord: "dog", wordList: "cot cog dot dog cag" } },
  ],
  check: (input) => {
    const begin = input.beginWord as string;
    const end = input.endWord as string;
    const list = parseWords(input.wordList as string);
    const all = [begin, end, ...list];
    if (all.some((w) => !/^[a-z]{1,4}$/.test(w))) return "Use lowercase words of 1 to 4 letters.";
    if (all.some((w) => w.length !== begin.length)) return "Every word must have the same length as beginWord.";
    if (list.length < 1 || list.length > 8) return "Give between 1 and 8 words in wordList.";
    if (begin === end) return "beginWord and endWord must differ.";
    return null;
  },
  run(input) {
    const beginWord = input.beginWord as string;
    const endWord = input.endWord as string;
    const wordList = parseWords(input.wordList as string);
    const words = new Set(wordList);
    const vertices = [...new Set([beginWord, ...wordList])];
    const id = (w: string) => vertices.indexOf(w);
    const links: number[][] = [];
    vertices.forEach((a, i) => vertices.forEach((b, j) => j > i && oneApart(a, b) && links.push([i, j])));
    const layout = ringLayout(vertices.length, links);
    const r = recorder();
    const queue: string[] = [beginWord];
    const steps = new Map<string, number>([[beginWord, 1]]);
    const cameFrom = new Map<string, string>();
    let head = 0;
    let ladder: string[] = [];

    const frame = (current: string | null, hot: [string, string] | null = null, vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      steps.forEach((_, w) => (tones[id(w)] = "done"));
      queue.slice(head).forEach((w) => (tones[id(w)] = "tertiary"));
      ladder.forEach((w) => (tones[id(w)] = "success"));
      if (current) tones[id(current)] = "primary";
      const edgeTones: Record<string, EdgeTone> = {};
      cameFrom.forEach((from, w) => (edgeTones[edgeKey(id(from), id(w))] = "done"));
      ladder.forEach((w, i) => i > 0 && (edgeTones[edgeKey(id(ladder[i - 1]), id(w))] = "write"));
      if (hot) edgeTones[edgeKey(id(hot[0]), id(hot[1]))] = "active";
      const pointers: Record<number, Pointer[]> = { [id(beginWord)]: [{ label: "begin", tone: "secondary" }] };
      if (vertices.includes(endWord)) (pointers[id(endWord)] ??= []).push({ label: "end", tone: "tertiary" });
      return {
        graphs: [
          graphView("words (a line joins words one letter apart)", layout, links, {
            labels: Object.fromEntries(vertices.map((w, i) => [i, w])),
            tones,
            pointers,
            captions: Object.fromEntries([...steps].map(([w, s]) => [id(w), `${s}`])),
            edgeTones,
          }),
        ],
        arrays: [{ name: "queue (front → back)", values: queue.slice(head) }],
        vars,
      };
    };

    if (!words.has(endWord)) {
      r.step(lineOf(code, "if (!words.has(endWord)) return 0"), `"${endWord}" isn't in the word list, and every word on the ladder must be. No ladder can exist: **0**.`, { ...frame(null), done: true });
      return r.frames;
    }
    r.step(
      lineOf(code, "const steps = new Map"),
      `Each word is a vertex, joined to the words one letter away. Every change costs one step, so **BFS** finds the shortest ladder. The number under a word counts the words on the shortest ladder to it; "${beginWord}" alone is 1.`,
      frame(null)
    );

    while (head < queue.length) {
      const word = queue[head++];
      if (word === endWord) {
        ladder = [word];
        while (cameFrom.has(ladder[0])) ladder.unshift(cameFrom.get(ladder[0])!);
        r.step(
          lineOf(code, "if (word === endWord) return steps.get(word)"),
          `"${endWord}" comes out of the queue: BFS reaches words in order of distance, so this is the shortest ladder — **${steps.get(word)}** words: ${ladder.join(" → ")}.`,
          { ...frame(null), done: true }
        );
        return r.frames;
      }
      let found = 0;
      for (let i = 0; i < word.length; i++) {
        for (let k = 0; k < 26; k++) {
          const next = word.slice(0, i) + String.fromCharCode(97 + k) + word.slice(i + 1);
          if (words.has(next) && !steps.has(next)) {
            steps.set(next, steps.get(word)! + 1);
            cameFrom.set(next, word);
            queue.push(next);
            found++;
            r.step(
              lineOf(code, "steps.set(next, steps.get(word) + 1)"),
              `Change letter ${i + 1} of "${word}" to "${next[i]}": **"${next}"** is in the list and new. Its shortest ladder has ${steps.get(next)} words. Queue it.`,
              frame(word, [word, next], { word, next })
            );
          }
        }
      }
      if (found === 0) {
        r.step(lineOf(code, "for (let i = 0; i < word.length; i++)"), `Try all 26 letters in each of the ${word.length} positions of "${word}": no new word from the list.`, frame(word, null, { word }));
      }
    }
    r.step(lineOf(code, "endWord can't be reached"), `The queue is empty and "${endWord}" was never reached: no ladder exists. The answer is **0**.`, { ...frame(null), done: true });
    return r.frames;
  },
};

export default program;
