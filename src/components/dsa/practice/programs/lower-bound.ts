import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function lowerBound(nums, target) {
  let low = 0;
  let high = nums.length;                  // nums.length means "after everything"
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] < target) low = mid + 1;   // mid says no: the first yes is to the right
    else high = mid;                         // mid says yes: it might be the first one, keep it
  }
  return low;                              // the first index with nums[i] >= target
}`;

const program: Program = {
  title: "Lower bound (the first index with nums[i] >= target)",
  code,
  fields: [
    { key: "nums", label: "nums (sorted)", kind: "array", maxLength: 12, min: -99, max: 99 },
    { key: "target", label: "target", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Duplicates", input: { nums: [1, 3, 3, 3, 5, 8], target: 3 } },
    { label: "Missing value", input: { nums: [1, 3, 3, 3, 5, 8], target: 4 } },
    { label: "Bigger than all", input: { nums: [2, 4, 6, 8], target: 9 } },
  ],
  check(input) {
    const nums = input.nums as number[];
    for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return "nums must be sorted from smallest to largest.";
    return null;
  },
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n;
    // What each checked index answered to "is nums[i] >= target?".
    const answers: Scalar[] = nums.map(() => "");
    const answerTones: Record<number, CellTone> = {};
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [
        { name: "nums", values: nums, tones: { ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted"), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) },
        { name: `nums[i] >= ${target}?`, values: answers, tones: answerTones },
      ],
    });

    r.step(lineOf(code, "let high = nums.length;"), `Ask every index "is nums[i] >= ${target}?" — sorted, the answers go no, …, no, yes, …, yes. The **first yes** is the lower bound. It's somewhere in ${low}..${high}; ${n} would mean "after everything".`, {
      ...view({}, { low, high }),
      vars: { target, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const yes = nums[mid] >= target;
      answers[mid] = yes ? "yes" : "no";
      answerTones[mid] = yes ? "success" : "muted";
      r.step(lineOf(code, "const mid = low + "), `${high - low + 1} candidates left (${low}..${high}). Check **mid = ${mid}**: nums[${mid}] = ${nums[mid]}, ${yes ? `at least ${target}: yes` : `less than ${target}: no`}.`, {
        ...view({ [mid]: "primary" }, { low, mid, high }),
        vars: { target, low, mid, high },
      });
      if (!yes) {
        low = mid + 1;
        r.step(lineOf(code, "if (nums[mid] < target) low = mid + 1;"), `A no: the first yes is to the right of ${mid}, so \`low = ${low}\`.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      } else {
        high = mid;
        r.step(lineOf(code, "else high = mid;"), `A yes: index ${mid} might be the first one, so keep it — \`high = ${high}\`, not mid − 1.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      }
    }
    const tail =
      low === n
        ? `Every value is smaller than ${target}, so the answer is ${n}, "after everything" — where ${target} would be inserted.`
        : nums[low] === target
          ? `nums[${low}] = ${target}: that's where the ${target}s start.`
          : `${target} isn't in the array; ${low} is where it would be inserted to keep it sorted.`;
    r.step(lineOf(code, "return low;"), `\`low == high\`: one candidate left. The lower bound is **${low}**. ${tail} **O(log n)** checks.`, {
      arrays: [
        { name: "nums", values: nums, tones: low < n ? { [low]: "success" } : {}, pointers: pointersAt(n, { low }) },
        { name: `nums[i] >= ${target}?`, values: nums.map((v) => (v >= target ? "yes" : "no")), tones: Object.fromEntries(nums.map((v, i) => [i, v >= target ? (i === low ? "success" : "done") : "muted"])) as Record<number, CellTone> },
      ],
      vars: { target, low, high },
      done: true,
    });
    return r.frames;
  },
};

export default program;
