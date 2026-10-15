import { lineOf } from "../graphs";
import { cell, recorder, type CellTone, type Program } from "../types";

const code = `const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];   // up, down, left, right

function floodFill(image, sr, sc, color) {
  const original = image[sr][sc];
  if (original === color) return image;            // already that colour: nothing to do
  const rows = image.length, cols = image[0].length;
  const queue = [[sr, sc]];
  image[sr][sc] = color;                           // paint on the way IN: painted means visited
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] === original) {
        image[nr][nc] = color;                     // a matching neighbour joins the region
        queue.push([nr, nc]);
      }
    }
  }
  return image;
}`;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const program: Program = {
  title: "Flood fill (BFS)",
  code,
  fields: [
    { key: "image", label: "image", kind: "grid", maxLength: 5, min: 0, max: 9 },
    { key: "sr", label: "sr", kind: "number", min: 0, max: 4 },
    { key: "sc", label: "sc", kind: "number", min: 0, max: 4 },
    { key: "color", label: "color", kind: "number", min: 0, max: 9 },
  ],
  examples: [
    { label: "Example", input: { image: [[1, 1, 1], [1, 1, 0], [1, 0, 1]], sr: 1, sc: 1, color: 2 } },
    { label: "Winding region", input: { image: [[1, 1, 0, 1], [0, 1, 0, 1], [1, 1, 1, 1], [0, 0, 0, 1]], sr: 0, sc: 0, color: 5 } },
    { label: "Same colour", input: { image: [[0, 0, 0], [0, 0, 0]], sr: 0, sc: 0, color: 0 } },
  ],
  check: (input) => {
    const image = input.image as number[][];
    if ((input.sr as number) >= image.length || (input.sc as number) >= image[0].length) return "(sr, sc) must be a pixel inside the image.";
    return null;
  },
  run(input) {
    const image = (input.image as number[][]).map((row) => [...row]);
    const sr = input.sr as number;
    const sc = input.sc as number;
    const color = input.color as number;
    const rows = image.length;
    const cols = image[0].length;
    const original = image[sr][sc];
    const r = recorder();
    const painted = new Set<string>();
    const queue: [number, number][] = [[sr, sc]];
    let head = 0;

    const frame = (current: [number, number] | null, fresh: [number, number] | null = null) => {
      const tones: Record<string, CellTone> = {};
      painted.forEach((k) => (tones[k] = "done"));
      queue.slice(head).forEach(([y, x]) => (tones[cell(y, x)] = "tertiary"));
      if (current) tones[cell(current[0], current[1])] = "primary";
      if (fresh) tones[cell(fresh[0], fresh[1])] = "write";
      return {
        grids: [{ name: "image", values: image, tones }],
        arrays: [{ name: "queue (front → back)", values: queue.slice(head).map(([y, x]) => `${y},${x}`) }],
      };
    };

    if (original === color) {
      r.step(lineOf(code, "if (original === color)"), `The start pixel is already colour **${color}**. Painting would change nothing — and every pixel would keep matching, so the walk would never end. Return the image as it is.`, {
        ...frame([sr, sc]),
        vars: { original, color },
        done: true,
      });
      return r.frames;
    }

    image[sr][sc] = color;
    painted.add(cell(sr, sc));
    r.step(lineOf(code, "image[sr][sc] = color"), `The region is every pixel of colour **${original}** connected to \`(${sr}, ${sc})\`. Paint the start and put it in the queue — painted now means visited.`, {
      ...frame(null, [sr, sc]),
      vars: { original, color },
    });

    while (head < queue.length) {
      const [y, x] = queue[head++];
      r.step(lineOf(code, "const [r, c] = queue[head++]"), `Take \`(${y}, ${x})\` from the front of the queue and look at its four neighbours.`, {
        ...frame([y, x]),
        vars: { r: y, c: x },
      });
      for (const [dy, dx] of DIRS) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && image[ny][nx] === original) {
          image[ny][nx] = color;
          painted.add(cell(ny, nx));
          queue.push([ny, nx]);
          r.step(lineOf(code, "image[nr][nc] = color"), `\`(${ny}, ${nx})\` still has colour ${original}, so it's part of the region: paint it **${color}** and queue it.`, {
            ...frame([y, x], [ny, nx]),
            vars: { r: y, c: x, nr: ny, nc: nx },
          });
        }
      }
    }
    r.step(lineOf(code, "return image"), `The queue is empty: ${painted.size} pixel${painted.size === 1 ? " was" : "s were"} repainted, each exactly once. **O(m · n)**.`, {
      ...frame(null),
      done: true,
    });
    return r.frames;
  },
};

export default program;
