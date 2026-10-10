import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const binaryTreeSection: Section = {
  slug: "binary-tree",
  title: "Binary Tree",
  category: "data-structure",
  description: "Hierarchical structures for representing nested relationships and enabling fast search.",
  tagline:
    "Learn how trees branch, how to walk them in every order, and how recursion makes tree problems short — then solve the binary tree questions interviews ask most.",
  illustrationCount: 70,
  outcomes: [
    "What a binary tree is: roots, children, leaves, depth, height and the LeetCode array format",
    "Why trees exist, from file systems and the HTML of this page to search that takes 20 steps for a million items",
    "The kinds of binary trees — full, complete, perfect, balanced, skewed — and the formulas that come with them",
    "When a problem is a tree problem, and whether it wants depth-first or breadth-first search",
    "How to think recursively about trees: pass information down, return answers up",
    "Brute force, optimal and best solutions for 16 interview questions, each with a dry-run simulator",
  ],
  overview: [
    "Trees are where recursion stops being a trick and becomes the natural way to think: a tree is a root with two smaller trees hanging off it, so almost every tree solution is \"solve it for the left subtree, solve it for the right subtree, combine\".",
    "The course starts with a deep introduction — **what** a binary tree is, **why** it exists, the **types** of binary trees, **when** to use one and **how** to work with one — every idea drawn, and every lesson with a simulator.",
    "Then come the **traversals** every other problem builds on, the **most asked interview questions**, and the **views** of a tree. Every problem goes from **brute force** to **optimal** to the **best solution**, with code in four languages, a simulator that shows the tree changing step by step, and the common **variations** of the question.",
  ],
  requirements: [
    "Comfort writing functions, including a function that calls itself",
    "The Stack course helps: depth-first search is a stack, and breadth-first search is a queue",
  ],
  topics: [
    ...chapterTopics("Introduction to binary trees", [
      lesson("what-is-a-binary-tree", "What is a binary tree?"),
      lesson("why-binary-trees", "Why do we use a binary tree?"),
      lesson("types-of-binary-trees", "Types of binary trees"),
      lesson("when-to-use-a-binary-tree", "When should you use a binary tree?"),
      lesson("how-to-use-a-binary-tree", "How do we use a binary tree?"),
    ]),

    ...chapterTopics("Tree traversals", [
      problem("tree-traversals", "Preorder, Inorder & Postorder Traversal", "Easy"),
      problem("level-order-traversal", "Level Order Traversal (BFS)", "Medium"),
    ]),

    ...chapterTopics("Most asked interview questions", [
      problem("maximum-depth", "Maximum Depth of Binary Tree", "Easy"),
      problem("invert-binary-tree", "Invert Binary Tree", "Easy"),
      problem("same-and-symmetric-tree", "Same Tree & Symmetric Tree", "Easy"),
      problem("merge-two-binary-trees", "Merge Two Binary Trees", "Easy"),
      problem("average-of-levels", "Average of Levels in Binary Tree", "Easy"),
      problem("binary-tree-paths", "Binary Tree Paths", "Easy"),
      problem("sum-of-left-leaves", "Sum of Left Leaves", "Easy"),
      problem("sum-root-to-leaf-binary", "Sum of Root To Leaf Binary Numbers", "Easy"),
      problem("subtree-of-another-tree", "Subtree of Another Tree", "Easy"),
      problem("cousins-in-binary-tree", "Cousins in Binary Tree", "Easy"),
      problem("path-sum", "Path Sum I, II & III", "Medium"),
      problem("lowest-common-ancestor", "Lowest Common Ancestor of a Binary Tree", "Medium"),
    ]),

    ...chapterTopics("Views of a binary tree", [
      problem("left-view", "Left View of Binary Tree", "Easy"),
      problem("top-view", "Top View of Binary Tree", "Medium"),
    ]),
  ],
};
