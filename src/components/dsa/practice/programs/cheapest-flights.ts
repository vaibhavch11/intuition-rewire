import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type MapView, type Program } from "../types";

const code = `function findCheapestPrice(n, flights, src, dst, k) {
  let cost = new Array(n).fill(Infinity);
  cost[src] = 0;
  for (let round = 0; round <= k; round++) {   // k stops = at most k + 1 flights
    const next = [...cost];                 // relax from LAST round's prices only
    for (const [u, v, price] of flights) {
      if (cost[u] + price < next[v]) next[v] = cost[u] + price;
    }
    cost = next;                            // now: cheapest using at most round + 1 flights
  }
  return cost[dst] === Infinity ? -1 : cost[dst];
}`;

const show = (x: number) => (x === Infinity ? "∞" : x);

// The flight field reads [u,v] pairs, so each flight's price comes from a parallel list.
const program: Program = {
  title: "Cheapest flights within k stops (Bellman-Ford rounds)",
  code,
  fields: [
    { key: "n", label: "n (cities 0..n-1)", kind: "number", min: 2, max: 6 },
    { key: "edges", label: "flights: [from,to]", kind: "pairs", ordered: false, maxLength: 9, min: 0, max: 5, hint: "[from,to] pairs, like [0,1] [1,2] [0,2]" },
    { key: "price", label: "their prices (one per flight)", kind: "array", maxLength: 9, min: 1, max: 999 },
    { key: "src", label: "src", kind: "number", min: 0, max: 5 },
    { key: "dst", label: "dst", kind: "number", min: 0, max: 5 },
    { key: "k", label: "k (max stops)", kind: "number", min: 0, max: 4 },
  ],
  examples: [
    { label: "Example", input: { n: 4, edges: [[0, 1], [1, 2], [2, 0], [1, 3], [2, 3]], price: [100, 100, 100, 600, 200], src: 0, dst: 3, k: 1 } },
    { label: "One more stop allowed", input: { n: 4, edges: [[0, 1], [1, 2], [2, 0], [1, 3], [2, 3]], price: [100, 100, 100, 600, 200], src: 0, dst: 3, k: 2 } },
    { label: "No stops", input: { n: 3, edges: [[0, 1], [1, 2], [0, 2]], price: [100, 100, 500], src: 0, dst: 2, k: 0 } },
  ],
  check: (input) => {
    const n = input.n as number;
    const edges = input.edges as number[][];
    if ((input.price as number[]).length !== edges.length) return "Give exactly one price per flight.";
    if ((input.src as number) >= n || (input.dst as number) >= n) return `src and dst must be cities from 0 to ${n - 1}.`;
    if (input.src === input.dst) return "src and dst must be different cities.";
    for (const [u, v] of edges) {
      if (u >= n || v >= n) return `Cities are numbered 0 to ${n - 1}; [${u},${v}] is outside that.`;
      if (u === v) return `[${u},${v}] flies from a city to itself.`;
    }
    if (new Set(edges.map(([u, v]) => `${u}>${v}`)).size !== edges.length) return "Each flight from → to may appear only once.";
    return null;
  },
  run(input) {
    const n = input.n as number;
    const src = input.src as number;
    const dst = input.dst as number;
    const k = input.k as number;
    const prices = input.price as number[];
    const flights = (input.edges as number[][]).map(([u, v], i) => [u, v, prices[i]]);
    const ids = Array.from({ length: n }, (_, i) => i);
    const layout = ringLayout(n, flights.map(([u, v]) => [u, v]), [src, ...ids.filter((x) => x !== src)]);
    let cost = new Array(n).fill(Infinity);
    let next = [...cost];
    const r = recorder();

    const table = (name: string, values: number[], hot: number | null): MapView => ({
      name,
      entries: values.map((c, city) => [city, show(c)]),
      keyLabel: "city",
      valueLabel: "cost",
      tones: hot === null ? {} : { [hot]: "write" },
    });
    const frame = (round: number | null, hot: [number, number] | null, hotTone: EdgeTone, improved: number | null, vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      cost.forEach((c, city) => c !== Infinity && (tones[city] = "done"));
      tones[dst] = cost[dst] === Infinity ? "tertiary" : "success";
      if (improved !== null) tones[improved] = "primary";
      return {
        graphs: [
          graphView(`flights (price on each arrow); src ${src}, dst ${dst}`, layout, flights.map(([u, v]) => [u, v]), {
            directed: true,
            weights: flights.map(([, , p]) => p),
            tones,
            captions: Object.fromEntries(ids.map((city) => [city, `${show(round === null ? cost[city] : next[city])}`])),
            edgeTones: hot ? { [`${hot[0]}>${hot[1]}`]: hotTone } : {},
          }),
        ],
        maps: round === null ? [table("cost", cost, null)] : [table("cost (last round)", cost, null), table("next (this round)", next, improved)],
        vars: round === null ? vars : { round, "flights allowed": round + 1, ...vars },
      };
    };

    cost[src] = 0;
    r.step(
      lineOf(code, "cost[src] = 0"),
      `Only **${k + 1}** flight${k === 0 ? "" : "s"} are allowed (${k} stop${k === 1 ? "" : "s"}). Dijkstra can't promise that — its cheapest route might use too many flights. So count flights instead: after round i, \`cost\` holds the cheapest price using **at most i flights**. With none yet, only city ${src} costs 0.`,
      frame(null, null, "active", null)
    );
    for (let round = 0; round <= k; round++) {
      next = [...cost];
      r.step(
        lineOf(code, "const next = [...cost]"),
        `Round ${round + 1}: every route may use one more flight. Copy \`cost\` into \`next\` and relax every flight — but always **from** last round's \`cost\`, so no route sneaks in two extra flights in one round.`,
        frame(round, null, "active", null)
      );
      for (const [u, v, price] of flights) {
        if (cost[u] + price < next[v]) {
          const before = next[v];
          next[v] = cost[u] + price;
          r.step(
            lineOf(code, "if (cost[u] + price < next[v])"),
            `Flight ${u} → ${v} costs ${price}: ${cost[u]} + ${price} = **${next[v]}**, cheaper than ${show(before)}. City ${v} gets the new price.`,
            frame(round, [u, v], "active", v, { u, v, price })
          );
        } else if (cost[u] !== Infinity) {
          r.step(
            lineOf(code, "if (cost[u] + price < next[v])"),
            `Flight ${u} → ${v}: ${cost[u]} + ${price} = ${cost[u] + price}, no cheaper than ${show(next[v])}.`,
            frame(round, [u, v], "muted", null, { u, v, price })
          );
        }
      }
      cost = next;
      r.step(
        lineOf(code, "cost = next"),
        `Round ${round + 1} done: \`cost\` is now the cheapest price to each city using at most ${round + 1} flight${round === 0 ? "" : "s"}. To ${dst}: **${show(cost[dst])}**.`,
        frame(null, null, "active", null, { round, "flights allowed": round + 1 })
      );
    }
    r.step(
      lineOf(code, "return cost[dst] === Infinity"),
      cost[dst] === Infinity
        ? `After ${k + 1} round${k === 0 ? "" : "s"}, city ${dst} is still out of reach within ${k} stop${k === 1 ? "" : "s"}: **-1**.`
        : `After ${k + 1} round${k === 0 ? "" : "s"} the cheapest way to ${dst} with at most ${k} stop${k === 1 ? "" : "s"} costs **${cost[dst]}**. Each round reads every flight once: **O(k · E)**.`,
      { ...frame(null, null, "active", null), done: true }
    );
    return r.frames;
  },
};

export default program;
