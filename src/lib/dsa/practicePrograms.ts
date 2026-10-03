/**
 * Every dry-run simulator a lesson can embed. The step-by-step logic for each
 * lives in `src/components/dsa/practice/programs`, loaded only on the pages
 * that use it; this list is small enough for the server and the admin to share.
 */
export const PRACTICE_PROGRAMS = [
  { id: "find-max", title: "Find the largest element" },
  { id: "reverse-in-place", title: "Reverse an array in place" },
  { id: "second-largest", title: "Second largest element" },
  { id: "move-zeroes", title: "Move zeroes to the end" },
  { id: "remove-duplicates", title: "Remove duplicates from a sorted array" },
  { id: "stock-buy-sell", title: "Best time to buy and sell stock" },
  { id: "majority-element", title: "Majority element (Boyer–Moore voting)" },
  { id: "kadane", title: "Maximum subarray sum (Kadane's algorithm)" },
  { id: "rotate-array", title: "Rotate an array by k steps" },
  { id: "sort-colors", title: "Sort colors (Dutch national flag)" },
  { id: "product-except-self", title: "Product of array except self" },
  { id: "peak-element", title: "Find a peak element" },
  { id: "merge-sorted", title: "Merge two sorted arrays" },
  { id: "merge-in-place", title: "Merge sorted arrays in place" },
  { id: "intersection", title: "Intersection of two arrays" },
  { id: "union-sorted", title: "Union of two sorted arrays" },
  { id: "common-three", title: "Common elements in three sorted arrays" },
  { id: "transpose", title: "Transpose a matrix" },
  { id: "rotate-matrix", title: "Rotate a matrix by 90°" },
  { id: "spiral-order", title: "Spiral order traversal" },
  { id: "set-zeroes", title: "Set matrix zeroes" },
  { id: "diagonal-traversal", title: "Diagonal traversal" },
  { id: "search-matrix", title: "Search a sorted 2D matrix" },
  { id: "pascal-triangle", title: "Pascal's triangle" },
  { id: "merge-intervals", title: "Merge overlapping intervals" },
  { id: "two-sum", title: "Two Sum (one-pass hash map)" },
  { id: "find-all-duplicates", title: "Find all duplicates (marking by sign)" },
  { id: "container-with-most-water", title: "Container with most water (two pointers)" },
  { id: "three-sum", title: "3Sum (sort + two pointers)" },
  { id: "subarray-sum-k", title: "Subarray sum equals k (prefix sums + hash map)" },
  { id: "increasing-triplet", title: "Increasing triplet subsequence" },
  { id: "kth-largest", title: "Kth largest element (quickselect)" },
  { id: "reverse-linked-list", title: "Reverse a linked list (three pointers)" },
  { id: "ll-traverse", title: "Walk a linked list" },
  { id: "array-insert-front", title: "Insert at the front of an array" },
  { id: "ll-insert-front", title: "Insert at the front of a linked list" },
  { id: "ll-get-at", title: "Get the kth node of a linked list" },
  { id: "ll-insert-at", title: "Insert a value at a position" },
  { id: "ll-delete-value", title: "Delete the first node with a value" },
  { id: "middle-of-linked-list", title: "Middle of a linked list (slow and fast pointers)" },
  { id: "merge-two-sorted-lists", title: "Merge two sorted lists (splice with a dummy node)" },
  { id: "remove-duplicates-sorted-list", title: "Remove duplicates from a sorted list" },
  { id: "linked-list-cycle", title: "Linked list cycle (Floyd's tortoise and hare)" },
  { id: "linked-list-cycle-ii", title: "Find where a cycle starts (Floyd, phase two)" },
  { id: "palindrome-linked-list", title: "Palindrome linked list (reverse the second half)" },
  { id: "intersection-of-two-lists", title: "Intersection of two lists (switching pointers)" },
  { id: "remove-nth-from-end", title: "Remove the nth node from the end (one pass, two pointers)" },
  { id: "swapping-nodes", title: "Swap the kth node from the start and the end" },
  { id: "add-two-numbers", title: "Add two numbers stored as linked lists" },
  { id: "reorder-list", title: "Reorder list (middle, reverse, weave)" },
] as const;

export type PracticeProgramId = (typeof PRACTICE_PROGRAMS)[number]["id"];

export function isPracticeProgram(id: unknown): id is PracticeProgramId {
  return PRACTICE_PROGRAMS.some((program) => program.id === id);
}
