import { skyline } from "../skyline";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];      // the right side is surely taller
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];    // the left side is surely taller
      right--;
    }
  }
  return water;
}`;

const program: Program = {
  title: "Trapping rain water (two pointers)",
  code,
  fields: [{ key: "height", label: "height", kind: "array", maxLength: 12, min: 0, max: 6 }],
  examples: [
    { label: "Example 1", input: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] } },
    { label: "Example 2", input: { height: [4, 2, 0, 3, 2, 5] } },
    { label: "A bowl", input: { height: [3, 0, 1, 0, 3] } },
  ],
  run(input) {
    const height = input.height as number[];
    const n = height.length;
    const r = recorder();
    const water: number[] = new Array(n).fill(0);
    const settled = new Set<number>();
    let left = 0;
    let right = n - 1;
    let leftMax = 0;
    let rightMax = 0;
    let total = 0;

    const view = (tones: Record<number, CellTone> = {}, column?: number, showPointers = true) => ({
      grids: [
        skyline("elevation map", height, {
          water,
          shade: column !== undefined && water[column] > 0 ? Array.from({ length: water[column] }, (_, d) => [column, height[column] + d + 1] as [number, number]) : [],
          shadeTone: "write",
        }),
      ],
      arrays: [
        {
          name: "height",
          values: height,
          tones: { ...Object.fromEntries([...settled].map((k) => [k, "done" as CellTone])), ...tones },
          pointers: showPointers ? pointersAt(n, { left, right }, { right: "tertiary" }) : {},
        },
      ],
    });

    r.step(4, `Water above a bar = min(tallest bar on its left, tallest on its right) − its height. Two pointers walk inward, each remembering the tallest bar it has passed.`, {
      ...view(),
      vars: { leftMax, rightMax, water: total },
    });

    while (left < right) {
      if (height[left] < height[right]) {
        leftMax = Math.max(leftMax, height[left]);
        const add = leftMax - height[left];
        water[left] = add;
        total += add;
        settled.add(left);
        r.step(8, `height[left] = ${height[left]} < height[right] = ${height[right]}, so the **right side has a wall at least ${height[right]}** — the left side decides. leftMax = ${leftMax}, so bar ${left} holds ${leftMax} − ${height[left]} = **${add}**.`, {
          ...view({ [left]: "primary" }, left),
          vars: { leftMax, rightMax, water: total },
        });
        left++;
      } else {
        rightMax = Math.max(rightMax, height[right]);
        const add = rightMax - height[right];
        water[right] = add;
        total += add;
        settled.add(right);
        r.step(12, `height[right] = ${height[right]} ≤ height[left] = ${height[left]}, so the **left side has a wall at least ${height[left]}** — the right side decides. rightMax = ${rightMax}, so bar ${right} holds ${rightMax} − ${height[right]} = **${add}**.`, {
          ...view({ [right]: "tertiary" }, right),
          vars: { leftMax, rightMax, water: total },
        });
        right--;
      }
    }

    r.step(16, `The pointers met at the tallest bar, which holds no water. Total: **${total}**. One pass, four variables: **O(n) time, O(1) space**.`, {
      ...view({ [left]: "tertiary" }, undefined, false),
      vars: { water: total },
      done: true,
    });
    return r.frames;
  },
};

export default program;
