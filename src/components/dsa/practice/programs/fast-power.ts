import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function myPow(x, n) {
  if (n < 0) return 1 / myPow(x, -n);     // x^-n = 1 / x^n
  if (n === 0) return 1;                  // base case
  const half = myPow(x, Math.floor(n / 2));   // one call, not two
  return n % 2 === 0 ? half * half : half * half * x;
}`;

/** Short decimal form of a power, e.g. 0.0009765625 or 1024. */
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(8))));

const program: Program = {
  title: "Pow(x, n): fast power by halving the exponent",
  code,
  fields: [
    { key: "x", label: "x", kind: "number", min: -9, max: 9 },
    { key: "n", label: "n", kind: "number", min: -16, max: 16 },
  ],
  examples: [
    { label: "2^10", input: { x: 2, n: 10 } },
    { label: "3^13", input: { x: 3, n: 13 } },
    { label: "2^-3", input: { x: 2, n: -3 } },
  ],
  check: (input) => ((input.x as number) === 0 && (input.n as number) < 0 ? "0 to a negative power is undefined." : null),
  run(input) {
    const x = input.x as number;
    const n0 = input.n as number;
    const r = recorder();
    const frames: string[] = [];
    const view = (tones: Record<number, CellTone> = {}) => ({
      stacks: [{ name: "call stack", values: [...frames], tones: { [frames.length - 1]: "primary" as CellTone, ...tones } }],
    });
    let calls = 0;

    const pow = (k: number): number => {
      frames.push(`myPow(${x}, ${k})`);
      calls++;
      if (k < 0) {
        r.step(lineOf(code, "if (n < 0) return 1 / myPow(x, -n);"), `**myPow(${x}, ${k})**: a negative exponent. ${x}^${k} = 1 / ${x}^${-k}, so compute the positive power first.`, { ...view(), vars: { x, n: k, calls } });
        const v = 1 / pow(-k);
        frames[frames.length - 1] = `myPow(${x}, ${k}) = ${fmt(v)}`;
        r.step(lineOf(code, "if (n < 0) return 1 / myPow(x, -n);"), `1 / ${fmt(1 / v)} = **${fmt(v)}**.`, { ...view({ [frames.length - 1]: "success" }), vars: { x, n: k, calls } });
        frames.pop();
        return v;
      }
      if (k === 0) {
        frames[frames.length - 1] = `myPow(${x}, 0) = 1`;
        r.step(lineOf(code, "if (n === 0) return 1;"), `**myPow(${x}, 0)** is the base case: anything to the power 0 is 1.`, { ...view({ [frames.length - 1]: "success" }), vars: { x, n: 0, calls } });
        frames.pop();
        return 1;
      }
      const h = Math.floor(k / 2);
      r.step(lineOf(code, "const half = myPow(x, Math.floor(n / 2));"), `**myPow(${x}, ${k})** needs ${x}^${h} first — **one** call with the exponent halved. It waits.`, { ...view(), vars: { x, n: k, calls } });
      const half = pow(h);
      const v = k % 2 === 0 ? half * half : half * half * x;
      frames[frames.length - 1] = `myPow(${x}, ${k}) = ${fmt(v)}`;
      r.step(lineOf(code, "return n % 2 === 0 ? half * half : half * half * x;"), `half = ${fmt(half)}. ${k} is ${k % 2 === 0 ? `even: ${fmt(half)} × ${fmt(half)}` : `odd: ${fmt(half)} × ${fmt(half)} × ${x}`} = **${fmt(v)}**.`, {
        ...view({ [frames.length - 1]: "success" }),
        vars: { x, n: k, half: fmt(half), calls },
      });
      frames.pop();
      return v;
    };

    const answer = pow(n0);
    r.step(lineOf(code, "return n % 2 === 0 ? half * half : half * half * x;"), `${x}^${n0} = **${fmt(answer)}** in ${calls} call${calls === 1 ? "" : "s"} instead of ${Math.abs(n0)} multiplications: the exponent halves each time, so **O(log n)** time and stack.`, {
      stacks: [{ name: "call stack", values: [] }],
      vars: { x, n: n0, answer: fmt(answer), calls },
      done: true,
    });
    return r.frames;
  },
};

export default program;
