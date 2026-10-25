import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function largestNumber(nums) {
  const strs = nums.map(String);
  strs.sort((a, b) => (b + a > a + b ? 1 : b + a < a + b ? -1 : 0));   // a first if a+b is the bigger number
  if (strs[0] === "0") return "0";                                     // every value was 0
  return strs.join("");
}`;

const program: Program = {
  title: "Largest number (sort with a concatenation comparator)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 6, min: 0, max: 999 }],
  examples: [
    { label: "Example", input: { nums: [3, 30, 34, 5, 9] } },
    { label: "Two values", input: { nums: [10, 2] } },
    { label: "Zeros", input: { nums: [0, 0] } },
  ],
  run(input) {
    const strs = (input.nums as number[]).map(String);
    const n = strs.length;
    const r = recorder();
    const view = (sortedTo: number, tones: Record<number, CellTone> = {}, marks: Record<string, number> = {}) => ({
      arrays: [{ name: "strs", values: [...strs], tones: { ...toneRange(0, sortedTo - 1, "done"), ...tones }, pointers: pointersAt(n, marks) }],
    });

    r.step(lineOf(code, "const strs = nums.map(String);"), `Plain numeric order is wrong here: 9 must come before 30 even though 9 < 30. Compare two values by **gluing them both ways**: if "a"+"b" is bigger than "b"+"a", a goes first. The sort below is shown as an insertion sort, one comparison at a time.`, view(1));
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0) {
        const a = strs[j - 1];
        const b = strs[j];
        const swap = b + a > a + b;
        r.step(
          lineOf(code, "strs.sort("),
          swap ? `"${b}"+"${a}" = ${b + a} beats "${a}"+"${b}" = ${a + b}: **${b}** goes first.` : `"${a}"+"${b}" = ${a + b} is at least "${b}"+"${a}" = ${b + a}: keep ${a} first.`,
          view(i + 1, { [j - 1]: swap ? "write" : "primary", [j]: swap ? "write" : "primary" }, { j })
        );
        if (!swap) break;
        [strs[j - 1], strs[j]] = [strs[j], strs[j - 1]];
        j--;
      }
    }
    if (strs[0] === "0") {
      r.step(lineOf(code, 'if (strs[0] === "0") return "0";'), `The biggest piece is "0", so every value is 0: the answer is **"0"**, not "${strs.join("")}".`, { ...view(n), done: true });
      return r.frames;
    }
    const out = strs.join("");
    r.step(lineOf(code, 'return strs.join("");'), `Join the pieces: **"${out}"**. Sorting n values with a comparator that builds strings of up to 2k digits costs **O(n log n · k)**.`, { arrays: [{ name: "strs", values: [...strs], tones: toneRange(0, n - 1, "success") }], done: true });
    return r.frames;
  },
};

export default program;
