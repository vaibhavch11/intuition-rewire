import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function previousSmaller(nums) {
  const ans = new Array(nums.length).fill(-1);
  const stack = [];               // increasing from bottom to top
  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && stack[stack.length - 1] >= nums[i]) {
      stack.pop();                // nums[i] hides it from everyone to the right
    }
    if (stack.length > 0) ans[i] = stack[stack.length - 1];
    stack.push(nums[i]);
  }
  return ans;
}`;

const program: Program = {
  title: "Previous smaller element (monotonic stack)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 9, min: 0, max: 99 }],
  examples: [
    { label: "Example", input: { nums: [4, 5, 2, 10, 8] } },
    { label: "Ups and downs", input: { nums: [3, 1, 4, 1, 5, 9, 2, 6] } },
    { label: "Increasing", input: { nums: [1, 2, 3, 4] } },
  ],
  run(input) {
    const nums = input.nums as number[];
    const n = nums.length;
    const r = recorder();
    const ans: (number | null)[] = new Array(n).fill(null);
    const stack: number[] = [];
    let pushes = 0;
    let pops = 0;

    const view = (i: number | undefined, tones: Record<number, CellTone> = {}, stackTones: Record<number, CellTone> = {}, ansTones: Record<number, CellTone> = {}) => ({
      arrays: [
        { name: "nums", values: nums, chart: true, tones, pointers: pointersAt(n, { i }) },
        { name: "ans", values: ans, tones: ansTones },
      ],
      stacks: [{ name: "stack", values: stack, tones: stackTones }],
    });

    r.step(3, `For each number, find the **nearest smaller number to its left**. The stack keeps only the candidates that could still be someone's answer — and they are always **increasing** from bottom to top.`, {
      ...view(undefined),
      vars: {},
    });

    for (let i = 0; i < n; i++) {
      const x = nums[i];
      while (stack.length > 0 && stack[stack.length - 1] >= x) {
        const y = stack.pop()!;
        pops++;
        r.step(6, `Top ${y} ≥ ${x}. For anyone to the right, ${x} is both closer and no bigger than ${y}, so ${y} can **never** be an answer again: pop it.`, {
          ...view(i, { [i]: "primary" }),
          vars: { i, "nums[i]": x, popped: y },
        });
      }
      if (stack.length > 0) {
        ans[i] = stack[stack.length - 1];
        r.step(8, `The top, **${ans[i]}**, is smaller than ${x} — it is ${x}'s previous smaller element.`, {
          ...view(i, { [i]: "primary" }, { [stack.length - 1]: "success" }, { [i]: "write" }),
          vars: { i, "nums[i]": x, "ans[i]": ans[i] },
        });
      } else {
        ans[i] = -1;
        r.step(8, `The stack is empty: nothing to the left is smaller than ${x}. ans[${i}] = **-1**.`, {
          ...view(i, { [i]: "primary" }, {}, { [i]: "write" }),
          vars: { i, "nums[i]": x, "ans[i]": -1 },
        });
      }
      stack.push(x);
      pushes++;
      r.step(9, `Push ${x}: it is a candidate for the numbers still to come.`, {
        ...view(i, { [i]: "primary" }, { [stack.length - 1]: "write" }),
        vars: { i, pushes, pops },
      });
    }

    r.step(11, `Done: **[${ans.join(", ")}]**. ${pushes} pushes and ${pops} pops — each number is pushed once and popped at most once, so the whole scan is **O(n)**, not O(n²).`, {
      ...view(undefined, {}, {}, Object.fromEntries(ans.map((_, k) => [k, "success" as CellTone]))),
      vars: { pushes, pops },
      done: true,
    });
    return r.frames;
  },
};

export default program;
