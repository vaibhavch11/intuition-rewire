import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const queueSection: Section = {
  slug: "queue",
  title: "Queue",
  category: "data-structure",
  description: "First-in, first-out — the structure behind task scheduling and breadth-first traversal.",
  tagline:
    "Learn the first-in, first-out structure behind printers, servers and breadth-first search — then solve the queue questions interviews ask most.",
  illustrationCount: 0,
  outcomes: [
    "What a queue is: a line where the first to arrive is the first served",
    "Why queues exist, from print jobs to message brokers",
    "When a problem needs a queue, and when it needs a double-ended deque",
    "How to build and use a queue in JavaScript, Python, Java and C++",
    "Circular buffers, queues built from stacks, and the monotonic deque",
    "Brute force, optimal and best solutions for every problem, with a dry-run simulator",
  ],
  overview: [
    "A queue is a line: new items join at the **back**, and items leave from the **front**, in exactly the order they arrived. Anything that has to be handled fairly, in order — requests to a server, jobs for a printer, nodes waiting to be explored — sits in a queue.",
    "The course starts with **what** a queue is, **why** it exists, **when** to use one and **how** to build one, with drawings and a simulator you can enqueue and dequeue on.",
    "Then you solve the **most asked queue interview questions**, from building a queue on an array or on two stacks to the sliding window maximum. Every problem goes from **brute force** to **optimal** to the **best solution**, with code in four languages and a simulator.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Stack course is helpful: two of the problems build one structure from the other",
  ],
  topics: [
    ...chapterTopics("Introduction to queues", [
      lesson("what-is-a-queue", "What is a queue?"),
      lesson("why-queues", "Why do we use a queue?"),
      lesson("when-to-use-a-queue", "When should you use a queue?"),
      lesson("how-to-use-a-queue", "How do we use a queue?"),
    ]),

    ...chapterTopics("Most asked interview questions", [
      problem("queue-using-array", "Queue Implementation using Arrays", "Easy"),
      problem("queue-using-stacks", "Queue Implementation using Stacks", "Easy"),
      problem("reverse-first-k", "Reverse the First K Elements of a Queue", "Easy"),
      problem("first-non-repeating-in-stream", "First Non-Repeating Character in a Stream", "Medium"),
      problem("sliding-window-maximum", "Sliding Window Maximum", "Hard"),
    ]),
  ],
};
