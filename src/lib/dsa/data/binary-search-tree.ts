import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const binarySearchTreeSection: Section = {
  slug: "binary-search-tree",
  title: "Binary Search Tree",
  category: "data-structure",
  description: "A binary tree with an ordering invariant that makes search, insert, and delete O(log n).",
  tagline:
    "Learn the one rule that makes a binary tree searchable — smaller on the left, bigger on the right — how to search, insert, delete and walk it, and what balance has to do with speed. Then solve the BST questions interviews ask most.",
  illustrationCount: 52,
  outcomes: [
    "What a binary search tree is: the ordering rule, and why it lets every comparison skip half the tree",
    "Every core operation, recursively and iteratively: search, insert, find min and max, and delete with its three cases",
    "Every way to walk a BST — in-order, pre-order, post-order and level order — and why in-order comes out sorted",
    "Height, balance and memory: when a BST is O(log n), when it decays to O(n), and how balanced trees fix it",
    "5 patterns: core operations, using the BST property, in-order is sorted, building BSTs, and successors and serialization",
    "The binary search tree interview questions asked most, from Search in a BST to Maximum Sum BST",
  ],
  overview: [
    "A **binary search tree** is a binary tree with one extra rule: everything in a node's left subtree is smaller than it, and everything in its right subtree is bigger. That rule turns every comparison into a decision to throw half the remaining tree away — the same idea as binary search, but on a structure you can also insert into and delete from.",
    "The short introduction covers **every way to work with a BST**: searching and inserting (recursively and with a loop), deleting a node in each of its three cases, the four traversals and why in-order is sorted, and how height, balance and memory decide whether it's fast — each with a drawing and a simulator.",
    "Then come **5 patterns, from easiest to hardest**, each taught through the interview questions that use it, with code in four languages, the time and space of every approach and a simulator that shows the tree step by step.",
  ],
  requirements: [
    "The Binary Tree course, or comfort with tree nodes, recursion over a tree and traversals",
    "Binary search helps: a BST is binary search turned into a tree",
  ],
  topics: [
    ...chapterTopics("Introduction to binary search trees", [
      lesson("what-is-a-binary-search-tree", "What is a binary search tree?"),
      lesson("search-and-insert", "Searching and inserting"),
      lesson("deleting-from-a-bst", "Deleting a node: the three cases"),
      lesson("bst-traversals", "Traversals: why in-order comes out sorted"),
      lesson("balance-height-and-memory", "Balance, height and memory"),
    ]),

    ...chapterTopics("Pattern 1 · Core operations", [
      problem("search-in-a-bst", "Search in a Binary Search Tree", "Easy"),
      problem("range-sum-of-bst", "Range Sum of BST", "Easy"),
      problem("insert-into-a-bst", "Insert into a Binary Search Tree", "Medium"),
      problem("delete-node-in-a-bst", "Delete Node in a BST", "Medium"),
    ]),

    ...chapterTopics("Pattern 2 · Using the BST property", [
      problem("floor-and-ceil-in-a-bst", "Floor and Ceil in a BST", "Easy"),
      problem("validate-binary-search-tree", "Validate Binary Search Tree", "Medium"),
      problem("lowest-common-ancestor-of-a-bst", "Lowest Common Ancestor of a Binary Search Tree", "Medium"),
      problem("trim-a-bst", "Trim a Binary Search Tree", "Medium"),
    ]),

    ...chapterTopics("Pattern 3 · In-order is sorted", [
      problem("minimum-absolute-difference-in-bst", "Minimum Absolute Difference in BST", "Easy"),
      problem("two-sum-iv-input-is-a-bst", "Two Sum IV - Input is a BST", "Easy"),
      problem("kth-smallest-element-in-a-bst", "Kth Smallest Element in a BST", "Medium"),
      problem("binary-search-tree-iterator", "Binary Search Tree Iterator", "Medium"),
      problem("recover-binary-search-tree", "Recover Binary Search Tree", "Medium"),
    ]),

    ...chapterTopics("Pattern 4 · Building BSTs", [
      problem("convert-sorted-array-to-bst", "Convert Sorted Array to Binary Search Tree", "Easy"),
      problem("construct-bst-from-preorder", "Construct BST from Preorder Traversal", "Medium"),
      problem("balance-a-bst", "Balance a Binary Search Tree", "Medium"),
      problem("unique-binary-search-trees", "Unique Binary Search Trees", "Medium"),
    ]),

    ...chapterTopics("Pattern 5 · Successors, serialization and hard problems", [
      problem("inorder-successor-in-bst", "Inorder Successor in BST", "Medium"),
      problem("serialize-and-deserialize-bst", "Serialize and Deserialize BST", "Medium"),
      problem("maximum-sum-bst-in-binary-tree", "Maximum Sum BST in Binary Tree", "Hard"),
    ]),
  ],
};
