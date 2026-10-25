import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function countingSort(nums) {
  if (nums.length === 0) return nums;
  const max = Math.max(...nums);
  const count = new Array(max + 1).fill(0);
  for (const x of nums) count[x]++;               // how many times each value appears
  let k = 0;
  for (let v = 0; v <= max; v++) {
    while (count[v]-- > 0) nums[k++] = v;          // write each value back, count times
  }
  return nums;
}`;

const program: Program = {
  title: "Counting sort",
  code,
  fields: [{ key: "nums", label: "nums (0 to 9)", kind: "array", maxLength: 10, min: 0, max: 9 }],
  examples: [
    { label: "Example", input: { nums: [4, 2, 2, 8, 3, 3, 1] } },
    { label: "Many repeats", input: { nums: [1, 0, 1, 2, 0, 1, 2] } },
  ],
  run(input) {
    const nums = [...(input.nums as number[])];
    const n = nums.length;
    const r = recorder();
    const max = Math.max(...nums);
    const count = new Array(max + 1).fill(0);

    const frame = (numsTones = {}, countTones = {}, marks: Record<string, number> = {}, countMarks: Record<string, number> = {}) => ({
      arrays: [
        { name: "nums", values: [...nums], tones: numsTones, pointers: pointersAt(n, marks) },
        { name: "count (index = value)", values: [...count], tones: countTones, pointers: pointersAt(max + 1, countMarks, { v: "tertiary" }) },
      ],
    });

    r.step(lineOf(code, "const count = new Array(max + 1).fill(0);"), `Counting sort never compares two values. The largest value is ${max}, so make a **count** slot for every value from 0 to ${max}.`, frame());
    nums.forEach((x, i) => {
      count[x]++;
      r.step(lineOf(code, "for (const x of nums) count[x]++;"), `nums[${i}] = ${x}: add one to count[${x}].`, frame({ [i]: "primary" }, { [x]: "write" }, { i }));
    });
    let k = 0;
    r.step(lineOf(code, "let k = 0;"), `The counts say how many of each value there are. Now overwrite nums from the left, smallest value first.`, frame({}, {}, { k }));
    for (let v = 0; v <= max; v++) {
      if (count[v] === 0) continue;
      const times = count[v];
      const from = k;
      for (let t = 0; t < times; t++) nums[k++] = v;
      count[v] = 0;
      r.step(lineOf(code, "while (count[v]-- > 0) nums[k++] = v;"), `count[${v}] = ${times}: write ${v} ${times === 1 ? "once" : `${times} times`}.`, frame({ ...toneRange(0, from - 1, "done"), ...toneRange(from, k - 1, "write") }, { [v]: "tertiary" }, k < n ? { k } : {}, { v }));
    }
    r.step(lineOf(code, "return nums;"), `Sorted: **[${nums.join(", ")}]**. One pass to count and one pass over the ${max + 1} slots: **O(n + k)** time and **O(k)** space, where k is the largest value. Fast when k is small; useless for values up to a billion.`, { ...frame(toneRange(0, n - 1, "success")), done: true });
    return r.frames;
  },
};

export default program;
