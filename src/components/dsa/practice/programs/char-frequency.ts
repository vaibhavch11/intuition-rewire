import { mapView } from "../structures";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function countChars(s) {
  const count = new Map();
  for (const ch of s) {
    count.set(ch, (count.get(ch) ?? 0) + 1);   // missing counts as 0, then add one
  }
  return count;
}`;

const program: Program = {
  title: "Counting characters with a hash map",
  code,
  fields: [{ key: "s", label: "s", kind: "text", maxLength: 16, hint: "letters and digits, like banana" }],
  examples: [
    { label: "banana", input: { s: "banana" } },
    { label: "mississippi", input: { s: "mississippi" } },
    { label: "All different", input: { s: "abcd" } },
  ],
  check(input) {
    return /^[a-z0-9]+$/i.test(input.s as string) ? null : "s: use letters and digits only, like banana.";
  },
  run(input) {
    const s = input.s as string;
    const chars = [...s];
    const r = recorder();
    const count = new Map<string, number>();

    r.step(2, `Count how often each character of "${s}" appears. The map will hold **character → count**: one entry per *different* character, however long the string is.`, {
      arrays: [{ name: "s", values: chars }],
      maps: [mapView("count", count, { keyLabel: "char", valueLabel: "count" })],
    });

    chars.forEach((ch, i) => {
      const before = count.get(ch);
      count.set(ch, (before ?? 0) + 1);
      r.step(
        4,
        before === undefined
          ? `'${ch}' isn't a key yet: \`count.get('${ch}') ?? 0\` gives 0, so it is stored with count **1**.`
          : `'${ch}' is already a key with count ${before}, so it becomes **${before + 1}**. No scanning back through the string — the map remembers.`,
        {
          arrays: [{ name: "s", values: chars, tones: toneRange(0, i - 1, "done", { [i]: "primary" }), pointers: pointersAt(chars.length, { ch: i }) }],
          maps: [mapView("count", count, { keyLabel: "char", valueLabel: "count", marks: [[ch, "write", before === undefined ? "new" : "+1"]] })],
          vars: { ch, "distinct so far": count.size },
        }
      );
    });

    const top = Math.max(...count.values());
    const most = [...count].filter(([, c]) => c === top).map(([k]) => k);
    r.step(
      6,
      `Done in one pass: ${chars.length} characters, **${count.size} different**. The most frequent: ${most.map((m) => `'${m}'`).join(", ")} (${top} times). The same pattern counts words, numbers or anything else you can use as a key.`,
      {
        arrays: [{ name: "s", values: chars, tones: toneRange(0, chars.length - 1, "done") }],
        maps: [mapView("count", count, { keyLabel: "char", valueLabel: "count", marks: most.map((m) => [m, "success"] as [string, "success"]) })],
        vars: { distinct: count.size },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
