/**
 * The DSA courses in the order to take them, beginner to advanced. Each step
 * leans on the ones before it: arrays and strings first, then the structures
 * built on them, then the techniques, then trees, graphs and DP. Used by the
 * homepage track card and the /dsa curriculum.
 */
export type PathLevel = "Beginner" | "Intermediate" | "Advanced";

export const DSA_PATH: { level: PathLevel; note: string; courses: { slug: string; blurb: string }[] }[] = [
  {
    level: "Beginner",
    note: "Start here: the structures everything else is built on",
    courses: [
      { slug: "arrays", blurb: "Memory, indexing and the first patterns" },
      { slug: "strings", blurb: "Characters, windows and pointers" },
      { slug: "stack", blurb: "Last in, first out, and when it helps" },
      { slug: "queue", blurb: "First in, first out, and BFS ahead" },
      { slug: "singly-linked-list", blurb: "Nodes, pointers and in-place tricks" },
      { slug: "hash-table", blurb: "Constant-time lookups and counting" },
    ],
  },
  {
    level: "Intermediate",
    note: "The techniques interviews test most",
    courses: [
      { slug: "recursion", blurb: "Thinking in smaller copies of the problem" },
      { slug: "searching", blurb: "Binary search and its many disguises" },
      { slug: "sorting", blurb: "How sorts work and when to reach for one" },
      { slug: "binary-tree", blurb: "Traversals and recursive tree problems" },
      { slug: "binary-search-tree", blurb: "Ordered trees: insert, search, validate" },
      { slug: "heap", blurb: "Priority queues and top-K problems" },
    ],
  },
  {
    level: "Advanced",
    note: "Where it all comes together",
    courses: [
      { slug: "graph", blurb: "BFS, DFS, topological sort and shortest paths" },
      { slug: "trie", blurb: "Prefix trees for words and autocomplete" },
      { slug: "dynamic-programming", blurb: "From recursion to tables, pattern by pattern" },
    ],
  },
];

/**
 * The path with each course's live data attached and numbered 1, 2, 3…
 * across levels. Courses that aren't published are left out, so the numbers
 * never skip.
 */
export function buildPath<C extends { slug: string }>(courses: C[]) {
  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  let n = 0;
  return DSA_PATH.map((stage) => ({
    level: stage.level,
    note: stage.note,
    rows: stage.courses
      .flatMap((c) => {
        const course = bySlug.get(c.slug);
        return course ? [{ blurb: c.blurb, course }] : [];
      })
      .map((row) => ({ ...row, n: ++n })),
  })).filter((stage) => stage.rows.length > 0);
}
