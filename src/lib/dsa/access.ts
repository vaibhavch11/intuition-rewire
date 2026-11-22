/**
 * Courses anyone can read in full, signed in or not. Every other course shows
 * its contents to everyone, but its lessons need a free account to read.
 */
export const FREE_COURSES: ReadonlySet<string> = new Set(["arrays"]);

export function isFreeCourse(slug: string): boolean {
  return FREE_COURSES.has(slug);
}

/**
 * Single lessons anyone can read without an account, in courses that are
 * otherwise members-only. These are the lessons Google shows most often
 * (Search Console, by impressions, Oct–Nov 2026), so a visitor arriving from
 * search reads the page they clicked instead of hitting a sign-up wall.
 * Written as "course/lesson".
 */
export const OPEN_LESSONS: ReadonlySet<string> = new Set([
  "sorting/minimum-absolute-difference",
  "graph/what-is-a-graph",
  "binary-tree/tree-traversals",
  "strings/what-is-a-string",
  "heap/minimum-cost-of-ropes",
  "strings/repeated-substring-pattern",
  "stack/next-greater-element",
  "binary-tree/top-view",
  "binary-search-tree/delete-node-in-a-bst",
  "stack/prefix-to-postfix",
  "dynamic-programming/partition-equal-subset-sum",
  "binary-search-tree/what-is-a-binary-search-tree",
  "strings/longest-common-subsequence",
  "stack/prefix-to-infix",
  "stack/expression-notations",
  "singly-linked-list/swapping-nodes",
  "binary-tree/merge-two-binary-trees",
  "binary-search-tree/search-and-insert",
  "sorting/maximum-gap",
  "dynamic-programming/maximum-product-subarray",
  "strings/find-the-first-occurrence",
  "graph/redundant-connection",
  "stack/postfix-to-prefix",
  "recursion/types-of-recursion",
  "strings/minimum-window-substring",
  "sorting/sort-characters-by-frequency",
  "heap/merge-k-sorted-lists",
  "heap/what-is-a-heap",
  "singly-linked-list/doubly-and-circular-operations",
  "strings/longest-palindromic-substring",
  "strings/reverse-string",
  "sorting/sort-array-by-parity",
  "singly-linked-list/why-linked-lists",
  "sorting/bubble-sort",
  "binary-tree/why-binary-trees",
  "strings/immutability-and-building",
  "binary-tree/subtree-of-another-tree",
  "sorting/what-is-sorting",
]);

/** Whether anyone can read this lesson without an account: its whole course is free, or the lesson is open. */
export function isFreeLesson(courseSlug: string, lessonSlug: string): boolean {
  return isFreeCourse(courseSlug) || OPEN_LESSONS.has(`${courseSlug}/${lessonSlug}`);
}
