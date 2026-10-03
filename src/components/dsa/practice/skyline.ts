import { cell, type CellTone, type GridView, type Scalar } from "./types";

/**
 * Bars drawn as a grid of unit squares, tallest level at the top, so a
 * rectangle or a layer of water can be shaded square by square.
 * `water[c]` is how many squares of water sit on top of bar c.
 */
export function skyline(
  name: string,
  heights: number[],
  {
    water = [],
    barTones = {},
    shade = [],
    shadeTone = "success",
    minLevels = 1,
  }: {
    water?: number[];
    barTones?: Record<number, CellTone>;
    /** Squares to highlight, as [column, level] with level 1 = the bottom row. */
    shade?: [number, number][];
    shadeTone?: CellTone;
    minLevels?: number;
  } = {}
): GridView {
  const top = Math.max(minLevels, ...heights.map((h, c) => h + (water[c] ?? 0)));
  const values: Scalar[][] = [];
  const tones: Record<string, CellTone> = {};
  for (let r = 0; r < top; r++) {
    const level = top - r;
    values.push(
      heights.map((h, c) => {
        if (level <= h) {
          tones[cell(r, c)] = barTones[c] ?? "muted";
          return "";
        }
        if (level <= h + (water[c] ?? 0)) {
          tones[cell(r, c)] = "done";
          return "";
        }
        return null;
      })
    );
  }
  for (const [c, level] of shade) {
    const r = top - level;
    if (r < 0 || r >= top) continue;
    if (values[r][c] === null) values[r][c] = "";
    tones[cell(r, c)] = shadeTone;
  }
  return { name, values, tones, rowLabels: Array.from({ length: top }, (_, r) => String(top - r)) };
}
