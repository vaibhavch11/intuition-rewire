import { SimHeap, heapTree, lineOf } from "../heap";
import { recorder, type CellTone, type Program } from "../types";

const code = `function leastInterval(tasks, n) {
  const count = new Map();
  for (const t of tasks) count.set(t, (count.get(t) ?? 0) + 1);
  const ready = Heap.from([...count.values()], (a, b) => b - a);   // copies left per task, most first
  const cooling = [];                        // [copies left, time it may run again], oldest first
  let time = 0;
  while (ready.size() > 0 || cooling.length > 0) {
    time++;
    if (ready.size() > 0) {
      const left = ready.pop() - 1;          // run the task with the most copies left
      if (left > 0) cooling.push([left, time + n]);
    }                                        // otherwise the CPU idles for this unit
    if (cooling.length > 0 && cooling[0][1] === time) ready.push(cooling.shift()[0]);
  }
  return time;
}`;

const L = {
  count: lineOf(code, "for (const t of tasks) count.set("),
  ready: lineOf(code, "const ready = Heap.from("),
  time: lineOf(code, "time++;"),
  run: lineOf(code, "const left = ready.pop() - 1;"),
  cool: lineOf(code, "if (left > 0) cooling.push("),
  idle: lineOf(code, "// otherwise the CPU idles"),
  back: lineOf(code, "if (cooling.length > 0 && cooling[0][1] === time)"),
  ret: lineOf(code, "return time;"),
};

/** [copies left, letter]: the code's heap holds only the counts; the letter rides along for the picture. */
type Task = [number, string];

const program: Program = {
  title: "Task scheduler (a max-heap and a cooldown queue)",
  code,
  fields: [
    { key: "tasks", label: "tasks (capital letters)", kind: "text", maxLength: 12, hint: "AAABBB" },
    { key: "n", label: "n (cooldown)", kind: "number", min: 0, max: 4 },
  ],
  examples: [
    { label: "The lesson's example", input: { tasks: "AAABBB", n: 2 } },
    { label: "No idling needed", input: { tasks: "ACABDB", n: 1 } },
    { label: "One busy task", input: { tasks: "AAAABC", n: 2 } },
  ],
  check(input) {
    const tasks = (input.tasks as string).replace(/[\s,]/g, "");
    return /^[A-Z]{1,12}$/.test(tasks) ? null : "Write the tasks as 1 to 12 capital letters, like AAABBB.";
  },
  run(input) {
    const tasks = [...(input.tasks as string).replace(/[\s,]/g, "")];
    const n = input.n as number;
    const count = new Map<string, number>();
    for (const t of tasks) count.set(t, (count.get(t) ?? 0) + 1);
    const ready = SimHeap.from([...count.entries()].map(([t, c]): Task => [c, t]), (a: Task, b: Task) => b[0] - a[0]);
    const cooling: [number, number, string][] = [];
    const schedule: string[] = [];
    let time = 0;
    const r = recorder();

    const views = (tones: Record<number, CellTone> = {}, fresh = false) => ({
      trees: [heapTree("ready: tasks allowed to run (copies left in the node)", ready.items.map(([c]) => c), {
        tones,
        captions: Object.fromEntries(ready.items.map(([, t], j) => [j, t])),
      })],
      arrays: [
        { name: "tasks", values: tasks },
        ...(schedule.length ? [{ name: "schedule (slot i is time i + 1)", values: schedule, tones: fresh ? { [schedule.length - 1]: (schedule[schedule.length - 1] === "idle" ? "muted" : "write") as CellTone } : {} }] : []),
        ...(cooling.length ? [{ name: "cooling: task, copies left, may run after time", values: cooling.map(([c, at, t]) => `${t}:${c}→${at}`) }] : []),
      ],
    });

    r.step(L.count, `Count the copies of each task: ${[...count].map(([t, c]) => `${t} × ${c}`).join(", ")}.`, { ...views(), vars: { n, time } });
    r.step(L.ready, `Put the counts in a **max-heap**: the task with the most copies left is on top. The cooldown queue starts empty.`, {
      ...views({ 0: "primary" }),
      vars: { n, time, ready: ready.size(), cooling: 0 },
    });

    while (ready.size() > 0 || cooling.length > 0) {
      time++;
      if (ready.size() > 0) {
        const [c, t] = ready.pop()!;
        const left = c - 1;
        schedule.push(t);
        if (left > 0) {
          cooling.push([left, time + n, t]);
          r.step(L.cool, `Time ${time}: run **${t}**, the task with the most copies left (${c}). ${left} left, so it cools down until after time ${time + n}.`, {
            ...views({}, true),
            vars: { n, time, ready: ready.size(), cooling: cooling.length },
          });
        } else {
          r.step(L.run, `Time ${time}: run **${t}** — its last copy. It's finished.`, {
            ...views({}, true),
            vars: { n, time, ready: ready.size(), cooling: cooling.length },
          });
        }
      } else {
        schedule.push("idle");
        r.step(L.idle, `Time ${time}: every unfinished task is still cooling down — the CPU **idles**.`, {
          ...views({}, true),
          vars: { n, time, ready: 0, cooling: cooling.length },
        });
      }
      if (cooling.length > 0 && cooling[0][1] === time) {
        const [c, , t] = cooling.shift()!;
        const at = ready.push([c, t]);
        r.step(L.back, `${t}'s cooldown is over at time ${time}: it may run again, so it rejoins the heap with ${c} cop${c === 1 ? "y" : "ies"} left.`, {
          ...views({ [at]: "write" }),
          vars: { n, time, ready: ready.size(), cooling: cooling.length },
        });
      }
    }

    const idles = schedule.filter((s) => s === "idle").length;
    r.step(L.ret, `Every task has run. The CPU needed **${time} units**: ${tasks.length} tasks and ${idles} idle unit${idles === 1 ? "" : "s"}.`, {
      ...views(),
      vars: { n, returned: time },
      done: true,
    });
    return r.frames;
  },
};

export default program;
