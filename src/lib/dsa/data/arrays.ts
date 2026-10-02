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

const twoSumCode = `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen[complement] !== undefined) {
      return [seen[complement], i];
    }
    seen[nums[i]] = i;
  }
  return [];
}`;

const twoSum: TopicSeed = {
  ...problem("two-sum", "Two Sum", "Easy"),
  summary:
    "Find two numbers in an array that add up to a target, using a hash map to avoid the O(n^2) brute force.",
  explanation:
    "We walk the array once. At each index we compute the complement (target - current value) and check a hash map of values we've already seen. If the complement is already in the map, we've found our pair. Otherwise we record the current value and keep going. This trades the O(n^2) nested-loop approach for O(n) time at the cost of O(n) space.",
  challengeId: "arr-two-sum-01",
  trace: {
    language: "javascript",
    code: twoSumCode,
    steps: [
      {
        line: 1,
        variables: { nums: [2, 7, 11, 15], target: 9 },
        callStack: ["twoSum(nums, target)"],
        note: "twoSum is called with nums = [2, 7, 11, 15] and target = 9.",
      },
      {
        line: 2,
        variables: { nums: [2, 7, 11, 15], target: 9, seen: {} },
        callStack: ["twoSum(nums, target)"],
        note: "Initialize an empty map `seen` to remember values we've already visited and their index.",
      },
      {
        line: 3,
        variables: { nums: [2, 7, 11, 15], target: 9, seen: {}, i: 0 },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [0],
        note: "Start the loop at i = 0.",
      },
      {
        line: 4,
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          seen: {},
          i: 0,
          complement: 7,
        },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [0],
        note: "complement = target - nums[0] = 9 - 2 = 7.",
      },
      {
        line: 5,
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          seen: {},
          i: 0,
          complement: 7,
        },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [0],
        note: "Is 7 already a key in seen? No — seen is still empty.",
      },
      {
        line: 8,
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          seen: { "2": 0 },
          i: 0,
          complement: 7,
        },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [0],
        note: "Record seen[2] = 0 so future steps know nums[0] = 2 was found at index 0.",
      },
      {
        line: 3,
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          seen: { "2": 0 },
          i: 1,
        },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [1],
        note: "Loop increments: i becomes 1.",
      },
      {
        line: 4,
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          seen: { "2": 0 },
          i: 1,
          complement: 2,
        },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [1],
        note: "complement = target - nums[1] = 9 - 7 = 2.",
      },
      {
        line: 5,
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          seen: { "2": 0 },
          i: 1,
          complement: 2,
        },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [1],
        note: "Is 2 already a key in seen? Yes — seen[2] = 0.",
      },
      {
        line: 6,
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          seen: { "2": 0 },
          i: 1,
          complement: 2,
        },
        callStack: ["twoSum(nums, target)"],
        highlightIndices: [0, 1],
        output: "[0, 1]",
        note: "Match found: seen[2] = 0 and current index i = 1. Return [0, 1].",
      },
    ],
  },
};

