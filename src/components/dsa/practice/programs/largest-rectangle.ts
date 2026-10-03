import { skyline } from "../skyline";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function largestRectangleArea(heights) {
  const stack = [];                  // indexes; their heights increase upward
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];   // a 0 at the end empties the stack
    while (stack.length > 0 && heights[stack[stack.length - 1]] > h) {
      const height = heights[stack.pop()];
      const left = stack.length > 0 ? stack[stack.length - 1] : -1;
      const width = i - left - 1;          // between the shorter bars on each side
      best = Math.max(best, height * width);
    }
    stack.push(i);
  }
  return best;
}`;

const program: Program = {
  title: "Largest rectangle in a histogram (one pass)",
  code,
  fields: [{ key: "heights", label: "heights", kind: "array", maxLength: 9, min: 0, max: 7 }],
  examples: [
    { label: "Example", input: { heights: [2, 1, 5, 6, 2, 3] } },
    { label: "Wide and low", input: { heights: [6, 2, 5, 4, 5, 1, 6] } },
    { label: "Staircase", input: { heights: [1, 2, 3, 4, 5] } },
  ],
  run(input) {
    const heights = input.heights as number[];
    const n = heights.length;
    const r = recorder();
    const stack: number[] = [];
    let best = 0;
    let bestRect: [number, number][] = [];
    const entry = (k: number) => `${heights[k]} (#${k})`;
    const rect = (from: number, to: number, height: number) => {
      const out: [number, number][] = [];
      for (let c = from; c <= to; c++) for (let level = 1; level <= height; level++) out.push([c, level]);
      return out;
    };

    const view = (
      i: number | undefined,
      opts: { shade?: [number, number][]; popped?: number; left?: number; tones?: Record<number, CellTone>; shadeTone?: CellTone } = {}
    ) => {
      const inStack = Object.fromEntries(stack.map((k) => [k, "tertiary" as CellTone]));
      return {
        grids: [
          skyline("histogram", heights, {
            barTones: { ...inStack, ...(opts.popped !== undefined ? { [opts.popped]: "write" as CellTone } : {}) },
            shade: opts.shade,
            shadeTone: opts.shadeTone,
          }),
        ],
        arrays: [
          {
            name: "heights",
            values: heights,
            tones: { ...inStack, ...opts.tones },
            pointers: pointersAt(n, { left: opts.left, i }, { left: "tertiary" }),
          },
        ],
        stacks: [{ name: "stack (height, #index)", values: stack.map(entry) }],
      };
    };

    r.step(2, `Every bar's best rectangle uses its **full height** and stretches sideways until a **shorter** bar blocks it on each side. The stack keeps bars whose right edge isn't known yet — their heights **increase** upward.`, {
      ...view(undefined),
      vars: { best },
    });

    for (let i = 0; i <= n; i++) {
      const h = i === n ? 0 : heights[i];
      if (i === n && stack.length) {
        r.step(5, `Past the last bar. Pretend there is one more bar of height **0**: it is shorter than everything, so it closes every rectangle still open.`, {
          ...view(undefined),
          vars: { i, h: 0, best },
        });
      }
      while (stack.length > 0 && heights[stack[stack.length - 1]] > h) {
        const j = stack.pop()!;
        const height = heights[j];
        const left = stack.length > 0 ? stack[stack.length - 1] : -1;
        const width = i - left - 1;
        const area = height * width;
        const improved = area > best;
        best = Math.max(best, area);
        if (improved) bestRect = rect(left + 1, i - 1, height);
        r.step(10, `${i < n ? `Bar ${i} (height ${h}) is shorter than` : "The 0 is shorter than"} bar ${j} (height ${height}), so bar ${j}'s rectangle ends at ${i - 1}. On the left it is blocked by ${left >= 0 ? `bar ${left}, the next bar down the stack` : "nothing — the stack is empty, so it reaches index 0"}. Width ${width} × height ${height} = **${area}**${improved ? " — a new best" : ""}.`, {
          ...view(i < n ? i : undefined, { shade: rect(left + 1, i - 1, height), popped: j, left: left >= 0 ? left : undefined, tones: { [j]: "write" } }),
          vars: { height, width, area, best },
        });
      }
      if (i < n) {
        stack.push(i);
        r.step(12, `Push bar ${i} (height ${h}). Its right edge is still unknown — it is waiting for a shorter bar.`, {
          ...view(i, { tones: { [i]: "primary" } }),
          vars: { i, h, best },
        });
      }
    }

    r.step(14, `The largest rectangle has area **${best}**. Each bar was pushed once and popped once, and its area was measured exactly when it was popped: **O(n)**.`, {
      ...view(undefined, { shade: bestRect }),
      vars: { best },
      done: true,
    });
    return r.frames;
  },
};

export default program;
