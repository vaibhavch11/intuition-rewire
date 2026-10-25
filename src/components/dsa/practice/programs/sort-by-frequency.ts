import { lineOf } from "../graphs";
import { mapView } from "../structures";
import { recorder, toneRange, type Program } from "../types";

const code = `function frequencySort(s) {
  const count = new Map();
  for (const ch of s) count.set(ch, (count.get(ch) ?? 0) + 1);
  const chars = [...count.keys()].sort((a, b) => count.get(b) - count.get(a));   // most frequent first
  return chars.map((ch) => ch.repeat(count.get(ch))).join("");
}`;

const program: Program = {
  title: "Sort characters by frequency",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 14, hint: "letters, like tree" }],
  examples: [
    { label: "Example", input: { s: "tree" } },
    { label: "Ties", input: { s: "cccaaa" } },
    { label: "Case matters", input: { s: "Aabb" } },
  ],
  check: (input) => (/^[A-Za-z0-9]+$/.test(input.s as string) ? null : "s: letters and digits only."),
  run(input) {
    const s = input.s as string;
    const count = new Map<string, number>();
    const r = recorder();
    [...s].forEach((ch, i) => {
      count.set(ch, (count.get(ch) ?? 0) + 1);
      r.step(lineOf(code, "for (const ch of s) count.set"), `'${ch}' seen ${count.get(ch)} time${count.get(ch) === 1 ? "" : "s"} so far.`, {
        arrays: [{ name: "s", values: [...s], tones: { ...toneRange(0, i - 1, "done"), [i]: "primary" } }],
        maps: [mapView("count", count, { marks: [[ch, "write"]] })],
      });
    });
    const chars = [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)!);
    r.step(lineOf(code, "const chars = "), `Sort the **distinct** characters with a comparator on their counts, biggest first: ${chars.map((c) => `'${c}' (${count.get(c)})`).join(", ")}. Characters with equal counts may come in either order.`, {
      arrays: [{ name: "characters, most frequent first", values: chars }, { name: "count", values: chars.map((c) => count.get(c)!) }],
    });
    const out = chars.map((ch) => ch.repeat(count.get(ch)!)).join("");
    r.step(lineOf(code, "return chars.map"), `Write each character as many times as it appears: **"${out}"**. Counting is O(n); sorting the k distinct characters is O(k log k) — at most 62 here, so effectively **O(n)**.`, {
      arrays: [{ name: "answer", values: [...out], tones: toneRange(0, out.length - 1, "success") }],
      done: true,
    });
    return r.frames;
  },
};

export default program;
