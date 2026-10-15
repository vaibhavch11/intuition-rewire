import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function reverseString(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    [s[left], s[right]] = [s[right], s[left]];   // swap the two ends
    left++;                                      // then move both inwards
    right--;
  }
}`;

const program: Program = {
  title: "Reverse a string in place (two pointers)",
  code,
  fields: [{ key: "s", label: "s (as an array of characters)", kind: "text", maxLength: 12, hint: "letters, like hello" }],
  examples: [
    { label: "Example", input: { s: "hello" } },
    { label: "Even length", input: { s: "Hannah" } },
    { label: "One character", input: { s: "x" } },
  ],
  check: (input) => (/^[A-Za-z0-9]+$/.test(input.s as string) ? null : "s: use letters and digits only, like hello."),
  run(input) {
    const s = [...(input.s as string)];
    const n = s.length;
    const r = recorder();
    let left = 0;
    let right = n - 1;

    const frame = (swapped = false) => {
      const tones: Record<number, CellTone> = {};
      for (let k = 0; k < n; k++) if (k < left || k > right) tones[k] = "done";
      if (left < right) {
        tones[left] = swapped ? "write" : "primary";
        tones[right] = swapped ? "write" : "tertiary";
      } else if (left === right) tones[left] = "done";
      return {
        arrays: [{ name: "s", values: s, tones, pointers: pointersAt(n, { left, right }, { right: "tertiary" }) }],
        vars: { left, right },
      };
    };

    r.step(
      lineOf(code, "let left = 0"),
      `Put one pointer at each end. Each swap fixes **two** characters at once, so the pointers meet in the middle after n / 2 swaps — and no second array is needed.`,
      frame()
    );
    while (left < right) {
      const a = s[left];
      const b = s[right];
      [s[left], s[right]] = [s[right], s[left]];
      r.step(lineOf(code, "[s[left], s[right]]"), `Swap '${a}' at ${left} with '${b}' at ${right}. Both are now in their final places.`, frame(true));
      left++;
      right--;
      r.step(
        lineOf(code, "left++"),
        left < right ? `Move both pointers one step inwards: left = ${left}, right = ${right}.` : left === right ? `The pointers meet at ${left}: the middle character stays where it is.` : `The pointers have crossed: every pair is swapped.`,
        frame()
      );
    }
    r.step(code.split("\n").length, `Done: **"${s.join("")}"**. ${Math.floor(n / 2)} swap${Math.floor(n / 2) === 1 ? "" : "s"} for ${n} character${n === 1 ? "" : "s"}: **O(n) time, O(1) extra space**.`, { ...frame(), done: true });
    return r.frames;
  },
};

export default program;
