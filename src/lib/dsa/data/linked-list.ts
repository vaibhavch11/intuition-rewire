import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const linkedListSection: Section = {
  slug: "singly-linked-list",
  title: "Linked List",
  category: "data-structure",
  description: "Singly, doubly and circular linked lists: nodes joined by pointers instead of contiguous memory.",
  tagline:
    "Learn all three types of linked list — singly, doubly and circular — then solve the interview questions asked most for each.",
  illustrationCount: 74,
  outcomes: [
    "What a linked list is, and how nodes and pointers sit in memory",
    "The three types — singly, doubly and circular — and what each one is good at",
    "Why linked lists exist, and what they do better and worse than arrays",
    "How to build, traverse, insert into and delete from every type, in four languages",
    "The most asked interview questions for singly, doubly and circular lists, from reversal to LRU Cache",
    "Brute force, optimal and best solutions for every problem, with a dry-run simulator",
  ],
  overview: [
    "Linked lists are where pointer thinking starts. Most mistakes in linked list problems aren't about algorithms at all — they're a lost `next` pointer, a missing null check, or a head that should have moved. This course is built to make those mistakes visible.",
    "It starts with **what** a linked list is and its **three types**: **singly** (one `next` pointer), **doubly** (`prev` and `next`) and **circular** (the last node points back to the first). You'll see **why** each exists, **when** to use it, and **how** to build, **traverse**, insert and delete in every type — each idea drawn as boxes and arrows, with a simulator that shows every pointer move.",
    "Then come the interview questions, grouped by type: the **singly linked list** classics, the **doubly linked list** questions behind browser history and LRU caches, and the **circular linked list** questions from rotation to the Josephus game. Every problem is solved the interview way — brute force first, then the best solution — with code in four languages, its time and space cost, and a simulator.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Arrays course, or equivalent familiarity with indexes and two pointers",
    "No prior pointer experience — references are introduced from scratch",
  ],
  topics: [
    ...chapterTopics("Introduction to linked lists", [
      lesson("what-is-a-linked-list", "What is a linked list?"),
      lesson("types-of-linked-lists", "The three types: singly, doubly and circular"),
      lesson("why-linked-lists", "Why do we use a linked list?"),
      lesson("when-to-use-a-linked-list", "When should you use a linked list?"),
      lesson("how-to-use-a-linked-list", "How do we use a singly linked list?"),
      lesson("traversing-linked-lists", "Traversal: walking singly, doubly and circular lists"),
      lesson("doubly-and-circular-operations", "Insert and delete in doubly and circular lists"),
    ]),

    ...chapterTopics("Singly linked list · interview questions", [
      problem("reverse-linked-list", "Reverse a Linked List", "Easy"),
      problem("middle-of-linked-list", "Middle of the Linked List", "Easy"),
      problem("merge-two-sorted-lists", "Merge Two Sorted Lists", "Easy"),
      problem("remove-duplicates-sorted-list", "Remove Duplicates from Sorted List", "Easy"),
      problem("linked-list-cycle", "Linked List Cycle", "Easy"),
      problem("palindrome-linked-list", "Palindrome Linked List", "Easy"),
      problem("intersection-of-two-lists", "Intersection of Two Linked Lists", "Easy"),
      problem("remove-nth-from-end", "Remove Nth Node From End of List", "Medium"),
      problem("swapping-nodes", "Swapping Nodes in a Linked List", "Medium"),
      problem("linked-list-cycle-ii", "Linked List Cycle II", "Medium"),
      problem("add-two-numbers", "Add Two Numbers", "Medium"),
      problem("reorder-list", "Reorder List", "Medium"),
    ]),

    ...chapterTopics("Doubly linked list · interview questions", [
      problem("reverse-doubly-linked-list", "Reverse a Doubly Linked List", "Easy"),
      problem("design-browser-history", "Design Browser History", "Medium"),
      problem("flatten-multilevel-doubly-linked-list", "Flatten a Multilevel Doubly Linked List", "Medium"),
      problem("lru-cache", "LRU Cache", "Medium"),
    ]),

    ...chapterTopics("Circular linked list · interview questions", [
      problem("check-circular-linked-list", "Check if a Linked List is Circular", "Easy"),
      problem("rotate-list", "Rotate List", "Medium"),
      problem("insert-into-sorted-circular-list", "Insert into a Sorted Circular Linked List", "Medium"),
      problem("find-the-winner-of-the-circular-game", "Find the Winner of the Circular Game", "Medium"),
    ]),
  ],
};
