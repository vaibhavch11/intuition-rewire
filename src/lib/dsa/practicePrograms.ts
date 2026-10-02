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
] as const;

export type PracticeProgramId = (typeof PRACTICE_PROGRAMS)[number]["id"];

export function isPracticeProgram(id: unknown): id is PracticeProgramId {
  return PRACTICE_PROGRAMS.some((program) => program.id === id);
}
