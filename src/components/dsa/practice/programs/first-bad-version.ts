import { lineOf } from "../graphs";
import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function firstBadVersion(n) {
  let low = 1;
  let high = n;                              // version n is bad, so the answer is in 1..n
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (isBadVersion(mid)) high = mid;       // mid is bad: the first bad is mid or earlier
    else low = mid + 1;                      // mid is good: the first bad is later
  }
  return low;
}`;

const program: Program = {
  title: "First bad version",
  code,
  fields: [
    { key: "n", label: "n (versions)", kind: "number", min: 1, max: 16 },
    { key: "bad", label: "first bad version (hidden from the code)", kind: "number", min: 1, max: 16 },
  ],
  examples: [
    { label: "Example", input: { n: 8, bad: 6 } },
    { label: "First is bad", input: { n: 10, bad: 1 } },
    { label: "Only the last", input: { n: 12, bad: 12 } },
  ],
  check: (input) => ((input.bad as number) <= (input.n as number) ? null : "The first bad version must be between 1 and n."),
  run(input) {
    const n = input.n as number;
    const bad = input.bad as number;
    const r = recorder();
    const versions = Array.from({ length: n }, (_, i) => i + 1);
    // What the API has revealed so far, by array index (version - 1).
    const known: Record<number, CellTone> = {};
    let calls = 0;
    let low = 1;
    let high = n;
    const view = (extra: Record<number, CellTone>, marks: Record<string, number>) => {
      const tones: Record<number, CellTone> = {};
      versions.forEach((v, i) => {
        if (v < low || v > high) tones[i] = "muted";
      });
      return {
        arrays: [{ name: "version", values: versions, tones: { ...tones, ...known, ...extra }, pointers: pointersAt(n, Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, v - 1])), { mid: "secondary", high: "tertiary" }) }],
      };
    };

    r.step(lineOf(code, "let high = n;"), `Versions 1..${n}: good up to some point, bad from there on. Version ${n} is bad, so the first bad one is somewhere in **${low}..${high}**. Each call to isBadVersion should rule out half of them.`, {
      ...view({}, { low, high }),
      vars: { low, high, "API calls": calls },
    });
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      calls++;
      const isBad = mid >= bad;
      known[mid - 1] = isBad ? "tertiary" : "done";
      r.step(lineOf(code, "const mid = low + "), `Ask about the middle version: **isBadVersion(${mid})** returns ${isBad}.`, {
        ...view({ [mid - 1]: "primary" }, { low, mid, high }),
        vars: { low, mid, high, "API calls": calls },
      });
      if (isBad) {
        high = mid;
        r.step(lineOf(code, "if (isBadVersion(mid)) high = mid;"), `Version ${mid} is bad, so the first bad one is ${mid} or earlier. Keep ${mid}: \`high = ${high}\`.`, {
          ...view({}, { low, high }),
          vars: { low, high, "API calls": calls },
        });
      } else {
        low = mid + 1;
        r.step(lineOf(code, "else low = mid + 1;"), `Version ${mid} is good, and so is every version before it. \`low = ${low}\`.`, {
          ...view({}, { low, high }),
          vars: { low, high, "API calls": calls },
        });
      }
    }
    r.step(lineOf(code, "return low;"), `\`low == high\`: only one version is left, so the first bad version is **${low}**. That took ${calls} API call${calls === 1 ? "" : "s"} instead of up to ${n} — **O(log n)**.`, {
      arrays: [{ name: "version", values: versions, tones: Object.fromEntries(versions.map((v, i) => [i, v === low ? "success" : v > low ? "tertiary" : "done"])) as Record<number, CellTone>, pointers: pointersAt(n, { first: low - 1 }) }],
      vars: { answer: low, "API calls": calls },
      done: true,
    });
    return r.frames;
  },
};

export default program;
