import { edgeKey, graphView, lineOf, ringLayout } from "../graphs";
import { cell, recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function findTheCity(n, edges, distanceThreshold) {
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [u, v, w] of edges) {
    dist[u][v] = w;                         // roads go both ways
    dist[v][u] = w;
  }
  for (let k = 0; k < n; k++) {             // now allow city k as a stop in between
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j];
      }
    }
  }
  let answer = -1, fewest = Infinity;
  for (let i = 0; i < n; i++) {
    let reachable = 0;
    for (let j = 0; j < n; j++) if (i !== j && dist[i][j] <= distanceThreshold) reachable++;
    if (reachable <= fewest) {              // <= so a tie goes to the larger city number
      fewest = reachable;
      answer = i;
    }
  }
  return answer;
}`;

// The road field reads [u,v] pairs, so each road's length comes from a parallel list.
const program: Program = {
  title: "Find the city (Floyd-Warshall)",
  code,
  fields: [
    { key: "n", label: "n (cities 0..n-1)", kind: "number", min: 2, max: 5 },
    { key: "edges", label: "roads: [u,v]", kind: "pairs", ordered: false, maxLength: 8, min: 0, max: 4, hint: "[u,v] pairs, like [0,1] [1,2] [1,3]" },
    { key: "w", label: "their lengths (one per road)", kind: "array", maxLength: 8, min: 1, max: 9 },
    { key: "distanceThreshold", label: "distanceThreshold", kind: "number", min: 1, max: 20 },
  ],
  examples: [
    { label: "Example", input: { n: 4, edges: [[0, 1], [1, 2], [1, 3], [2, 3]], w: [3, 1, 4, 1], distanceThreshold: 4 } },
    { label: "A shortcut", input: { n: 4, edges: [[0, 1], [1, 2], [0, 2], [2, 3]], w: [2, 2, 9, 3], distanceThreshold: 5 } },
    { label: "Islands", input: { n: 4, edges: [[0, 1], [2, 3]], w: [1, 1], distanceThreshold: 2 } },
  ],
  check: (input) => {
    const n = input.n as number;
    const edges = input.edges as number[][];
    if ((input.w as number[]).length !== edges.length) return "Give exactly one length per road.";
    for (const [u, v] of edges) {
      if (u >= n || v >= n) return `Cities are numbered 0 to ${n - 1}; [${u},${v}] is outside that.`;
      if (u === v) return `[${u},${v}] joins a city to itself.`;
    }
    if (new Set(edges.map(([u, v]) => edgeKey(u, v))).size !== edges.length) return "Each road may appear only once.";
    return null;
  },
  run(input) {
    const n = input.n as number;
    const threshold = input.distanceThreshold as number;
    const lengths = input.w as number[];
    const edges = (input.edges as number[][]).map(([u, v], i) => [u, v, lengths[i]]);
    const layout = ringLayout(n, edges.map(([u, v]) => [u, v]));
    const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
    for (const [u, v, w] of edges) {
      dist[u][v] = w;
      dist[v][u] = w;
    }
    const r = recorder();
    const show = (): Scalar[][] => dist.map((row) => row.map((d) => (d === Infinity ? "∞" : d)));
    const labels = Array.from({ length: n }, (_, i) => String(i));

    const frame = (k: number | null, hot: [number, number] | null, counts: (number | null)[] = [], pick: number | null = null, vars: Record<string, unknown> = {}) => {
      const gridTones: Record<string, CellTone> = {};
      if (k !== null) {
        for (let x = 0; x < n; x++) {
          gridTones[cell(k, x)] = "tertiary";
          gridTones[cell(x, k)] = "tertiary";
        }
      }
      if (hot) gridTones[cell(hot[0], hot[1])] = "write";
      const tones: Record<number, CellTone> = {};
      if (k !== null) tones[k] = "primary";
      if (pick !== null) tones[pick] = "success";
      return {
        graphs: [
          graphView("roads", layout, edges.map(([u, v]) => [u, v]), {
            weights: edges.map(([, , w]) => w),
            tones,
            captions: Object.fromEntries(counts.flatMap((c, i) => (c === null ? [] : [[i, `reach ${c}`]]))),
          }),
        ],
        grids: [{ name: "dist (row → column)", values: show(), tones: gridTones, rowLabels: labels, columnLabels: labels }],
        vars,
      };
    };

    r.step(
      lineOf(code, "dist[v][u] = w"),
      `Start \`dist\` with the roads themselves: 0 from a city to itself, the road length between neighbours, ∞ everywhere else. Next, let paths pass through more and more cities.`,
      frame(null, null)
    );
    for (let k = 0; k < n; k++) {
      let changed = 0;
      r.step(
        lineOf(code, "for (let k = 0; k < n; k++)"),
        `Round k = ${k}: may a path between i and j get shorter by **stopping at city ${k}**? The highlighted row and column hold every distance to and from ${k}.`,
        frame(k, null, [], null, { k })
      );
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            const before = dist[i][j];
            dist[i][j] = dist[i][k] + dist[k][j];
            changed++;
            r.step(
              lineOf(code, "if (dist[i][k] + dist[k][j] < dist[i][j])"),
              `${i} → ${k} → ${j}: ${dist[i][k]} + ${dist[k][j]} = **${dist[i][j]}**, shorter than ${before === Infinity ? "∞" : before}. Update dist[${i}][${j}].`,
              frame(k, [i, j], [], null, { k, i, j })
            );
          }
        }
      }
      if (changed === 0) {
        r.step(lineOf(code, "if (dist[i][k] + dist[k][j] < dist[i][j])"), `Going through city ${k} shortens nothing.`, frame(k, null, [], null, { k }));
      }
    }

    const counts: (number | null)[] = new Array(n).fill(null);
    let answer = -1;
    let fewest = Infinity;
    for (let i = 0; i < n; i++) {
      let reachable = 0;
      for (let j = 0; j < n; j++) if (i !== j && dist[i][j] <= threshold) reachable++;
      counts[i] = reachable;
      if (reachable <= fewest) {
        fewest = reachable;
        answer = i;
      }
    }
    r.step(
      lineOf(code, "if (reachable <= fewest)"),
      `\`dist\` now holds every shortest distance. Count, for each city, the others within ${threshold}: ${counts.map((c, i) => `${i} reaches ${c}`).join(", ")}.`,
      frame(null, null, counts, null)
    );
    r.step(
      lineOf(code, "return answer"),
      `The fewest is ${fewest}; among the cities with that count, take the largest number: **${answer}**. Three nested loops over n cities: **O(n³)**.`,
      { ...frame(null, null, counts, answer), done: true }
    );
    return r.frames;
  },
};

export default program;
