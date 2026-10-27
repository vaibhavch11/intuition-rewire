import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function isPowerOfTwo(n) {
  if (n === 1) return true;                    // 2^0
  if (n < 1 || n % 2 !== 0) return false;      // zero, negative, or odd: no
  return isPowerOfTwo(n / 2);                  // n is a power of two iff its half is
}`;

const program: Program = {
  title: "Power of two, by halving",
  code,
  fields: [{ key: "n", label: "n", kind: "number", min: -99, max: 9999 }],
  examples: [
    { label: "16", input: { n: 16 } },
    { label: "12", input: { n: 12 } },
    { label: "1024", input: { n: 1024 } },
  ],
  run(input) {
    const start = input.n as number;
    const r = recorder();
    const frames: string[] = [];
    const view = (tone: CellTone = "primary") => ({ stacks: [{ name: "call stack", values: [...frames], tones: { [frames.length - 1]: tone } }] });

    let n = start;
    let answer: boolean;
    for (;;) {
      frames.push(`isPowerOfTwo(${n})`);
      if (n === 1) {
        answer = true;
        r.step(lineOf(code, "if (n === 1) return true;"), `**isPowerOfTwo(1)**: 1 is 2⁰ — the base case returns true.`, { ...view("success"), vars: { n, depth: frames.length } });
        break;
      }
      if (n < 1 || n % 2 !== 0) {
        answer = false;
        r.step(lineOf(code, "if (n < 1 || n % 2 !== 0) return false;"), `**isPowerOfTwo(${n})**: ${n < 1 ? `${n} is less than 1` : `${n} is odd and not 1`}, so it can't be a power of two. Return false.`, { ...view("tertiary"), vars: { n, depth: frames.length } });
        break;
      }
      r.step(lineOf(code, "return isPowerOfTwo(n / 2);"), `**isPowerOfTwo(${n})**: ${n} is even, so it's a power of two exactly when ${n / 2} is. Ask about ${n / 2}.`, { ...view(), vars: { n, depth: frames.length } });
      n /= 2;
    }
    const depth = frames.length;
    r.step(lineOf(code, "return isPowerOfTwo(n / 2);"), `The answer passes back up through every waiting call unchanged: ${start} → **${answer}**. ${depth} call${depth === 1 ? "" : "s"} — about log₂ n — so O(log n) time and stack space.`, {
      stacks: [{ name: "call stack", values: [...frames], tones: Object.fromEntries(frames.map((_, i) => [i, answer ? "success" : "tertiary"])) as Record<number, CellTone> }],
      vars: { n: start, answer: String(answer) },
      done: true,
    });
    return r.frames;
  },
};

export default program;
