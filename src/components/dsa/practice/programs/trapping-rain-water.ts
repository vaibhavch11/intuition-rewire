import { skyline } from "../skyline";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function trap(height) {
  const stack = [];                // indexes of walls; heights decrease upward
  let water = 0;
  for (let i = 0; i < height.length; i++) {
    while (stack.length > 0 && height[i] > height[stack[stack.length - 1]]) {
      const bottom = stack.pop();
      if (stack.length === 0) break;              // no wall on the left
      const left = stack[stack.length - 1];
      const width = i - left - 1;
      const depth = Math.min(height[left], height[i]) - height[bottom];
      water += width * depth;                      // one horizontal layer
    }
    stack.push(i);
  }
  return water;
}`;

const program: Program = {
  title: "Trapping rain water (monotonic stack, layer by layer)",
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
    const stack: number[] = [];
    const water: number[] = new Array(n).fill(0);
    let total = 0;
    const entry = (k: number) => `${height[k]} (#${k})`;

    const view = (i: number | undefined, opts: { layer?: [number, number][]; tones?: Record<number, CellTone>; marks?: Record<string, number | undefined> } = {}) => {
      const inStack = Object.fromEntries(stack.map((k) => [k, "tertiary" as CellTone]));
      return {
        grids: [skyline("elevation map", height, { water, barTones: inStack, shade: opts.layer, shadeTone: "write" })],
        arrays: [
          {
            name: "height",
            values: height,
            tones: { ...inStack, ...opts.tones },
            pointers: pointersAt(n, { ...opts.marks, i }, { left: "tertiary", bottom: "muted" }),
          },
        ],
        stacks: [{ name: "stack (height, #index)", values: stack.map(entry) }],
      };
    };

    r.step(2, `Water is poured in **horizontal layers**. The stack keeps walls that might hold water on their right — their heights **decrease** upward. A taller bar arriving means water can be trapped between it and an earlier wall.`, {
      ...view(undefined),
      vars: { water: 0 },
    });

    for (let i = 0; i < n; i++) {
      while (stack.length > 0 && height[i] > height[stack[stack.length - 1]]) {
        const bottom = stack.pop()!;
        if (stack.length === 0) {
          r.step(7, `Bar ${i} (height ${height[i]}) is taller than bar ${bottom}, but there is **no wall on the left** of bar ${bottom}. Water there would flow off the edge — nothing to add.`, {
            ...view(i, { tones: { [i]: "primary", [bottom]: "write" }, marks: { bottom } }),
            vars: { water: total },
          });
          break;
        }
        const left = stack[stack.length - 1];
        const width = i - left - 1;
        const depth = Math.min(height[left], height[i]) - height[bottom];
        const layer: [number, number][] = [];
        for (let c = left + 1; c < i; c++) {
          for (let d = 1; d <= depth; d++) layer.push([c, height[bottom] + d]);
          water[c] += depth;
        }
        total += width * depth;
        r.step(11, depth > 0
          ? `Bar ${bottom} is a floor between **wall ${left}** (height ${height[left]}) and **wall ${i}** (height ${height[i]}). The water above it rises to the shorter wall: depth ${Math.min(height[left], height[i])} − ${height[bottom]} = ${depth}, width ${width}. Add a layer of **${width * depth}**.`
          : `Bar ${bottom} sits between walls ${left} and ${i}, but it is as high as the shorter wall, so this layer has depth 0.`, {
          ...view(i, { layer, tones: { [i]: "primary", [bottom]: "write" }, marks: { left, bottom } }),
          vars: { width, depth, water: total },
        });
      }
      stack.push(i);
      r.step(13, `Push bar ${i} (height ${height[i]}). It may become a floor or a wall for water further right.`, {
        ...view(i, { tones: { [i]: "primary" } }),
        vars: { water: total },
      });
    }

    r.step(15, `Total trapped water: **${total}**. Each bar was pushed once and popped at most once: **O(n) time, O(n) space** for the stack.`, {
      ...view(undefined),
      vars: { water: total },
      done: true,
    });
    return r.frames;
  },
};

export default program;
