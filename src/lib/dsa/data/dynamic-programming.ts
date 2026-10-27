import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const dynamicProgrammingSection: Section = {
  slug: "dynamic-programming",
  title: "Dynamic Programming",
  category: "algorithm",
  description: "Turning exponential brute force into polynomial time by remembering what you've already solved.",
  tagline:
    "Learn to spot overlapping subproblems, solve them top-down with memoization or bottom-up with a table, squeeze the memory down, and work through the DP interview questions pattern by pattern.",
  illustrationCount: 50,
  outcomes: [
    "What dynamic programming is: overlapping subproblems and optimal substructure",
    "Top-down memoization and bottom-up tabulation, and the order each one visits the subproblems",
    "How much memory a DP uses, and how to cut it from a full table to a row or a few variables",
    "A recipe for any DP question: the state, the recurrence, the base cases and the order",
    "5 patterns: 1D DP, grid DP, knapsack, sequences and strings, and state machines and intervals",
    "The dynamic programming interview questions asked most, from Climbing Stairs to Burst Balloons",
  ],
  overview: [
    "**Dynamic programming** is recursion that remembers. When a brute-force search keeps solving the same smaller problems again and again, storing each answer the first time turns exponential time into polynomial time.",
    "The introduction shows **how DP works** — from a slow recursion to **memoization** (top-down) and **tabulation** (bottom-up), the order each one fills in the answers, and how to make the table **use less memory** — with a drawing and a simulator for each.",
    "Then come **5 patterns, from easiest to hardest**, each taught through the interview questions that use it, with code in four languages, the time and space of every approach and a simulator that fills the table step by step.",
  ],
  requirements: [
    "Comfort writing functions, loops and arrays in at least one language",
    "The Recursion & Backtracking course, or comfort with recursive functions",
    "2D arrays for the grid and string patterns",
  ],
  topics: [
    ...chapterTopics("Introduction to dynamic programming", [
      lesson("what-is-dynamic-programming", "What is dynamic programming?"),
      lesson("memoization-top-down", "Top-down: memoization"),
      lesson("tabulation-bottom-up", "Bottom-up: tabulation and the order of the table"),
      lesson("saving-memory", "Saving memory: from a table to a few variables"),
      lesson("solving-a-dp-problem", "How to solve a DP problem: state, recurrence, order"),
    ]),

    ...chapterTopics("Pattern 1 · 1D DP", [
      problem("climbing-stairs", "Climbing Stairs", "Easy"),
      problem("min-cost-climbing-stairs", "Min Cost Climbing Stairs", "Easy"),
      problem("house-robber", "House Robber", "Medium"),
      problem("house-robber-ii", "House Robber II", "Medium"),
      problem("decode-ways", "Decode Ways", "Medium"),
    ]),

    ...chapterTopics("Pattern 2 · Grid DP", [
      problem("unique-paths", "Unique Paths", "Medium"),
      problem("unique-paths-ii", "Unique Paths II", "Medium"),
      problem("minimum-path-sum", "Minimum Path Sum", "Medium"),
      problem("maximal-square", "Maximal Square", "Medium"),
    ]),

    ...chapterTopics("Pattern 3 · Knapsack", [
      problem("partition-equal-subset-sum", "Partition Equal Subset Sum", "Medium"),
      problem("target-sum", "Target Sum", "Medium"),
      problem("coin-change", "Coin Change", "Medium"),
      problem("coin-change-ii", "Coin Change II", "Medium"),
    ]),

    ...chapterTopics("Pattern 4 · Sequences and strings", [
      problem("longest-increasing-subsequence", "Longest Increasing Subsequence", "Medium"),
      problem("longest-common-subsequence", "Longest Common Subsequence", "Medium"),
      problem("edit-distance", "Edit Distance", "Medium"),
      problem("word-break", "Word Break", "Medium"),
    ]),

    ...chapterTopics("Pattern 5 · State machines and intervals", [
      problem("maximum-product-subarray", "Maximum Product Subarray", "Medium"),
      problem("best-time-to-buy-and-sell-stock-with-cooldown", "Best Time to Buy and Sell Stock with Cooldown", "Medium"),
      problem("longest-palindromic-subsequence", "Longest Palindromic Subsequence", "Medium"),
      problem("burst-balloons", "Burst Balloons", "Hard"),
    ]),
  ],
};
