import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const hashTableSection: Section = {
  slug: "hash-table",
  title: "Hash Map",
  category: "data-structure",
  description: "Key → value lookups in O(1) on average — the tool behind counting, “seen it before?” checks, prefix sums and sliding windows.",
  tagline:
    "Learn how a hash map finds any key in one step, then use it to crack the 11 counting, prefix-sum and sliding-window questions interviews ask most.",
  illustrationCount: 48,
  outcomes: [
    "What a hash map is: keys, values, and the O(1) put, get and remove that make it special",
    "How it works inside: hash functions, buckets, collisions, load factor and resizing",
    "When a problem wants a hash map: counting, “have I seen this before?”, prefix sums and sliding windows",
    "How to use the built-in map in JavaScript, Python, Java and C++, and the traps in each",
    "The prefix sum + hash map trick behind every “subarray with sum …” question",
    "Brute force, optimal and best solutions for 11 interview questions, each with a dry-run simulator",
  ],
  overview: [
    "A hash map stores **key → value** pairs and finds any key in about one step, however many entries it holds. That one ability — looking things up by **what they are** instead of **where they are** — turns a whole family of O(n²) problems into O(n) ones.",
    "The introduction is short but complete: **what** a hash map is, **how** it works inside, **when** to reach for one and **how** to use it in four languages. Every idea is drawn, and every lesson has a simulator you can step through.",
    "Then come **11 interview questions** in three groups — **counting**, **prefix sums + hash map** and **sliding window + hash map** — ordered from easiest to hardest, so each one builds on the last. Every problem goes from **brute force** to **optimal** to the **best solution**, with code in four languages and its common **variations**.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Arrays course helps: prefix sums and the sliding window come back here",
  ],
  topics: [
    ...chapterTopics("Introduction to hash maps", [
      lesson("what-is-a-hash-map", "What is a hash map?"),
      lesson("how-a-hash-map-works", "How does a hash map work?"),
      lesson("when-to-use-a-hash-map", "When should you use a hash map?"),
      lesson("how-to-use-a-hash-map", "How do we use a hash map?"),
    ]),

    ...chapterTopics("Counting with a hash map", [
      problem("count-distinct-in-every-window", "Count Distinct Elements in Every Window", "Easy"),
      problem("array-pairs-divisible-by-k", "Check If Array Pairs Are Divisible by K", "Medium"),
    ]),

    ...chapterTopics("Prefix sums + hash map", [
      problem("largest-subarray-with-zero-sum", "Largest Subarray with 0 Sum", "Medium"),
      problem("largest-subarray-of-0s-and-1s", "Largest Subarray of 0's and 1's", "Medium"),
      problem("count-subarrays-with-zero-sum", "Count All Subarrays with Zero Sum", "Medium"),
      problem("subarray-sum-equals-k", "Subarray Sum Equals K", "Medium"),
      problem("subarray-sums-divisible-by-k", "Subarray Sums Divisible by K", "Medium"),
      problem("equal-0s-1s-and-2s", "Equal Number of 0's, 1's and 2's", "Medium"),
    ]),

    ...chapterTopics("Sliding window + hash map", [
      problem("longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "Medium"),
      problem("longest-k-unique-characters-substring", "Longest K Unique Characters Substring", "Medium"),
      problem("count-substrings-with-at-most-k-unique", "Count Substrings with At Most K Unique Characters", "Hard"),
    ]),
  ],
};
