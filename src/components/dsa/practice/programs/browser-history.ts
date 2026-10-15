import { lineOf } from "../graphs";
import { dlinked, tagsAt, type DNodeState } from "../structures";
import { recorder, type Program } from "../types";

const code = `class Page {
  constructor(url) {
    this.url = url;
    this.prev = null;                  // the page before (back)
    this.next = null;                  // the page after (forward)
  }
}

class BrowserHistory {
  constructor(homepage) {
    this.curr = new Page(homepage);
  }
  visit(url) {
    const page = new Page(url);
    page.prev = this.curr;             // back from the new page comes here
    this.curr.next = page;             // ...and this drops all forward history
    this.curr = page;
  }
  back(steps) {
    while (steps > 0 && this.curr.prev !== null) {
      this.curr = this.curr.prev;
      steps--;
    }
    return this.curr.url;
  }
  forward(steps) {
    while (steps > 0 && this.curr.next !== null) {
      this.curr = this.curr.next;
      steps--;
    }
    return this.curr.url;
  }
}`;

type Op = { name: "visit"; url: string } | { name: "back" | "forward"; steps: number };

function parse(text: string): Op[] | string {
  const parts = text.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "Enter at least one operation, like visit news.";
  if (parts.length > 10) return "Use at most 10 operations so every step stays readable.";
  const ops: Op[] = [];
  for (const part of parts) {
    const [name, arg, ...rest] = part.split(/\s+/);
    if (rest.length > 0 || arg === undefined) return `"${part}": use visit <page>, back <n> or forward <n>.`;
    if (name === "visit") {
      if (!/^[a-z]{1,5}$/.test(arg)) return `"${part}": page names are 1 to 5 lowercase letters, like news.`;
      ops.push({ name, url: arg });
    } else if (name === "back" || name === "forward") {
      if (!/^\d{1,2}$/.test(arg) || Number(arg) < 1) return `"${part}": ${name} takes a number of steps from 1 to 99.`;
      ops.push({ name, steps: Number(arg) });
    } else return `"${part}" isn't an operation. Use visit <page>, back <n> or forward <n>.`;
  }
  return ops;
}

const program: Program = {
  title: "Browser history on a doubly linked list",
  code,
  fields: [
    { key: "home", label: "homepage", kind: "text", maxLength: 5, hint: "1 to 5 lowercase letters" },
    { key: "ops", label: "operations", kind: "text", maxLength: 120, hint: "visit news, visit mail, back 1, forward 1" },
  ],
  examples: [
    { label: "Example", input: { home: "home", ops: "visit news, visit mail, visit maps, back 1, back 1, forward 1, visit blog, forward 2, back 2, back 7" } },
    { label: "Visit drops forward", input: { home: "home", ops: "visit a, visit b, back 2, visit c, forward 1" } },
  ],
  check(input) {
    if (!/^[a-z]{1,5}$/.test(input.home as string)) return "homepage: 1 to 5 lowercase letters.";
    const ops = parse(input.ops as string);
    return typeof ops === "string" ? ops : null;
  },
  run(input) {
    const ops = parse(input.ops as string) as Op[];
    const r = recorder();
    const pages: DNodeState[] = [{ id: 0, value: input.home as string, prev: null, next: null }];
    let curr = 0;
    // The history as the user can still reach it: from the homepage, following next.
    const chain = () => {
      const out: DNodeState[] = [];
      for (let id: number | null = 0; id !== null; id = pages[id].next) out.push(pages[id]);
      return out;
    };
    const frame = (hot: string[] = [], vars: Record<string, unknown> = {}) => ({
      lists: [dlinked("history", chain(), { tones: { [curr]: "primary" }, pointers: tagsAt({ curr }, { curr: "tertiary" }), hot })],
      vars,
    });

    r.step(lineOf(code, "this.curr = new Page(homepage)"), `Each page is a node: **prev** is where *back* goes, **next** is where *forward* goes. Start on "${pages[0].value}".`, frame());
    for (const op of ops) {
      if (op.name === "visit") {
        const id = pages.length;
        const old = curr;
        const dropped: string[] = [];
        for (let x = pages[old].next; x !== null; x = pages[x].next) dropped.push(pages[x].value as string);
        pages.push({ id, value: op.url, prev: old, next: null });
        pages[old].next = id;
        curr = id;
        r.step(
          lineOf(code, "this.curr.next = page;"),
          `**visit ${op.url}**: a new page after "${pages[old].value}", linked both ways.${dropped.length ? ` Pointing "${pages[old].value}".next at it **drops the forward history** (${dropped.map((d) => `"${d}"`).join(", ")}) — exactly what a real browser does.` : ""} O(1).`,
          frame([`${old}.next`, `${id}.prev`])
        );
      } else {
        const back = op.name === "back";
        let moved = 0;
        while (moved < op.steps && (back ? pages[curr].prev : pages[curr].next) !== null) {
          curr = (back ? pages[curr].prev : pages[curr].next)!;
          moved++;
        }
        const capped = moved < op.steps;
        r.step(
          lineOf(code, back ? "this.curr = this.curr.prev;" : "this.curr = this.curr.next;"),
          `**${op.name} ${op.steps}**: follow ${back ? "prev" : "next"} ${moved} time${moved === 1 ? "" : "s"}${capped ? ` — then there's no ${back ? "earlier" : "later"} page, so stop early` : ""}. Return **"${pages[curr].value}"**. O(steps).`,
          frame([], { returned: `"${pages[curr].value}"` })
        );
      }
    }
    r.step(lineOf(code, "return this.curr.url;"), `Done. Visit is **O(1)**; back and forward cost **O(steps)** because they walk one node at a time — the array version in this lesson makes them O(1) too.`, { ...frame(), done: true });
    return r.frames;
  },
};

export default program;
