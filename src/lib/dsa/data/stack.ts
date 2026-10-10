import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const stackSection: Section = {
  slug: "stack",
  title: "Stack",
  category: "data-structure",
  description: "Last-in, first-out — the structure behind call stacks, undo history, and expression parsing.",
  tagline:
    "Learn the last-in, first-out structure behind undo, the call stack and every calculator — then solve the 13 stack questions interviews ask most.",
  illustrationCount: 78,
  outcomes: [
    "What a stack is, why only the top is ever touched, and what underflow and overflow mean",
    "Why stacks exist, from the call stack and recursion to undo, brackets and backtracking",
    "When a problem is secretly a stack problem: matching, cancelling, undoing and \"the nearest bigger\"",
    "How to use the built-in stack in JavaScript, Python, Java and C++, and build your own on a linked list",
    "Infix, prefix and postfix notation, and the monotonic stack pattern behind the hardest questions",
    "Brute force, optimal and best solutions for 13 interview questions, each with a dry-run simulator",
  ],
  overview: [
    "A stack only lets you touch the **top**: push something on, pop the last thing off. That one rule turns out to be exactly what you need whenever the most recent thing matters most — the latest open bracket, the function that was called last, the last edit you want to undo.",
    "The course starts with **what** a stack is, **why** it exists, **when** to use one and **how** to build one, then two ideas the interview questions lean on: **prefix, infix and postfix notation**, and the **monotonic stack**. Every idea is drawn, and every lesson has a simulator you can step through.",
    "Then you solve the **13 most asked stack interview questions** — implementations, bracket matching, a min & max stack, expression conversions, next greater elements, asteroid collisions, decoding strings, the largest rectangle in a histogram and trapping rain water. Every problem goes from **brute force** to **optimal** to the **best solution**, with code in four languages.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Arrays course, or equivalent familiarity with arrays and indexes",
    "The Linked List course helps for one lesson (a stack built on nodes), but isn't required",
  ],
  topics: [
    ...chapterTopics("Introduction to stacks", [
      lesson("what-is-a-stack", "What is a stack?"),
      lesson("why-stacks", "Why do we use a stack?"),
      lesson("when-to-use-a-stack", "When should you use a stack?"),
      lesson("how-to-use-a-stack", "How do we use a stack?"),
      lesson("expression-notations", "Infix, prefix and postfix"),
      lesson("monotonic-stack", "The monotonic stack"),
    ]),

    ...chapterTopics("Most asked interview questions", [
      problem("stack-using-array", "Stack Implementation using Arrays", "Easy"),
      problem("valid-parentheses", "Valid Parentheses", "Easy"),
      problem("stack-using-queues", "Stack Implementation using Queue", "Easy"),
      problem("next-greater-element", "Next Greater Element I", "Easy"),
      problem("min-max-stack", "Design Min & Max Stack", "Medium"),
      problem("next-greater-element-ii", "Next Greater Element II", "Medium"),
      problem("asteroid-collision", "Asteroid Collision", "Medium"),
      problem("decode-string", "Decode String", "Medium"),
      problem("prefix-to-infix", "Prefix to Infix Conversion", "Medium"),
      problem("prefix-to-postfix", "Prefix to Postfix Conversion", "Medium"),
      problem("postfix-to-prefix", "Postfix to Prefix Conversion", "Medium"),
      problem("largest-rectangle-in-histogram", "Largest Rectangle in Histogram", "Hard"),
      problem("trapping-rain-water", "Trapping Rain Water", "Hard"),
    ]),
  ],
};
