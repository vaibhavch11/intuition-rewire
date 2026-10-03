import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum < 0) {
        left++;
      } else if (sum > 0) {
        right--;
      } else {
        result.push([nums[i], nums[left], nums[right]]);
        left++;
        right--;
        while (left < right && nums[left] === nums[left - 1]) left++;
      }
    }
  }
  return result;
}`;

const show = (t: number[]) => `${t[0]}, ${t[1]}, ${t[2]}`;

const program: Program = {
  title: "3Sum (sort + two pointers)",
  code,
  fields: [{ key: "nums", label: "nums", kind: "array", maxLength: 9, min: -20, max: 20 }],
  examples: [
    { label: "Example", input: { nums: [-1, 0, 1, 2, -1, -4] } },
    { label: "Two answers", input: { nums: [-2, 0, 1, 1, 2] } },
    { label: "All zeros", input: { nums: [0, 0, 0, 0] } },
    { label: "No answer", input: { nums: [0, 1, 1] } },
  ],
  check(input) {
    return (input.nums as number[]).length < 3 ? "Enter at least three numbers." : null;
  },
  run(input) {
    const nums = [...(input.nums as number[])].sort((a, b) => a - b);
    const n = nums.length;
    const r = recorder();
    const result: number[][] = [];
    const resultView = (fresh = false) => ({
      name: "result",
      values: result.map(show),
      tones: fresh ? { [result.length - 1]: "write" as CellTone } : {},
    });

    r.step(
      2,
      `Sort first: **[${nums.join(", ")}]**. Now equal values sit side by side (easy to skip), and we can move two pointers toward each other.`,
      { arrays: [{ name: "nums", values: nums }, resultView()], vars: {} }
    );

    for (let i = 0; i < n - 2; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) {
        r.step(5, `nums[${i}] = ${nums[i]} is the same as the value before it. Every triplet starting with ${nums[i]} was already found, so **skip** it to avoid duplicates.`, {
          arrays: [{ name: "nums", values: nums, tones: { ...toneRange(0, i - 1, "muted"), [i]: "muted" }, pointers: pointersAt(n, { i }) }, resultView()],
          vars: { i },
        });
        continue;
      }
      let left = i + 1;
      let right = n - 1;
      const view = (tones: Record<number, CellTone> = {}) => ({
        name: "nums",
        values: nums,
        tones: { ...toneRange(0, i - 1, "muted"), [i]: "primary" as CellTone, ...tones },
        pointers: pointersAt(n, { i, left, right }, { left: "tertiary", right: "secondary" }),
      });
      r.step(
        6,
        `Fix **nums[${i}] = ${nums[i]}**. Now we need two numbers to its right that add up to **${-nums[i]}** — that's Two Sum on a sorted range, so use two pointers.`,
        { arrays: [view(), resultView()], vars: { i, need: -nums[i] } }
      );

      while (left < right) {
        const sum = nums[i] + nums[left] + nums[right];
        const pair = { [left]: "tertiary" as CellTone, [right]: "tertiary" as CellTone };
        if (sum < 0) {
          r.step(10, `${nums[i]} + ${nums[left]} + ${nums[right]} = **${sum}**, too small. The only way to grow the sum is a bigger left number: \`left++\`.`, {
            arrays: [view(pair), resultView()],
            vars: { i, left, right, sum },
          });
          left++;
        } else if (sum > 0) {
          r.step(12, `${nums[i]} + ${nums[left]} + ${nums[right]} = **${sum}**, too big. The only way to shrink it is a smaller right number: \`right--\`.`, {
            arrays: [view(pair), resultView()],
            vars: { i, left, right, sum },
          });
          right--;
        } else {
          result.push([nums[i], nums[left], nums[right]]);
          r.step(14, `${nums[i]} + ${nums[left]} + ${nums[right]} = **0**. Record **[${show(result[result.length - 1])}]**, then move both pointers inward.`, {
            arrays: [view({ [i]: "success", [left]: "success", [right]: "success" }), resultView(true)],
            vars: { i, left, right, sum },
          });
          left++;
          right--;
          let skipped = 0;
          while (left < right && nums[left] === nums[left - 1]) {
            left++;
            skipped++;
          }
          if (skipped > 0) {
            r.step(17, `The next left value repeats ${nums[left - 1]}, which would rebuild the same triplet. Skip ${skipped === 1 ? "it" : `all ${skipped} copies`}.`, {
              arrays: [view(), resultView()],
              vars: { i, left, right },
            });
          }
        }
      }
    }

    r.step(
      21,
      result.length
        ? `Found **${result.length}** unique triplet${result.length === 1 ? "" : "s"}. Sorting is O(n log n), and each fixed i scans the rest once: **O(n²) time**, no hash set needed.`
        : `No three numbers add up to 0. Sorting is O(n log n), and each fixed i scans the rest once: **O(n²) time**.`,
      {
        arrays: [
          { name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") },
          { name: "result", values: result.map(show), tones: Object.fromEntries(result.map((_, k) => [k, "success" as CellTone])) },
        ],
        vars: { triplets: result.length },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
