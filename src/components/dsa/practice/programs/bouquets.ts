import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program, type Scalar } from "../types";

const code = `function minDays(bloomDay, m, k) {
  if (m * k > bloomDay.length) return -1;          // not enough flowers, whatever the day
  const bouquets = (day) => {
    let made = 0, run = 0;
    for (const d of bloomDay) {
      run = d <= day ? run + 1 : 0;                // adjacent bloomed flowers so far
      if (run === k) { made++; run = 0; }          // a full bouquet: start a new run
    }
    return made;
  };
  let low = Math.min(...bloomDay);
  let high = Math.max(...bloomDay);                // by then every flower has bloomed
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (bouquets(mid) >= m) high = mid;            // enough by day mid: try earlier
    else low = mid + 1;                            // not yet: wait longer
  }
  return low;
}`;

/** Which bouquet (1, 2, ...) each flower goes into on this day, greedily; "" if none. */
function plan(bloomDay: number[], k: number, day: number) {
  const out: Scalar[] = bloomDay.map(() => "");
  let made = 0;
  let run = 0;
  bloomDay.forEach((d, i) => {
    run = d <= day ? run + 1 : 0;
    if (run === k) {
      made++;
      for (let j = i - k + 1; j <= i; j++) out[j] = made;
      run = 0;
    }
  });
  return { out, made };
}

const program: Program = {
  title: "Minimum days to make m bouquets",
  code,
  fields: [
    { key: "bloomDay", label: "bloomDay", kind: "array", maxLength: 10, min: 1, max: 99 },
    { key: "m", label: "m (bouquets)", kind: "number", min: 1, max: 10 },
    { key: "k", label: "k (adjacent flowers each)", kind: "number", min: 1, max: 10 },
  ],
  examples: [
    { label: "A late flower", input: { bloomDay: [7, 7, 7, 7, 12, 7, 7], m: 2, k: 3 } },
    { label: "Single flowers", input: { bloomDay: [1, 10, 3, 10, 2], m: 3, k: 1 } },
    { label: "Impossible", input: { bloomDay: [1, 10, 3, 10, 2], m: 3, k: 2 } },
  ],
  check: (input) => ((input.bloomDay as number[]).length ? null : "Add at least one flower."),
  run(input) {
    const bloomDay = input.bloomDay as number[];
    const m = input.m as number;
    const k = input.k as number;
    const n = bloomDay.length;
    const r = recorder();

    if (m * k > n) {
      r.step(lineOf(code, "if (m * k > bloomDay.length) return -1;"), `${m} bouquets of ${k} need ${m * k} flowers, but there are only ${n}. No day is enough: return **-1**.`, {
        arrays: [{ name: "bloomDay", values: bloomDay }],
        vars: { m, k, "m * k": m * k, n },
        done: true,
      });
      return r.frames;
    }
    let low = Math.min(...bloomDay);
    let high = Math.max(...bloomDay);
    const view = (day: number) => {
      const { out } = plan(bloomDay, k, day);
      const tones: Record<number, CellTone> = {};
      bloomDay.forEach((d, i) => {
        tones[i] = out[i] !== "" ? "success" : d <= day ? "done" : "muted";
      });
      return [{ name: "bloomDay", values: bloomDay, tones }, { name: `bouquet on day ${day}`, values: out, tones }];
    };

    r.step(lineOf(code, "let high = Math.max(...bloomDay);"), `${m} × ${k} = ${m * k} <= ${n} flowers, so some day works. It's between the first bloom, **${low}**, and the last, **${high}**. Waiting longer only helps, so find the **first day with ${m} bouquet${m === 1 ? "" : "s"}**.`, {
      arrays: [{ name: "bloomDay", values: bloomDay }],
      vars: { m, k, low, high },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      const { made } = plan(bloomDay, k, mid);
      r.step(lineOf(code, "const mid = low + "), `Try **day ${mid}**: walk the row, counting adjacent bloomed flowers; every run of ${k} makes a bouquet. That makes **${made}**.`, {
        arrays: view(mid),
        vars: { m, k, low, mid, high, bouquets: made },
      });
      if (made >= m) {
        high = mid;
        r.step(lineOf(code, "if (bouquets(mid) >= m) high = mid;"), `${made} >= ${m}: day ${mid} is enough. Try earlier — \`high = ${high}\`.`, { arrays: [{ name: "bloomDay", values: bloomDay }], vars: { m, k, low, high } });
      } else {
        low = mid + 1;
        r.step(lineOf(code, "else low = mid + 1;"), `${made} < ${m}: not enough by day ${mid}. Wait longer — \`low = ${low}\`.`, { arrays: [{ name: "bloomDay", values: bloomDay }], vars: { m, k, low, high } });
      }
    }
    r.step(lineOf(code, "return low;"), `One day left: the answer is day **${low}**. **O(n log(max day))**.`, {
      arrays: view(low),
      vars: { m, k, answer: low },
      done: true,
    });
    return r.frames;
  },
};

export default program;
