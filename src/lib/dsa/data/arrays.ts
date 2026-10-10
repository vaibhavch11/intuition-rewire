import type { Difficulty, Section, Topic } from "../types";

type TopicSeed = Omit<Topic, "chapter">;

const lesson = (slug: string, title: string): TopicSeed => ({ slug, title });

const problem = (
  slug: string,
  title: string,
  difficulty: Difficulty
): TopicSeed => ({
  slug,
  title,
  kind: "problem",
  difficulty,
  hasCodeSolution: true,
});

function chapterTopics(chapter: string, seeds: TopicSeed[]): Topic[] {
  return seeds.map((seed) => ({ ...seed, chapter }));
}

export const arraysSection: Section = {
  slug: "arrays",
  title: "Arrays",
  category: "data-structure",
  description:
    "Contiguous, indexable memory — the foundation almost every other data structure builds on.",
  tagline:
    "Start with the most fundamental data structure — why it exists and how to use it — then solve the 16 array questions interviews ask most.",
  illustrationCount: 73,
  slideCount: 45,
  outcomes: [
    "Why arrays exist, and what their contiguous memory layout makes cheap and expensive",
    "How to create, read, update and loop over arrays in JavaScript, Python, Java and C++",
    "When an array is the right tool, and how a problem's constraints point to the approach",
    "The 16 most asked array interview questions, from Two Sum to Merge Intervals",
    "A repeatable method for every problem: brute force, then optimal, then the best solution",
    "Dry-running every best solution step by step with an interactive simulator, on your own input",
  ],
  overview: [
    "Arrays are the first data structure everyone learns and the one interviews lean on most. This course is written to be read **from top to bottom**: whether you are writing your first loop or brushing up for interviews, every idea is introduced before it is used.",
    "It starts with **why** arrays exist and how they sit in memory, then **how** to use them in real code, then **when** they are the right tool.",
    "From there you solve the **16 most asked array interview questions**. Every problem is solved the way you should solve it in an interview: first the **brute force**, then an **optimal** improvement, then the **best solution**. Each one comes with a picture of the key idea, code in four languages, the complexity of every approach, and a simulator you can dry-run with your own input.",
  ],
  requirements: [
    "Comfort writing loops, conditionals, and functions in at least one language",
    "No prior data structures experience — every term is introduced before it is used",
    "No prior big-O knowledge — complexity is built up from counting operations",
    "A willingness to attempt each problem before revealing its solution",
  ],
  topics: [
    ...chapterTopics("Introduction to arrays", [
      lesson("intro-why-arrays", "Why do we need arrays?"),
      lesson("intro-memory-model", "Understanding the memory model"),
      lesson("intro-understanding-the-problem", "Understanding the problem"),
      lesson("intro-possible-solution", "Exploring a possible solution"),
      lesson("intro-supported-operations", "Overview of supported operations"),
      lesson("intro-internal-mechanics", "Internal mechanics of arrays"),
      lesson("intro-working-example", "Working example"),
    ]),

    ...chapterTopics("Using arrays in code", [
      lesson("code-create-read-update", "Creating, reading and updating an array"),
      lesson("code-traversal", "Traversing an array"),
      lesson("code-building-blocks", "Everyday array building blocks"),
      lesson("code-common-mistakes", "Common mistakes and how to avoid them"),
    ]),

    ...chapterTopics("Solving problems with arrays", [
      lesson("when-right-choice", "When is an array the right choice?"),
      lesson("when-reading-constraints", "Reading constraints to pick an approach"),
      lesson("when-toolkit", "The array problem-solving toolkit"),
      lesson("when-dry-run", "How to dry run an array problem"),
    ]),

    ...chapterTopics("Most asked interview questions", [
      problem("two-sum", "Two Sum", "Easy"),
      problem("sa-move-zeroes", "Move Zeroes", "Easy"),
      problem("sa-buy-sell-stock", "Best Time to Buy and Sell Stock", "Easy"),
      problem("sa-majority-element", "Majority Element", "Easy"),
      problem("sa-sort-colors", "Sort 0s, 1s and 2s", "Medium"),
      problem("sa-maximum-subarray", "Maximum Subarray Sum", "Medium"),
      problem("sa-rotate-array", "Rotate Array", "Medium"),
      problem("sa-product-except-self", "Product of Array Except Self", "Medium"),
      problem("find-all-duplicates", "Find All Duplicates in an Array", "Medium"),
      problem("sa-peak-element", "Find Peak Element", "Medium"),
      problem("tp-container-with-most-water", "Container With Most Water", "Medium"),
      problem("tp-three-sum", "3Sum", "Medium"),
      problem("ps-subarray-sum-equals-k", "Subarray Sum Equals K", "Medium"),
      problem("increasing-triplet", "Increasing Triplet Subsequence", "Medium"),
      problem("kth-largest-element", "Kth Largest Element in an Array", "Medium"),
      problem("ls-merge-intervals", "Merge Intervals", "Medium"),
    ]),
  ],
};
