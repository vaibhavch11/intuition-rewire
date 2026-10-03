import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const binaryTreeSection: Section = {
  slug: "binary-tree",
  title: "Binary Tree",
  category: "data-structure",
  description: "Hierarchical structures for representing nested relationships and enabling fast search.",
  tagline:
    "Learn how trees branch, how to walk them in every order, and how recursion makes tree problems short — then solve the tree questions interviews ask most.",
  illustrationCount: 0,
  outcomes: [
    "What a binary tree is: roots, children, leaves, depth and height",
    "Why trees exist, from file systems to the HTML on this page",
    "When a problem is a tree problem, and which traversal it needs",
    "How to build and walk a binary tree in JavaScript, Python, Java and C++",
    "Preorder, inorder, postorder, level order and zigzag traversals — recursive, iterative and Morris",
    "The most asked binary tree questions and tree views, each from brute force to the best solution",
  ],
  overview: [
    "Trees are where recursion stops being a trick and becomes the natural way to think: a tree is a root with two smaller trees hanging off it, so almost every tree solution is \"solve it for the left subtree, solve it for the right subtree, combine\".",
    "The course starts with **what** a binary tree is, **why** it exists, **when** to use one and **how** to build and walk one, with drawings and a simulator.",
    "Then come the **traversals** every other problem builds on, the **most asked interview questions**, and the **views** of a tree. Every problem goes from **brute force** to **optimal** to the **best solution**, with code in four languages and a simulator that shows the tree and the call stack side by side.",
  ],
  requirements: [
    "Comfort writing functions, including a function that calls itself",
    "The Stack and Queue courses help: traversals use both",
  ],
  topics: [
    ...chapterTopics("Introduction to binary trees", [
      lesson("what-is-a-binary-tree", "What is a binary tree?"),
      lesson("why-binary-trees", "Why do we use a binary tree?"),
      lesson("when-to-use-a-binary-tree", "When should you use a binary tree?"),
      lesson("how-to-use-a-binary-tree", "How do we use a binary tree?"),
    ]),

    ...chapterTopics("Tree traversals", [
      problem("preorder-traversal", "Preorder Traversal", "Easy"),
      problem("inorder-traversal", "Inorder Traversal", "Easy"),
      problem("postorder-traversal", "Postorder Traversal", "Easy"),
      problem("level-order-traversal", "Level Order Traversal (BFS)", "Medium"),
      problem("zigzag-level-order", "Zigzag Level Order Traversal", "Medium"),
    ]),

    ...chapterTopics("Most asked interview questions", [
      problem("maximum-depth", "Maximum Depth of Binary Tree", "Easy"),
      problem("invert-binary-tree", "Invert Binary Tree", "Easy"),
      problem("same-tree", "Same Tree", "Easy"),
      problem("symmetric-tree", "Symmetric Tree", "Easy"),
      problem("merge-two-binary-trees", "Merge Two Binary Trees", "Easy"),
      problem("path-sum", "Path Sum", "Easy"),
      problem("binary-tree-paths", "Binary Tree Paths", "Easy"),
      problem("sum-of-left-leaves", "Sum of Left Leaves", "Easy"),
      problem("sum-root-to-leaf-binary", "Sum of Root To Leaf Binary Numbers", "Easy"),
      problem("average-of-levels", "Average of Levels in Binary Tree", "Easy"),
      problem("subtree-of-another-tree", "Subtree of Another Tree", "Easy"),
      problem("cousins-in-binary-tree", "Cousins in Binary Tree", "Easy"),
      problem("balanced-binary-tree", "Balanced Binary Tree", "Easy"),
      problem("diameter-of-binary-tree", "Diameter of Binary Tree", "Easy"),
      problem("lowest-common-ancestor", "Lowest Common Ancestor of a Binary Tree", "Medium"),
    ]),

    ...chapterTopics("Views of a binary tree", [
      problem("left-view", "Left View of Binary Tree", "Easy"),
      problem("right-side-view", "Right Side View of Binary Tree", "Medium"),
      problem("top-view", "Top View of Binary Tree", "Medium"),
    ]),
  ],
};
