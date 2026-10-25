import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const sortingSection: Section = {
  slug: "sorting",
  title: "Sorting",
  category: "algorithm",
  description: "Comparison and non-comparison based sorting — from bubble sort intuition to quicksort partitioning.",
  tagline:
    "See how every classic sorting algorithm works, step by step, then use sorting to crack the interview questions where putting things in order is the whole trick.",
  illustrationCount: 46,
  outcomes: [
    "What sorting is, and what stable, in-place and comparison-based mean",
    "How bubble, selection, insertion, merge, quick, counting and radix sort work — each drawn and in a simulator",
    "The time and space of every algorithm, and why no comparison sort beats O(n log n)",
    "Which algorithm your language's built-in sort uses, and when to write your own",
    "4 sorting patterns: sort then scan, custom comparators, counting and partitioning, and merge sort tricks",
    "The sorting interview questions asked most, from Contains Duplicate to Reverse Pairs",
  ],
  overview: [
    "Sorting is the most used algorithm in programming, and one of the most useful tricks in interviews: once data is in order, duplicates sit next to each other, intervals line up, and a binary search or two pointers can finish the job.",
    "The introduction shows **how each sorting algorithm works** — bubble, selection, insertion, merge, quick, counting and radix — with a drawing and a simulator for every one, the cost of each, and how to choose between them.",
    "Then come **4 patterns, from easiest to hardest**, each taught through the interview questions that use it, with code in four languages, the complexity of every approach and a simulator you can step through.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Arrays course, or equivalent familiarity with indexes and swapping",
    "Recursion helps for merge sort and quick sort — it's explained as we go",
  ],
  topics: [
    ...chapterTopics("Introduction to sorting", [
      lesson("what-is-sorting", "What is sorting, and why does it matter?"),
      lesson("bubble-sort", "Bubble sort: swap neighbours until nothing moves"),
      lesson("selection-sort", "Selection sort: pick the smallest, put it next"),
      lesson("insertion-sort", "Insertion sort: grow a sorted prefix"),
      lesson("merge-sort", "Merge sort: split, sort, merge"),
      lesson("quick-sort", "Quick sort: partition around a pivot"),
      lesson("counting-and-radix-sort", "Counting sort and radix sort: sorting without comparing"),
      lesson("choosing-a-sorting-algorithm", "Choosing a sorting algorithm, and spotting a sorting question"),
    ]),

    ...chapterTopics("Pattern 1 · Sort first, then scan", [
      problem("contains-duplicate", "Contains Duplicate", "Easy"),
      problem("minimum-absolute-difference", "Minimum Absolute Difference", "Easy"),
      problem("meeting-rooms", "Meeting Rooms", "Easy"),
      problem("h-index", "H-Index", "Medium"),
      problem("non-overlapping-intervals", "Non-overlapping Intervals", "Medium"),
      problem("meeting-rooms-ii", "Meeting Rooms II", "Medium"),
    ]),

    ...chapterTopics("Pattern 2 · Custom comparators", [
      problem("relative-sort-array", "Relative Sort Array", "Easy"),
      problem("sort-characters-by-frequency", "Sort Characters By Frequency", "Medium"),
      problem("largest-number", "Largest Number", "Medium"),
    ]),

    ...chapterTopics("Pattern 3 · Counting and partitioning", [
      problem("height-checker", "Height Checker", "Easy"),
      problem("sort-array-by-parity", "Sort Array By Parity", "Easy"),
      problem("maximum-gap", "Maximum Gap", "Hard"),
    ]),

    ...chapterTopics("Pattern 4 · Merge sort tricks", [
      problem("merge-sorted-array", "Merge Sorted Array", "Easy"),
      problem("sort-list", "Sort List", "Medium"),
      problem("count-inversions", "Count Inversions", "Medium"),
      problem("reverse-pairs", "Reverse Pairs", "Hard"),
    ]),
  ],
};
