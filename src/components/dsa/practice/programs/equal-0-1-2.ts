import { mapView, type MapMark } from "../structures";
import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";

const code = `function countEqual012(s) {
  const seen = new Map([["0,0", 1]]);          // (ones - zeros, twos - ones) -> times seen
  let c0 = 0, c1 = 0, c2 = 0, count = 0;
  for (const ch of s) {
    if (ch === "0") c0++; else if (ch === "1") c1++; else c2++;
    const key = (c1 - c0) + "," + (c2 - c1);    // both differences, as one key
    count += seen.get(key) ?? 0;                // same key: equal counts in between
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return count;
}`;

const program: Program = {
  title: "Equal 0s, 1s and 2s (difference keys)",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 12, hint: "only the digits 0, 1 and 2, like 0102010" }],
  examples: [
    { label: "Example", input: { s: "0102010" } },
    { label: "Five", input: { s: "102100211" } },
    { label: "None", input: { s: "0011" } },
  ],
  check(input) {
    return /^[012]+$/.test(input.s as string) ? null : "s: use only the digits 0, 1 and 2.";
  },
  run(input) {
    const chars = [...(input.s as string)];
    const n = chars.length;
    const r = recorder();
    const seen = new Map<string, number>([["0,0", 1]]);
    const keys: Scalar[] = chars.map(() => null);
    const keyAt = ["0,0"]; // keyAt[t] = the key before index t
    let c0 = 0;
    let c1 = 0;
    let c2 = 0;
    let count = 0;

    const views = (i: number, tones: Record<number, CellTone>, marks: MapMark<string>[] = []) => ({
      arrays: [
        { name: "s", values: chars, tones, pointers: i >= 0 ? pointersAt(n, { i }) : {} },
        { name: "key = (c1 − c0, c2 − c1) after each digit", values: [...keys], tones: i >= 0 ? { [i]: "primary" as const } : {} },
      ],
      maps: [mapView("seen", seen, { keyLabel: "key", valueLabel: "times", marks })],
    });

    r.step(
      2,
      `Keep running counts c0, c1, c2. A stretch has equal 0s, 1s and 2s exactly when **both** differences c1 − c0 and c2 − c1 are the same at its start and its end — the stretch added the same amount to all three. So the pair of differences is the key. **"0,0" → 1** is the empty start.`,
      { ...views(-1, {}), vars: { c0, c1, c2, count } }
    );

    for (let i = 0; i < n; i++) {
      const ch = chars[i];
      if (ch === "0") c0++;
      else if (ch === "1") c1++;
      else c2++;
      const key = `${c1 - c0},${c2 - c1}`;
      keys[i] = key;
      const times = seen.get(key) ?? 0;
      const starts: number[] = [];
      keyAt.forEach((p, t) => p === key && starts.push(t));
      count += times;
      r.step(
        7,
        times === 0
          ? `After '${ch}': c0 = ${c0}, c1 = ${c1}, c2 = ${c2}, so the key is (${key}). Not seen before — no balanced substring ends here.`
          : `After '${ch}': c0 = ${c0}, c1 = ${c1}, c2 = ${c2}, key (${key}) — seen ${times} ${times === 1 ? "time" : "times"} before. ${starts.map((t) => `"${chars.slice(t, i + 1).join("")}"`).join(", ")} ${times === 1 ? "has" : "each have"} equal 0s, 1s and 2s. count = **${count}**.`,
        {
          ...views(i, times ? toneRange(starts[starts.length - 1], i, "success") : { [i]: "primary" }, times ? [[key, "success", `×${times}`]] : []),
          vars: { c0, c1, c2, count },
        }
      );
      seen.set(key, times + 1);
      keyAt.push(key);
      r.step(8, `Record key (${key}): seen ${times + 1} ${times + 1 === 1 ? "time" : "times"} now.`, {
        ...views(i, { [i]: "primary" }, [[key, "write", times ? "+1" : "new"]]),
        vars: { c0, c1, c2, count },
      });
    }

    r.step(10, `Done: **${count}** ${count === 1 ? "substring has" : "substrings have"} equal numbers of 0s, 1s and 2s — one pass with a pair of differences as the key.`, {
      ...views(-1, {}),
      vars: { count },
      done: true,
    });
    return r.frames;
  },
};

export default program;
