import type { EdgeTone } from "@/components/dsa/simulator/visuals";
import { checkEdges, graphView, lineOf, ringLayout } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function canFinish(numCourses, prerequisites) {
  const next = Array.from({ length: numCourses }, () => []);   // course -> courses it unlocks
  const indegree = new Array(numCourses).fill(0);              // prerequisites still to take
  for (const [course, pre] of prerequisites) {
    next[pre].push(course);
    indegree[course]++;
  }
  const queue = [];
  for (let c = 0; c < numCourses; c++) {
    if (indegree[c] === 0) queue.push(c);   // nothing to wait for: ready now
  }
  let taken = 0;
  let head = 0;
  while (head < queue.length) {
    const c = queue[head++];
    taken++;                                // take course c
    for (const d of next[c]) {
      indegree[d]--;                        // one prerequisite of d is done
      if (indegree[d] === 0) queue.push(d); // all of d's prerequisites are done: d is ready
    }
  }
  return taken === numCourses;              // a course never taken is stuck on a cycle
}`;

const program: Program = {
  title: "Course schedule (Kahn's topological sort)",
  code,
  fields: [
    { key: "numCourses", label: "numCourses", kind: "number", min: 1, max: 8 },
    { key: "prerequisites", label: "prerequisites", kind: "pairs", ordered: false, maxLength: 10, min: 0, max: 7, hint: "[course,pre] pairs, like [1,0] [2,1]" },
  ],
  examples: [
    { label: "Example", input: { numCourses: 6, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3], [5, 4]] } },
    { label: "A cycle", input: { numCourses: 4, prerequisites: [[1, 0], [2, 1], [3, 2], [1, 3]] } },
    { label: "Two starts", input: { numCourses: 5, prerequisites: [[2, 0], [2, 1], [3, 2], [4, 2]] } },
  ],
  check: (input) => checkEdges(input.numCourses as number, input.prerequisites as number[][]),
  run(input) {
    const n = input.numCourses as number;
    const prerequisites = (input.prerequisites as number[][]).map((p) => [...p]);
    const arrows = prerequisites.map(([course, pre]) => [pre, course]);
    const layout = ringLayout(n, arrows);
    const next: number[][] = Array.from({ length: n }, () => []);
    const indegree = new Array(n).fill(0);
    for (const [course, pre] of prerequisites) {
      next[pre].push(course);
      indegree[course]++;
    }
    const r = recorder();
    const queue: number[] = [];
    const takenList: number[] = [];
    let head = 0;
    const doneArrows: Record<string, EdgeTone> = {};

    const frame = (current: number | null, hot: [number, number] | null = null, vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      takenList.forEach((c) => (tones[c] = "done"));
      queue.slice(head).forEach((c) => (tones[c] = "tertiary"));
      if (current !== null) tones[current] = "primary";
      return {
        graphs: [
          graphView("courses (arrow: pre → course)", layout, arrows, {
            directed: true,
            tones,
            captions: Object.fromEntries(indegree.map((d, c) => [c, takenList.includes(c) ? "taken" : `waits ${d}`])),
            edgeTones: hot ? { ...doneArrows, [`${hot[0]}>${hot[1]}`]: "active" } : doneArrows,
          }),
        ],
        arrays: [
          { name: "queue (ready)", values: queue.slice(head) },
          { name: "taken, in order", values: [...takenList] },
        ],
        vars: { taken: takenList.length, ...vars },
      };
    };

    for (let c = 0; c < n; c++) if (indegree[c] === 0) queue.push(c);
    r.step(
      lineOf(code, "if (indegree[c] === 0) queue.push(c)"),
      queue.length
        ? `Draw an arrow from each prerequisite to the course it unlocks. "waits k" is the **in-degree**: how many prerequisites a course still needs. Course${queue.length === 1 ? "" : "s"} ${queue.join(", ")} need${queue.length === 1 ? "s" : ""} none, so ${queue.length === 1 ? "it is" : "they are"} ready now.`
        : `Draw an arrow from each prerequisite to the course it unlocks. **Every** course waits for something, so nothing can ever be taken first.`,
      frame(null)
    );

    while (head < queue.length) {
      const c = queue[head++];
      takenList.push(c);
      r.step(lineOf(code, "taken++"), `Take course **${c}**: everything it needed is done. Now tell the courses it unlocks.`, frame(c, null, { c }));
      for (const d of next[c]) {
        indegree[d]--;
        doneArrows[`${c}>${d}`] = "done";
        if (indegree[d] === 0) {
          queue.push(d);
          r.step(lineOf(code, "if (indegree[d] === 0) queue.push(d)"), `Course ${d} has one prerequisite fewer to wait for — and now **none**. It's ready: add it to the queue.`, frame(c, [c, d], { c, d }));
        } else {
          r.step(lineOf(code, "indegree[d]--"), `Course ${d} has one prerequisite fewer to wait for, but still waits for ${indegree[d]} more.`, frame(c, [c, d], { c, d }));
        }
      }
    }

    const stuck = indegree.flatMap((d, c) => (takenList.includes(c) ? [] : [c]));
    r.step(
      lineOf(code, "return taken === numCourses"),
      stuck.length === 0
        ? `All ${n} courses were taken, so it's possible: **true**. Each course and each arrow was handled once: **O(V + E)**.`
        : `The queue is empty but course${stuck.length === 1 ? "" : "s"} ${stuck.join(", ")} ${stuck.length === 1 ? "was" : "were"} never taken: each one sits on a **cycle** of courses waiting for each other, or waits for one that does. The answer is **false**.`,
      { ...frame(null), done: true }
    );
    return r.frames;
  },
};

export default program;
