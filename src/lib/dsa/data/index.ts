import type { Section, SectionCategory } from "../types";
import { arraysSection } from "./arrays";
import { binaryTreeSection } from "./binary-tree";
import { graphSection } from "./graph";
import { hashTableSection } from "./hash-table";
import { heapSection } from "./heap";
import { linkedListSection } from "./linked-list";
import { queueSection } from "./queue";
import { stackSection } from "./stack";
import { stringsSection } from "./strings";

function placeholderSection(
  slug: string,
  title: string,
  description: string,
  category: SectionCategory
): Section {
  return {
    slug,
    title,
    description,
    category,
    topics: [
      {
        slug: "coming-soon",
        title: "Coming soon",
        chapter: "Foundations",
        summary: "This section's dry-run lessons are still being written.",
        explanation:
          "Content for this section hasn't been added yet. Follow the same pattern as src/lib/dsa/data/arrays.ts to add topics with a full trace.",
      },
    ],
  };
}

/**
 * The course structure as shipped in code. Readers see this plus whatever was
 * added or removed in /admin, so read it through `@/lib/dsa/curriculum`.
 */
export const builtInSections: Section[] = [
  arraysSection,
  stringsSection,
  linkedListSection,
  placeholderSection(
    "doubly-linked-list",
    "Doubly Linked List",
    "Nodes linked in both directions, trading extra memory for O(1) backward traversal.",
    "data-structure"
  ),
  hashTableSection,
  stackSection,
  queueSection,
  binaryTreeSection,
  placeholderSection(
    "binary-search-tree",
    "Binary Search Tree",
    "A binary tree with an ordering invariant that makes search, insert, and delete O(log n).",
    "data-structure"
  ),
  heapSection,
  graphSection,
  placeholderSection(
    "trie",
    "Trie (Prefix Tree)",
    "A tree specialized for prefix search over strings — autocomplete's favorite data structure.",
    "data-structure"
  ),
  placeholderSection(
    "sorting",
    "Sorting",
    "Comparison and non-comparison based sorting — from bubble sort intuition to quicksort partitioning.",
    "algorithm"
  ),
  placeholderSection(
    "searching",
    "Searching",
    "Binary search and its many disguises across sorted and rotated structures.",
    "algorithm"
  ),
  placeholderSection(
    "recursion",
    "Recursion & Backtracking",
    "Breaking problems into smaller versions of themselves, and undoing choices that don't work out.",
    "algorithm"
  ),
  placeholderSection(
    "dynamic-programming",
    "Dynamic Programming",
    "Turning exponential brute force into polynomial time by remembering what you've already solved.",
    "algorithm"
  ),
];
