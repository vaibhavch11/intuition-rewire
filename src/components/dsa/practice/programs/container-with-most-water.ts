import { pointersAt, recorder, toneRange, type CellTone, type Program } from "../types";

const code = `function maxArea(height) {
  let left = 0, right = height.length - 1;
  let best = 0;
  while (left < right) {
    const h = Math.min(height[left], height[right]);
    best = Math.max(best, h * (right - left));
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return best;
}`;

const program: Program = {
  title: "Container with most water (two pointers)",
  code,
  fields: [{ key: "height", label: "height", kind: "array", maxLength: 10, min: 0, max: 20 }],
  examples: [
    { label: "Classic", input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] } },
    { label: "Tall ends", input: { height: [4, 3, 2, 1, 4] } },
    { label: "Valley", input: { height: [6, 2, 5, 1, 3, 7] } },
  ],
  check(input) {
    return (input.height as number[]).length < 2 ? "Enter at least two walls — a container needs a left and a right side." : null;
  },
  run(input) {
    const height = input.height as number[];
    const n = height.length;
    const r = recorder();
    let left = 0;
    let right = n - 1;
    let best = 0;
    let bestPair = [0, n - 1];

    const view = (tones: Record<number, CellTone> = {}) => ({
      name: "height",
      values: height,
      chart: true,
      tones: { ...toneRange(0, left - 1, "muted"), ...toneRange(right + 1, n - 1, "muted"), [left]: "primary" as CellTone, [right]: "tertiary" as CellTone, ...tones },
      pointers: pointersAt(n, { left, right }, { right: "tertiary" }),
    });

    r.step(
      3,
      `Start with the **widest** container: the first and last walls. Every other container is narrower, so it can only win by being taller.`,
      { arrays: [view()], vars: { left, right, best } }
    );

    while (left < right) {
      const h = Math.min(height[left], height[right]);
      const width = right - left;
      const area = h * width;
      const improved = area > best;
      if (improved) {
        best = area;
        bestPair = [left, right];
      }
      r.step(
        6,
        `Walls ${left} and ${right}: the water stops at the **shorter** wall, ${h}. Area = ${h} × ${width} = **${area}**. ${improved ? `That's a new best.` : `Best stays ${best}.`}`,
        { arrays: [view(improved ? { [left]: "success", [right]: "success" } : {})], vars: { left, right, h, width, area, best } }
      );

      if (height[left] < height[right]) {
        r.step(
          8,
          `The left wall (${height[left]}) is shorter. Any container that keeps it is narrower **and** still capped at ${height[left]}, so it can't beat ${area}. Drop it: \`left++\`.`,
          { arrays: [view({ [left]: "muted" })], vars: { left, right, best } }
        );
        left++;
      } else {
        r.step(
          10,
          height[left] === height[right]
            ? `Both walls are ${height[right]}. Keeping either one can't beat ${area}, because the other side only gets closer. Drop the right one: \`right--\`.`
            : `The right wall (${height[right]}) is shorter. Any container that keeps it is narrower **and** still capped at ${height[right]}, so it can't beat ${area}. Drop it: \`right--\`.`,
          { arrays: [view({ [right]: "muted" })], vars: { left, right, best } }
        );
        right--;
      }
    }

    r.step(
      13,
      `The pointers met. The most water is **${best}**, between walls ${bestPair[0]} and ${bestPair[1]}. Each step threw away one wall for good: **O(n) time, O(1) space**.`,
      {
        arrays: [
          {
            name: "height",
            values: height,
            chart: true,
            tones: { ...toneRange(0, n - 1, "muted"), ...toneRange(bestPair[0] + 1, bestPair[1] - 1, "done"), [bestPair[0]]: "success", [bestPair[1]]: "success" },
          },
        ],
        vars: { best },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
