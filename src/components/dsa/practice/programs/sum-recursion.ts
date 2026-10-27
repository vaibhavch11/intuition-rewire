import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function sumTo(n) {
  if (n === 0) return 0;            // base case
  return n + sumTo(n - 1);          // waits for sumTo(n - 1), then adds n
}`;

const program: Program = {
  title: "sumTo(n): frames on the call stack",
  code,
  fields: [{ key: "n", label: "n", kind: "number", min: 0, max: 7 }],
  examples: [
    { label: "sumTo(3)", input: { n: 3 } },
    { label: "sumTo(5)", input: { n: 5 } },
    { label: "sumTo(0)", input: { n: 0 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const frames: string[] = ["main"];
    let deepest = 1;
    const view = (tones: Record<number, CellTone> = {}) => ({
      stacks: [{ name: "call stack", values: [...frames], tones: { [frames.length - 1]: "primary" as CellTone, ...tones }, topLabel: "running" }],
    });

    const call = (k: number): number => {
      frames.push(`sumTo(${k})`);
      deepest = Math.max(deepest, frames.length);
      if (k === 0) {
        frames[frames.length - 1] = "sumTo(0) = 0";
        r.step(lineOf(code, "if (n === 0) return 0;"), `**sumTo(0)** is the base case: it returns 0 without calling anything. This is the deepest point — **${frames.length}** frames are on the stack at once.`, {
          ...view({ [frames.length - 1]: "success" }),
          vars: { n: k, frames: frames.length },
        });
        frames.pop();
        return 0;
      }
      frames[frames.length - 1] = `sumTo(${k}): ${k} + ?`;
      r.step(lineOf(code, "return n + sumTo(n - 1);"), `**sumTo(${k})** gets a new frame with its own n = ${k}. It needs sumTo(${k - 1}) before it can add, so it calls it and **waits**. Frames now: ${frames.length}.`, {
        ...view(),
        vars: { n: k, frames: frames.length },
      });
      const inner = call(k - 1);
      const result = k + inner;
      frames[frames.length - 1] = `sumTo(${k}) = ${result}`;
      r.step(lineOf(code, "return n + sumTo(n - 1);"), `sumTo(${k - 1}) returned ${inner} and its frame is gone. sumTo(${k}) wakes up, computes ${k} + ${inner} = **${result}** and returns it.`, {
        ...view({ [frames.length - 1]: "success" }),
        vars: { n: k, frames: frames.length },
      });
      frames.pop();
      return result;
    };

    r.step(1, `\`main\` calls **sumTo(${n})**. Every call that hasn't finished keeps a frame on the call stack.`, { ...view(), vars: { frames: 1 } });
    const answer = call(n);
    r.step(lineOf(code, "return n + sumTo(n - 1);"), `Back in main with the answer **${answer}**. ${n + 1} call${n ? "s" : ""}, and at most **${deepest}** frames alive at once (including main): the memory grows with the **depth**, O(n).`, {
      ...view(),
      vars: { answer, "most frames": deepest },
      done: true,
    });
    return r.frames;
  },
};

export default program;