export const arraysSection: Section = {
  slug: "arrays",
  title: "Arrays",
  category: "data-structure",
  description:
    "Contiguous, indexable memory — the foundation almost every other data structure builds on.",
  tagline:
    "Start your learning journey with the most fundamental data structure — why it exists, how to use it, and when to reach for it.",
  illustrationCount: 104,
  slideCount: 45,
  outcomes: [
    "Why arrays exist, and what their contiguous memory layout makes cheap and expensive",
    "How to create, read, update and loop over arrays in JavaScript, Python, Java and C++",
    "When an array is the right tool, and how a problem's constraints point to the approach",
    "The most asked interview problems on one array, several arrays, and 2D arrays",
    "Dry-running every solution step by step with an interactive simulator",
    "Seven problem-solving patterns, from two pointers to binary search on the answer",
  ],
  overview: [
    "Arrays are the first data structure everyone learns and the one interviews lean on most. This course is written to be read **from top to bottom**: whether you are writing your first loop or brushing up for interviews, every idea is introduced before it is used.",
    "It starts with **why** arrays exist and how they sit in memory, then **how** to use them in real code, then **when** they are the right tool. From there you solve the most asked array problems — on a single array, on several arrays, and on 2D grids — each with a picture of the idea, the brute force, the optimal solution, code in four languages, and a simulator you can dry-run with your own input.",
    "The final chapters go deeper into the patterns behind those problems — two pointers, sliding window, prefix sums and more — and finish with you designing a dynamic array of your own.",
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

    ...chapterTopics("Multidimensional arrays", [
      lesson("md-understanding-the-problem", "Understanding the problem"),
      lesson("md-defining-dimensions", "Defining dimensions for arrays"),
      lesson("md-possible-solution", "Exploring a possible solution"),
      lesson("md-supported-operations", "Overview of supported operations"),
      lesson(
        "md-internal-mechanics",
        "Internal mechanics of multidimensional arrays"
      ),
      lesson("md-row-major-order", "Understanding row major order"),
      lesson("md-row-major-example", "Example of row major order"),
      problem("md-row-major-traversal", "Row major traversal", "Fundamental"),
      lesson("md-column-major-order", "Understanding column major order"),
      lesson("md-column-major-example", "Example of column major"),
      problem(
        "md-column-major-traversal",
        "Column major traversal",
        "Fundamental"
      ),
    ]),

    ...chapterTopics("Solving problems with arrays", [
      lesson("when-right-choice", "When is an array the right choice?"),
      lesson("when-reading-constraints", "Reading constraints to pick an approach"),
      lesson("when-toolkit", "The array problem-solving toolkit"),
      lesson("when-dry-run", "How to dry run an array problem"),
    ]),

    ...chapterTopics("Most asked: problems on a single array", [
      lesson("sa-roadmap", "Single array problems: a roadmap"),
      problem("sa-second-largest", "Second largest element", "Easy"),
      problem("sa-move-zeroes", "Move zeroes", "Easy"),
      problem("sa-remove-duplicates", "Remove duplicates from a sorted array", "Easy"),
      problem("sa-buy-sell-stock", "Best time to buy and sell stock", "Easy"),
      problem("sa-majority-element", "Majority element", "Easy"),
      problem("sa-maximum-subarray", "Maximum subarray sum (Kadane's algorithm)", "Medium"),
      problem("sa-rotate-array", "Rotate an array by k steps", "Medium"),
      problem("sa-sort-colors", "Sort colors (Dutch national flag)", "Medium"),
      problem("sa-product-except-self", "Product of array except self", "Medium"),
      problem("sa-peak-element", "Find a peak element", "Medium"),
    ]),

    ...chapterTopics("Most asked: problems on multiple arrays", [
      lesson("ma-roadmap", "Working with more than one array"),
      problem("ma-merge-sorted", "Merge two sorted arrays", "Easy"),
      problem("ma-merge-in-place", "Merge sorted arrays in place", "Easy"),
      problem("ma-intersection", "Intersection of two arrays", "Easy"),
      problem("ma-union", "Union of two sorted arrays", "Easy"),
      problem("ma-common-three", "Common elements in three sorted arrays", "Medium"),
    ]),

    ...chapterTopics("Most asked: problems on 2D arrays", [
      lesson("mt-understanding", "Understanding matrix traversal"),
      problem("mt-transpose", "Transpose a matrix", "Easy"),
      problem("mt-pascal-triangle", "Pascal's triangle", "Easy"),
      problem("mt-rotate-in-place", "Rotate a matrix in place", "Medium"),
      problem("mt-spiral-order", "Spiral order traversal", "Medium"),
      problem("mt-set-zeroes", "Set matrix zeroes in place", "Medium"),
      problem("mt-search-matrix", "Search a sorted 2D matrix", "Medium"),
      problem("mt-diagonal-traversal", "Diagonal traversal", "Medium"),
    ]),

    ...chapterTopics("Pattern: Two pointers", [
      lesson("tp-understanding", "Understanding the two pointer pattern"),
      lesson("tp-direct-application", "Identifying direct application"),
      problem("tp-flip-characters", "Flip characters", "Easy"),
      problem("tp-palindrome-checker", "Palindrome checker", "Easy"),
      problem("tp-vowel-exchange", "Vowel exchange", "Easy"),
      problem("tp-reverse-words", "Reverse words", "Easy"),
      lesson("tp-reduction-application", "Identifying reduction application"),
      problem("tp-pair-with-target-sum", "Pair with target sum", "Easy"),
      problem("tp-container-with-most-water", "Container with most water", "Medium"),
      lesson("tp-subproblem-application", "Identifying subproblem application"),
      problem("tp-three-sum", "Three sum", "Medium"),
      problem("tp-trapping-rain-water", "Trapping rain water", "Hard"),
    ]),

    ...chapterTopics("Pattern: Sliding window", [
      lesson("sw-understanding", "Understanding the sliding window pattern"),
      lesson("sw-fixed-size", "Fixed-size windows"),
      problem("sw-max-sum-subarray", "Maximum sum subarray of size k", "Easy"),
      problem("sw-average-of-windows", "Averages of every window", "Easy"),
      lesson("sw-variable-size", "Variable-size windows"),
      problem("sw-longest-unique", "Longest substring without repeats", "Medium"),
      problem("sw-smallest-subarray-sum", "Smallest subarray with a given sum", "Medium"),
      problem("sw-minimum-window", "Minimum window covering a target", "Hard"),
    ]),

    ...chapterTopics("Pattern: Prefix sum", [
      lesson("ps-understanding", "Understanding prefix sums"),
      lesson("ps-building", "Building a prefix sum array"),
      problem("ps-range-sum-queries", "Range sum queries", "Easy"),
      problem("ps-equilibrium-index", "Equilibrium index", "Easy"),
      problem("ps-subarray-sum-equals-k", "Subarray sum equals k", "Medium"),
      lesson("ps-two-dimensions", "Prefix sums in two dimensions"),
      problem("ps-matrix-region-sum", "Matrix region sum", "Medium"),
    ]),

    ...chapterTopics("Pattern: Hash map lookup", [
      lesson("hm-understanding", "Understanding hash map lookups"),
      lesson("hm-trading-space-for-time", "Trading space for time"),
      twoSum,
      problem("hm-longest-consecutive", "Longest consecutive sequence", "Medium"),
      problem("hm-group-by-signature", "Group values by signature", "Medium"),
    ]),

    ...chapterTopics("Pattern: Line sweep", [
      lesson("ls-understanding", "Understanding the line sweep pattern"),
      lesson("ls-events", "Turning intervals into events"),
      problem("ls-merge-intervals", "Merge overlapping intervals", "Medium"),
      problem("ls-insert-interval", "Insert into sorted intervals", "Medium"),
      problem("ls-max-overlap", "Maximum concurrent intervals", "Medium"),
    ]),

    ...chapterTopics("Pattern: Cyclic sort", [
      lesson("cs-understanding", "Understanding cyclic sort"),
      lesson("cs-index-as-address", "Using the index as an address"),
      problem("cs-missing-number", "Find the missing number", "Easy"),
      problem("cs-duplicate-number", "Find the duplicate number", "Medium"),
      problem("cs-first-missing-positive", "First missing positive", "Hard"),
    ]),

    ...chapterTopics("Pattern: Binary search on answer", [
      lesson("bs-understanding", "Understanding binary search on the answer"),
      lesson("bs-monotonic-predicate", "Finding the monotonic predicate"),
      problem("bs-rotated-search", "Search in a rotated array", "Medium"),
      problem("bs-ship-capacity", "Minimum capacity to ship in d days", "Medium"),
      problem("bs-minimum-rate", "Minimum rate to finish in time", "Medium"),
    ]),

    ...chapterTopics("Designing a dynamic array", [
      lesson("da-fixed-capacity", "The fixed capacity problem"),
      lesson("da-growth-strategy", "Choosing a growth strategy"),
      lesson("da-amortised-analysis", "Amortised O(1) append, explained"),
      problem("da-implement", "Implement your own dynamic array", "Medium"),
    ]),
  ],
};
