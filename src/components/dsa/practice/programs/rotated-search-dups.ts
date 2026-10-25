import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function search(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return true;
    if (nums[low] === nums[mid] && nums[mid] === nums[high]) {        // can't tell which half is sorted
      low++;
      high--;
    } else if (nums[low] <= nums[mid]) {                               // the left half is sorted
      if (nums[low] <= target && target < nums[mid]) high = mid - 1;
      else low = mid + 1;
    } else {                                                           // the right half is sorted
      if (nums[mid] < target && target <= nums[high]) low = mid + 1;
      else high = mid - 1;
    }
  }
  return false;
}`;

/** Is the array a rotation of a non-decreasing one? */
function isRotated(a: number[]) {
  let drops = 0;
  for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) drops++;
  return drops === 0 || (drops === 1 && a[a.length - 1] <= a[0]);
}

const program: Program = {
  title: "Search in rotated sorted array II (duplicates)",
  code,
  fields: [
    { key: "nums", label: "nums (a rotated sorted array)", kind: "array", maxLength: 12, min: -99, max: 99 },
    { key: "target", label: "target", kind: "number", min: -99, max: 99 },
  ],
  examples: [
    { label: "Tie at both ends", input: { nums: [1, 0, 1, 1, 1], target: 0 } },
    { label: "Example", input: { nums: [2, 5, 6, 0, 0, 1, 2], target: 0 } },
    { label: "Not there", input: { nums: [2, 5, 6, 0, 0, 1, 2], target: 3 } },
  ],
  check: (input) => ((input.nums as number[]).length && isRotated(input.nums as number[]) ? null : "nums must be a sorted array, rotated (e.g. 2 5 6 0 0 1 2)."),
  run(input) {
    const nums = input.nums as number[];
    const target = input.target as number;
    const n = nums.length;
    const r = recorder();
    let low = 0;
    let high = n - 1;
    const view = (tones: Record<number, CellTone>, marks: Record<string, number>) => ({
      arrays: [{ name: "nums", values: nums, tones: { ...toneRange(0, low - 1, "muted"), ...toneRange(high + 1, n - 1, "muted"), ...tones }, pointers: pointersAt(n, marks, { mid: "secondary", high: "tertiary" }) }],
    });
    const lr = (s: string) => lineOf(code, s);

    r.step(lr("let high = nums.length - 1;"), `Search for ${target}. Like the distinct case, one side of mid is usually sorted — but duplicates can make **low, mid and high all equal**, and then you can't tell which side.`, {
      ...view({}, { low, high }),
      vars: { target, low, high },
    });
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      r.step(lr("const mid = low + "), `mid = ${mid}, holding ${nums[mid]}.`, { ...view({ [mid]: "primary" }, { low, mid, high }), vars: { target, low, mid, high } });
      if (nums[mid] === target) {
        r.step(lr("if (nums[mid] === target) return true;"), `nums[${mid}] is ${target}: return **true**.`, { ...view({ [mid]: "success" }, { mid }), vars: { target, mid }, done: true });
        return r.frames;
      }
      if (nums[low] === nums[mid] && nums[mid] === nums[high]) {
        const [a, b] = [low, high];
        low++;
        high--;
        r.step(lr("low++;"), `nums[low], nums[mid] and nums[high] are all ${nums[mid]}: the seam could be on either side. Both ends hold ${nums[mid]}, not ${target}, so drop them: \`low = ${low}\`, \`high = ${high}\`. This step only removes two values — the reason for the O(n) worst case.`, {
          ...view({ [a]: "tertiary", [b]: "tertiary" }, { low, high }),
          vars: { target, low, high },
        });
      } else if (nums[low] <= nums[mid]) {
        const inside = nums[low] <= target && target < nums[mid];
        const [l, m] = [low, mid];
        if (inside) high = mid - 1;
        else low = mid + 1;
        r.step(lr(inside ? "if (nums[low] <= target && target < nums[mid]) high = mid - 1;" : "      else low = mid + 1;"), `The left half ${l}..${m} is sorted (${nums[l]}..${nums[m]}). ${target} is ${inside ? "inside it: keep the left side" : "not inside it: search the right side"}. Now low = ${low}, high = ${high}.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      } else {
        const inside = nums[mid] < target && target <= nums[high];
        const [m, h] = [mid, high];
        if (inside) low = mid + 1;
        else high = mid - 1;
        r.step(lr(inside ? "if (nums[mid] < target && target <= nums[high]) low = mid + 1;" : "      else high = mid - 1;"), `The right half ${m}..${h} is sorted (${nums[m]}..${nums[h]}). ${target} is ${inside ? "inside it: keep the right side" : "not inside it: search the left side"}. Now low = ${low}, high = ${high}.`, {
          ...view({}, { low, high }),
          vars: { target, low, high },
        });
      }
    }
    r.step(lr("return false;"), `Nothing left in play: ${target} isn't in the array. Return **false**.`, {
      arrays: [{ name: "nums", values: nums, tones: toneRange(0, n - 1, "muted") }],
      vars: { target },
      done: true,
    });
    return r.frames;
  },
};

export default program;
