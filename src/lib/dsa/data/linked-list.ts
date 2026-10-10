import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const linkedListSection: Section = {
  slug: "singly-linked-list",
  title: "Linked List",
  category: "data-structure",
  description: "Nodes linked one direction by pointers instead of contiguous memory.",
  tagline:
    "Learn what a linked list really is — boxes joined by arrows — then solve the 12 linked list questions interviews ask most.",
  illustrationCount: 51,
  outcomes: [
    "What a linked list is, and how nodes and next pointers sit in memory",
    "Why linked lists exist, and what they do better and worse than arrays",
    "When to reach for a linked list, and when an array is the better choice",
    "How to create, traverse, insert into and delete from a list in four languages",
    "The 12 most asked linked list interview questions, from reversal to cycle detection",
    "Brute force, optimal and best solutions for every problem, with a dry-run simulator",
  ],
  overview: [
    "Linked lists are where pointer thinking starts. Most mistakes in linked list problems aren't about algorithms at all — they're a lost `next` pointer, a missing null check, or a head that should have moved. This course is built to make those mistakes visible.",
    "It starts with **what** a linked list is, **why** it exists, **when** to use one and **how** to use one in real code — every idea drawn as boxes and arrows, with a simulator for the basic operations.",
    "Then you solve the **12 most asked linked list interview questions**. Every problem is solved the interview way: first the **brute force**, then an **optimal** improvement, then the **best solution**, each with code in four languages, its time and space cost, and a simulator that shows every pointer move.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Arrays course, or equivalent familiarity with indexes and two pointers",
    "No prior pointer experience — references are introduced from scratch",
  ],
  topics: [
    ...chapterTopics("Introduction to linked lists", [
      lesson("what-is-a-linked-list", "What is a linked list?"),
      lesson("why-linked-lists", "Why do we use a linked list?"),
      lesson("when-to-use-a-linked-list", "When should you use a linked list?"),
      lesson("how-to-use-a-linked-list", "How do we use a linked list?"),
    ]),

    ...chapterTopics("Most asked interview questions", [
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
  ],
};
