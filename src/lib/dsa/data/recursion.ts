import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const recursionSection: Section = {
  slug: "recursion",
  title: "Recursion & Backtracking",
  category: "algorithm",
  description: "Breaking problems into smaller versions of themselves, and undoing choices that don't work out.",
  tagline:
    "Learn how a function that calls itself really runs — the call stack, the call tree and the memory it costs — then use backtracking to explore every choice and solve the classic interview puzzles.",
  illustrationCount: 46,
  outcomes: [
    "What recursion is: the base case, the recursive case and the leap of faith",
    "How a recursive call runs on the call stack, and how much memory recursion really uses",
    "The kinds of recursion — linear, tail, tree and divide and conquer — and the order a call tree is walked",
    "Backtracking as a depth-first walk of a decision tree: choose, explore, un-choose, and prune",
    "5 patterns: recursion basics, recursive thinking, subsets and combinations, permutations, and grids and boards",
    "The recursion and backtracking interview questions asked most, from Fibonacci to Sudoku Solver",
  ],
  overview: [
    "**Recursion** solves a problem by solving smaller copies of the same problem. **Backtracking** uses recursion to try choices one at a time and undo the ones that don't lead anywhere — the engine behind every \"generate all\" and puzzle-solving interview question.",
    "The introduction shows **how recursion runs** — the call stack, the call tree it walks, and the memory every call costs — and **how backtracking explores** a tree of choices, with a drawing and a simulator for each.",
    "Then come **5 patterns, from easiest to hardest**, each taught through the interview questions that use it, with code in four languages, the time and space of every approach and a simulator that draws the tree being explored.",
  ],
  requirements: [
    "Comfort writing functions, loops and conditionals in at least one language",
    "Arrays and strings basics; the Stack course helps for the call stack",
    "No prior recursion needed — it's built up from the first call",
  ],
  topics: [
    ...chapterTopics("Introduction to recursion and backtracking", [
      lesson("what-is-recursion", "What is recursion? Base case and recursive case"),
      lesson("the-call-stack-and-memory", "The call stack: how recursion runs and what it costs in memory"),
      lesson("types-of-recursion", "Types of recursion, and the order a call tree is walked"),
      lesson("what-is-backtracking", "What is backtracking? Choose, explore, un-choose"),
      lesson("backtracking-templates-and-pruning", "Backtracking templates, pruning and complexity"),
    ]),

    ...chapterTopics("Pattern 1 · Recursion basics", [
      problem("fibonacci-number", "Fibonacci Number", "Easy"),
      problem("reverse-string", "Reverse String", "Easy"),
      problem("power-of-two", "Power of Two", "Easy"),
      problem("pow-x-n", "Pow(x, n)", "Medium"),
    ]),

    ...chapterTopics("Pattern 2 · Recursive thinking", [
      problem("k-th-symbol-in-grammar", "K-th Symbol in Grammar", "Medium"),
      problem("predict-the-winner", "Predict the Winner", "Medium"),
      problem("different-ways-to-add-parentheses", "Different Ways to Add Parentheses", "Medium"),
    ]),

    ...chapterTopics("Pattern 3 · Subsets and combinations", [
      problem("subsets", "Subsets", "Medium"),
      problem("subsets-ii", "Subsets II", "Medium"),
      problem("combinations", "Combinations", "Medium"),
      problem("combination-sum", "Combination Sum", "Medium"),
      problem("combination-sum-ii", "Combination Sum II", "Medium"),
      problem("letter-combinations-of-a-phone-number", "Letter Combinations of a Phone Number", "Medium"),
    ]),

    ...chapterTopics("Pattern 4 · Permutations and building strings", [
      problem("permutations", "Permutations", "Medium"),
      problem("permutations-ii", "Permutations II", "Medium"),
      problem("generate-parentheses", "Generate Parentheses", "Medium"),
      problem("palindrome-partitioning", "Palindrome Partitioning", "Medium"),
    ]),

    ...chapterTopics("Pattern 5 · Grids and boards", [
      problem("word-search", "Word Search", "Medium"),
      problem("n-queens", "N-Queens", "Hard"),
      problem("sudoku-solver", "Sudoku Solver", "Hard"),
    ]),
  ],
};
