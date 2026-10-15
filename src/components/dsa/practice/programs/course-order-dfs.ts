import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { checkEdges, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function findOrder(numCourses, prerequisites) {
  const next = Array.from({ length: numCourses }, () => []);
  for (const [course, pre] of prerequisites) next[pre].push(course);
  const state = new Array(numCourses).fill(0);   // 0 = new, 1 = on the current path, 2 = done
  const finished = [];                           // each course lands after all it unlocks
  const visit = (c) => {
    if (state[c] === 1) return false;            // back onto the current path: a cycle
    if (state[c] === 2) return true;             // already placed
    state[c] = 1;
    for (const d of next[c]) {
      if (!visit(d)) return false;
    }
    state[c] = 2;
    finished.push(c);                            // everything c unlocks is already placed
    return true;
  };
  for (let c = 0; c < numCourses; c++) {
    if (!visit(c)) return [];
  }
  return finished.reverse();                     // last to finish = first to take
}`;

const program: Program = {
  title: "Course schedule II (DFS finishing order)",
  code,
  fields: [
    { key: "numCourses", label: "numCourses", kind: "number", min: 1, max: 8 },
    { key: "prerequisites", label: "prerequisites", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[course,pre] pairs, like [1,0] [2,1]" },
  ],
  examples: [
    { label: "Example", input: { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] } },
    { label: "A cycle", input: { numCourses: 3, prerequisites: [[1, 0], [2, 1], [0, 2]] } },
    { label: "Separate chains", input: { numCourses: 5, prerequisites: [[1, 0], [4, 3], [3, 2]] } },
  ],
  check: (input) => checkEdges(input.numCourses as number, input.prerequisites as number[][]),
  run(input) {
    const n = input.numCourses as number;
    const prerequisites = (input.prerequisites as number[][]).map((p) => [...p]);
    const arrows = prerequisites.map(([course, pre]) => [pre, course]);
    const layout = ringLayout(n, arrows);
    const next: number[][] = Array.from({ length: n }, () => []);
    for (const [course, pre] of prerequisites) next[pre].push(course);
    const state = new Array(n).fill(0);
    const finished: number[] = [];
    const calls: number[] = [];
    const arrowTones: Record<string, EdgeTone> = {};
    const r = recorder();

    const frame = (vars: Record<string, unknown> = {}, result?: number[]) => {
      const tones: Record<number, CellTone> = {};
      state.forEach((s, c) => {
        if (s === 2) tones[c] = "done";
        else if (s === 1) tones[c] = "tertiary";
      });
      if (calls.length) tones[calls[calls.length - 1]] = "primary";
      return {
        graphs: [
          graphView("courses (arrow: pre → course; #k = k-th to finish)", layout, arrows, {
            directed: true,
            tones,
            captions: Object.fromEntries(finished.map((c, i) => [c, `#${i + 1}`])),
            edgeTones: arrowTones,
          }),
        ],
        stacks: [{ name: "current path (call stack)", values: calls.map((c) => `visit(${c})`) }],
        arrays: [result ? { name: "order (finished, reversed)", values: result } : { name: "finished", values: [...finished] }],
        vars,
      };
    };

    const visit = (c: number, from: number | null): boolean => {
      if (state[c] === 1) {
        if (from !== null) arrowTones[`${from}>${c}`] = "write";
        r.step(lineOf(code, "if (state[c] === 1) return false"), `Course **${c}** is already on the current path — we've walked in a circle. The courses on that loop each need another one first: **no order exists**.`, frame({ c }));
        return false;
      }
      if (state[c] === 2) {
        r.step(lineOf(code, "if (state[c] === 2) return true"), `Course ${c} is already finished and placed — nothing more to do.`, frame({ c }));
        return true;
      }
      state[c] = 1;
      calls.push(c);
      if (from !== null) arrowTones[`${from}>${c}`] = "active";
      r.step(
        lineOf(code, "state[c] = 1"),
        from === null ? `Start a walk at course **${c}**: put it on the current path.` : `${from} unlocks **${c}**, so ${c} must come later. Walk into it and put it on the current path.`,
        frame({ c })
      );
      for (const d of next[c]) {
        if (!visit(d, c)) return false;
      }
      state[c] = 2;
      calls.pop();
      finished.push(c);
      if (from !== null) arrowTones[`${from}>${c}`] = "done";
      r.step(
        lineOf(code, "finished.push(c)"),
        next[c].length
          ? `Everything ${c} unlocks (${next[c].join(", ")}) is already finished. So ${c} finishes now — **after** all of them in this list.`
          : `Course ${c} unlocks nothing, so it finishes at once.`,
        frame({ c })
      );
      return true;
    };

    r.step(lineOf(code, "const state = "), `A DFS finishes a course only after every course it unlocks. So the **finishing order is the schedule backwards** — reverse it at the end.`, frame());
    for (let c = 0; c < n; c++) {
      if (state[c] === 2) continue;
      if (!visit(c, null)) {
        r.step(lineOf(code, "if (!visit(c)) return []"), `A cycle means some course can never start: return an **empty** list.`, { ...frame(), done: true });
        return r.frames;
      }
    }
    const order = [...finished].reverse();
    r.step(
      lineOf(code, "return finished.reverse()"),
      `Reverse the finishing order: **${order.join(", ")}**. Every course comes after its prerequisites. Each course and arrow was handled once: **O(V + E)**.`,
      { ...frame({}, order), done: true }
    );
    return r.frames;
  },
};

export default program;
