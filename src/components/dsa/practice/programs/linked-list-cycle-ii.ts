import { NULL_ID, tagsAt } from "../structures";
import { recorder, type CellTone, type ListLink, type ListNodeView, type Program } from "../types";

const code = `function detectCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let entry = head;
      while (entry !== slow) {
        entry = entry.next;
        slow = slow.next;
      }
      return entry;
    }
  }
  return null;
}`;

const program: Program = {
  title: "Find where a cycle starts (Floyd, phase two)",
  code,
  fields: [
    { key: "head", label: "list values", kind: "array", maxLength: 7 },
    { key: "pos", label: "tail links to index (-1 = no cycle)", kind: "number", min: -1, max: 6 },
  ],
  examples: [
    { label: "Example", input: { head: [3, 2, 0, -4], pos: 1 } },
    { label: "Long tail", input: { head: [1, 2, 3, 4, 5, 6, 7], pos: 3 } },
    { label: "No cycle", input: { head: [1, 2, 3], pos: -1 } },
  ],
  check(input) {
    const n = (input.head as number[]).length;
    return (input.pos as number) >= n ? `pos must be -1 or an index from 0 to ${n - 1}.` : null;
  },
  run(input) {
    const values = input.head as number[];
    const pos = input.pos as number;
    const n = values.length;
    const r = recorder();
    const next = (i: number) => (i === NULL_ID ? NULL_ID : i + 1 < n ? i + 1 : pos >= 0 ? pos : NULL_ID);
    const name = (i: number) => (i === NULL_ID ? "null" : String(values[i]));

    const view = (marks: Record<string, number>, tones: Record<number, CellTone> = {}) => {
      const nodes: ListNodeView[] = values.map((value, i) => ({ id: i, value, col: i, tone: tones[i] }));
      const links: ListLink[] = values.map((_, i) => ({ from: i, to: next(i), tone: i === n - 1 && pos >= 0 ? "active" : "idle" }));
      if (pos < 0) nodes.push({ id: NULL_ID, value: null, col: n });
      return { name: "list", nodes, links, pointers: tagsAt(marks, { fast: "tertiary", entry: "secondary" }) };
    };

    let slow = 0;
    let fast = 0;
    r.step(3, `**Phase 1** is the cycle check: slow moves 1 step, fast moves 2. If they meet, there is a loop.`, {
      lists: [view({ slow, fast })],
      vars: { slow: name(slow), fast: name(fast) },
    });

    let guard = 0;
    while (fast !== NULL_ID && next(fast) !== NULL_ID && guard++ < 40) {
      slow = next(slow);
      fast = next(next(fast));
      r.step(6, `slow → ${name(slow)}, fast → ${name(fast)}.`, {
        lists: [view({ slow, fast }, { [slow]: "primary", ...(fast !== NULL_ID ? { [fast]: "tertiary" as const } : {}) })],
        vars: { slow: name(slow), fast: name(fast) },
      });
      if (slow === fast) {
        let entry = 0;
        r.step(8, `They meet at ${values[slow]}. **Phase 2**: put a new pointer \`entry\` on the head. The meeting point is exactly as far from the cycle's start as the head is — so walking both **one step at a time**, they arrive together.`, {
          lists: [view({ slow, entry }, { [slow]: "primary", [entry]: "write" })],
          vars: { entry: name(entry), slow: name(slow) },
        });
        while (entry !== slow) {
          entry = next(entry);
          slow = next(slow);
          r.step(11, `entry → ${name(entry)}, slow → ${name(slow)}.`, {
            lists: [view({ slow, entry }, { [slow]: "primary", [entry]: "write" })],
            vars: { entry: name(entry), slow: name(slow) },
          });
        }
        r.step(13, `entry and slow meet at **${values[entry]}** (index ${entry}) — that's where the cycle begins. **O(n) time, O(1) space**.`, {
          lists: [view({ start: entry }, { [entry]: "success" })],
          vars: { answer: `node ${values[entry]} (index ${entry})` },
          done: true,
        });
        return r.frames;
      }
    }

    r.step(16, `fast reached null, so there is no cycle: return **null**.`, {
      lists: [view({ slow, fast })],
      vars: { answer: "null" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
