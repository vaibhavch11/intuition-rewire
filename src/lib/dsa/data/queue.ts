import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const queueSection: Section = {
  slug: "queue",
  title: "Queue",
  category: "data-structure",
  description: "First-in, first-out — the structure behind task scheduling and breadth-first traversal.",
  tagline:
    "Learn the first-in, first-out structure behind printers, servers and breadth-first search — then build queues from arrays, linked lists and stacks, the way interviews ask.",
  illustrationCount: 38,
  outcomes: [
    "What a queue is: a line where the first to arrive is the first served",
    "The four kinds — simple, circular, deque and priority queue — and when each one fits",
    "When a problem wants a queue: arrival order, breadth-first search, time windows and round robin",
    "How to use the built-in queue in JavaScript, Python, Java and C++, and the traps in each",
    "How to build a queue on a circular array and on a linked list",
    "Stacks from queues and queues from stacks, including what “amortized O(1)” really means",
    "Brute force, optimal and best solutions for 5 interview questions, each with a dry-run simulator",
  ],
  overview: [
    "A queue is a line: new items join at the **back**, and items leave from the **front**, in exactly the order they arrived. Anything that has to be handled fairly, in order — requests to a server, jobs for a printer, nodes waiting to be explored — sits in a queue.",
    "The introduction is short but complete: **what** a queue is, the **four kinds** you'll meet, **when** to reach for one and **how** to use it in four languages. Every idea is drawn, and every lesson has a simulator you can step through.",
    "Then come **5 interview questions** in two groups — **building a queue** (on an array, on a linked list) and **one structure from another** (stacks from queues, a queue from stacks) — ordered from easiest to hardest. Every problem goes from **brute force** to **optimal** to the **best solution**, with code in four languages and its common **variations**.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Stack and Linked List courses help: the problems build queues on top of both",
  ],
  topics: [
    ...chapterTopics("Introduction to queues", [
      lesson("what-is-a-queue", "What is a queue?"),
      lesson("types-of-queues", "Types of queues"),
      lesson("when-to-use-a-queue", "When should you use a queue?"),
      lesson("how-to-use-a-queue", "How do we use a queue?"),
    ]),

    ...chapterTopics("Building a queue", [
      problem("queue-using-array", "Queue Implementation using Arrays", "Easy"),
      problem("queue-using-linked-list", "Queue Implementation using a Linked List", "Easy"),
    ]),

    ...chapterTopics("One structure from another", [
      problem("stack-using-two-queues", "Design a Stack using Two Queues", "Easy"),
      problem("stack-using-one-queue", "Design a Stack using a Single Queue", "Medium"),
      problem("queue-using-two-stacks", "Design a Queue using Two Stacks", "Medium"),
    ]),
  ],
};
