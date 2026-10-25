import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const searchingSection: Section = {
  slug: "searching",
  title: "Searching",
  category: "algorithm",
  description: "Binary search and its many disguises across sorted and rotated structures.",
  tagline:
    "Learn how linear and binary search work, master the binary search templates, then solve the interview questions where halving the search space is the key.",
  illustrationCount: 52,
  outcomes: [
    "How linear search and binary search work, and when each one applies",
    "A bug-free binary search: the loop invariant, the safe midpoint and the off-by-one traps",
    "The lower-bound and upper-bound templates for first and last positions",
    "Binary search on the answer: searching a range of possible answers instead of an array",
    "6 searching patterns: classic search, boundaries, rotated arrays, 2D matrices, search on the answer and the hard cases",
    "The searching interview questions asked most, from Binary Search to Median of Two Sorted Arrays",
  ],
  overview: [
    "Searching is how a program finds things. Checking every element works anywhere but costs O(n); **binary search** halves the remaining candidates at every step and finds anything among a billion sorted values in about 30 comparisons.",
    "The introduction shows **how each search works** — linear search, binary search, the lower and upper bound templates, and binary search on the answer — with a drawing and a simulator for every one.",
    "Then come **6 patterns, from easiest to hardest**, each taught through the interview questions that use it, with code in four languages, the complexity of every approach and a simulator you can step through.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Arrays course, or equivalent familiarity with indexes",
    "The Sorting course helps: binary search needs data in order",
  ],
  topics: [
    ...chapterTopics("Introduction to searching", [
      lesson("what-is-searching", "What is searching? Linear vs binary search"),
      lesson("linear-search", "Linear search: check every element"),
      lesson("how-binary-search-works", "Binary search: halve the search space"),
      lesson("lower-and-upper-bound", "Lower bound and upper bound: the boundary templates"),
      lesson("binary-search-on-the-answer", "Binary search on the answer"),
    ]),

    ...chapterTopics("Pattern 1 · Classic binary search", [
      problem("binary-search", "Binary Search", "Easy"),
      problem("search-insert-position", "Search Insert Position", "Easy"),
      problem("first-bad-version", "First Bad Version", "Easy"),
      problem("sqrt-x", "Sqrt(x)", "Easy"),
      problem("kth-missing-positive-number", "Kth Missing Positive Number", "Easy"),
    ]),

    ...chapterTopics("Pattern 2 · Boundaries", [
      problem("first-and-last-position", "Find First and Last Position of Element in Sorted Array", "Medium"),
      problem("single-element-in-a-sorted-array", "Single Element in a Sorted Array", "Medium"),
      problem("peak-index-in-a-mountain-array", "Peak Index in a Mountain Array", "Medium"),
      problem("find-peak-element", "Find Peak Element", "Medium"),
      problem("find-k-closest-elements", "Find K Closest Elements", "Medium"),
    ]),

    ...chapterTopics("Pattern 3 · Rotated sorted arrays", [
      problem("find-minimum-in-rotated-sorted-array", "Find Minimum in Rotated Sorted Array", "Medium"),
      problem("search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "Medium"),
      problem("search-in-rotated-sorted-array-ii", "Search in Rotated Sorted Array II", "Medium"),
    ]),

    ...chapterTopics("Pattern 4 · Searching a 2D matrix", [
      problem("search-a-2d-matrix", "Search a 2D Matrix", "Medium"),
      problem("search-a-2d-matrix-ii", "Search a 2D Matrix II", "Medium"),
    ]),

    ...chapterTopics("Pattern 5 · Binary search on the answer", [
      problem("koko-eating-bananas", "Koko Eating Bananas", "Medium"),
      problem("capacity-to-ship-packages", "Capacity To Ship Packages Within D Days", "Medium"),
      problem("minimum-days-to-make-bouquets", "Minimum Number of Days to Make m Bouquets", "Medium"),
      problem("magnetic-force-between-two-balls", "Magnetic Force Between Two Balls", "Medium"),
      problem("split-array-largest-sum", "Split Array Largest Sum", "Hard"),
    ]),

    ...chapterTopics("Pattern 6 · Hard binary search", [
      problem("median-of-two-sorted-arrays", "Median of Two Sorted Arrays", "Hard"),
      problem("kth-smallest-pair-distance", "Find K-th Smallest Pair Distance", "Hard"),
    ]),
  ],
};
