import { isComingSoon, type Section } from "./types";

/**
 * Courses that build on each other: prefix sums and sliding windows link arrays,
 * strings and hash maps; stacks and queues are built from each other and from
 * linked lists; trees are walked with a stack (depth-first) or a queue (breadth-first);
 * a heap is a binary tree stored in an array, and the usual priority queue.
 */
const RELATED: Record<string, string[]> = {
  arrays: ["strings", "hash-table", "stack"],
  strings: ["arrays", "hash-table", "stack"],
  "singly-linked-list": ["stack", "queue", "arrays"],
  "hash-table": ["arrays", "strings", "queue"],
  stack: ["queue", "singly-linked-list", "arrays"],
  queue: ["stack", "heap", "binary-tree"],
  "binary-tree": ["heap", "queue", "stack"],
  heap: ["binary-tree", "queue", "arrays"],
};

/** Up to three courses with real lessons to read next, topped up in catalog order. */
export function relatedCourses(currentSlug: string, sections: Section[], count = 3): Section[] {
  const ready = sections.filter((s) => s.slug !== currentSlug && !isComingSoon(s));
  const picked = (RELATED[currentSlug] ?? [])
    .map((slug) => ready.find((s) => s.slug === slug))
    .filter((s): s is Section => Boolean(s));
  for (const s of ready) {
    if (picked.length >= count) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked.slice(0, count);
}
