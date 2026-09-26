import type { Section, SectionCategory } from "../types";
import { arraysSection } from "./arrays";
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
  placeholderSection(
    "singly-linked-list",
    "Singly Linked List",
    "Nodes linked one direction by pointers instead of contiguous memory.",
    "data-structure"
  ),
  placeholderSection(
    "doubly-linked-list",
    "Doubly Linked List",
    "Nodes linked in both directions, trading extra memory for O(1) backward traversal.",
    "data-structure"
  ),
  placeholderSection(
    "hash-table",
    "Hash Table",
    "Constant-time lookup by trading memory for a hashing function and collision strategy.",
    "data-structure"
  ),
  placeholderSection(
    "stack",
    "Stack",
    "Last-in, first-out — the structure behind call stacks, undo history, and expression parsing.",
    "data-structure"
  ),
  placeholderSection(
    "queue",
    "Queue",
    "First-in, first-out — the structure behind task scheduling and breadth-first traversal.",
    "data-structure"
  ),
  placeholderSection(
    "binary-tree",
    "Binary Tree",
    "Hierarchical structures for representing nested relationships and enabling fast search.",
    "data-structure"
  ),
  placeholderSection(
    "binary-search-tree",
    "Binary Search Tree",
    "A binary tree with an ordering invariant that makes search, insert, and delete O(log n).",
    "data-structure"
  ),
  placeholderSection(
    "heap",
    "Heap",
    "A tree-shaped priority queue that keeps the min or max element accessible in O(1).",
    "data-structure"
  ),
  placeholderSection(
    "graph",
    "Graph",
    "Nodes and edges for modeling networks, dependencies, and paths between things.",
    "data-structure"
  ),
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
