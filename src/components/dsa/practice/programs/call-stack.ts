import { recorder, type CellTone, type Program } from "../types";

const code = `function factorial(n) {
  if (n <= 1) return 1;            // base case: no more calls
  return n * factorial(n - 1);     // pauses here until the inner call returns
}

factorial(4);`;

const program: Program = {
  title: "The call stack (factorial)",
  code,
  fields: [{ key: "n", label: "n", kind: "number", min: 1, max: 7 }],
  examples: [
    { label: "factorial(4)", input: { n: 4 } },
    { label: "factorial(1)", input: { n: 1 } },
    { label: "factorial(6)", input: { n: 6 } },
  ],
  run(input) {
    const n = input.n as number;
    const r = recorder();
    const frames: string[] = ["main"];
    const label = (k: number) => `factorial(${k})`;

    const view = (tones: Record<number, CellTone> = {}) => ({
      stacks: [{ name: "call stack", values: frames, tones: { [frames.length - 1]: "primary" as CellTone, ...tones }, topLabel: "running" }],
    });

    r.step(6, `The program starts in \`main\`. It calls **factorial(${n})**, so a new **frame** — the call's own \`n\` and the spot to return to — is pushed on the call stack.`, {
      ...view(),
      vars: {},
    });

    // Going down: one frame per call.
    for (let k = n; k >= 1; k--) {
      frames.push(label(k));
      if (k > 1) {
        r.step(3, `**${label(k)}** runs with n = ${k}. It isn't the base case, so it calls **${label(k - 1)}** and **pauses** — its frame stays on the stack, waiting.`, {
          ...view(),
          vars: { n: k },
        });
      } else {
        r.step(2, `**${label(1)}** hits the base case: n ≤ 1, so it returns **1** without calling anything. ${n > 1 ? "Now the frames come off in reverse order." : ""}`, {
          ...view({ [frames.length - 1]: "success" }),
          vars: { n: 1, returns: 1 },
        });
      }
    }

    // Coming back up: each frame finishes and is popped.
    let value = 1;
    frames.pop();
    for (let k = 2; k <= n; k++) {
      const result = k * value;
      r.step(3, `${label(k - 1)} returned ${value}, and its frame was popped. **${label(k)}** resumes where it paused: ${k} × ${value} = **${result}**.`, {
        ...view({ [frames.length - 1]: "success" }),
        vars: { n: k, returns: result },
      });
      value = result;
      frames.pop();
    }

    r.step(6, `Every frame was popped in the reverse order it was pushed — last called, first finished. **factorial(${n}) = ${value}**. If the base case were missing, frames would pile up until the call stack ran out of room: a **stack overflow**.`, {
      ...view(),
      vars: { result: value },
      done: true,
    });
    return r.frames;
  },
};

export default program;
