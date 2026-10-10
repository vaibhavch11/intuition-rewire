import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const heapSection: Section = {
  slug: "heap",
  title: "Heap",
  category: "data-structure",
  description: "A tree in an array that keeps the smallest (or largest) value on top — the engine behind priority queues, top-k and streaming medians.",
  tagline:
    "Learn how a heap keeps the smallest or largest value one step away, then use it to crack the top-k, merging, scheduling and streaming questions interviews ask most.",
  illustrationCount: 62,
  outcomes: [
    "What a heap is: a complete binary tree with the smallest (or largest) value always on top, stored in a plain array",
    "How push and pop keep it in order with sift up and sift down, in O(log n) — and how to build one from n values in O(n)",
    "How to use the built-in heap in Python, Java and C++, a small reusable heap for JavaScript, and custom ordering with comparators",
    "When a problem wants a heap: top k, repeated greedy choices, merging k sorted lists and running medians",
    "Heapify and heap sort, built from scratch",
    "Brute force, optimal and best solutions for the 12 heap questions interviews ask most, each with a dry-run simulator",
  ],
  overview: [
    "A heap answers one question instantly — **what's the smallest (or largest) value right now?** — and keeps answering it while values come and go, at O(log n) per change. That's exactly what a priority queue needs, and why heaps show up in schedulers, shortest-path algorithms and every “top k” question.",
    "The introduction is short but complete: **what** a heap is, **how** push and pop work, **how** to use one in four languages and **when** to reach for it. Every idea is drawn as both the tree and the array it lives in, and every lesson has a simulator you can step through.",
    "Then come **building a heap** (heapify and heap sort) and the **12 most asked interview questions**, ordered from easiest to hardest. Every problem goes from **brute force** to **optimal** to the **best solution**, with code in four languages and its common **variations**.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Binary Tree course helps: a heap is a binary tree, and the pictures use the same words — root, parent, child, leaf",
  ],
  topics: [
    ...chapterTopics("Introduction to heaps", [
      lesson("what-is-a-heap", "What is a heap?"),
      lesson("how-a-heap-works", "How does a heap work?"),
      lesson("how-to-use-a-heap", "How do we use a heap?"),
      lesson("when-to-use-a-heap", "When should you use a heap?"),
    ]),

    ...chapterTopics("Building a heap", [
      problem("build-heap", "Build a Heap from an Array (Heapify)", "Medium"),
      problem("heap-sort", "Heap Sort", "Medium"),
    ]),

    ...chapterTopics("Most asked interview questions", [
      problem("last-stone-weight", "Last Stone Weight", "Easy"),
      problem("kth-largest-in-a-stream", "Kth Largest Element in a Stream", "Easy"),
      problem("minimum-cost-of-ropes", "Minimum Cost of Ropes", "Easy"),
      problem("kth-largest-element", "Kth Largest Element in an Array", "Medium"),
      problem("k-closest-points", "K Closest Points to Origin", "Medium"),
      problem("top-k-frequent-elements", "Top K Frequent Elements", "Medium"),
      problem("k-sorted-array", "Sort a K-Sorted (Nearly Sorted) Array", "Medium"),
      problem("kth-smallest-in-sorted-matrix", "Kth Smallest Element in a Sorted Matrix", "Medium"),
      problem("task-scheduler", "Task Scheduler", "Medium"),
      problem("reorganize-string", "Reorganize String", "Medium"),
      problem("merge-k-sorted-lists", "Merge K Sorted Lists", "Hard"),
      problem("find-median-from-data-stream", "Find Median from Data Stream", "Hard"),
    ]),
  ],
};
