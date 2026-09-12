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
    "Start your learning journey by understanding the most fundamental data structure.",
  illustrationCount: 98,
  slideCount: 45,
  outcomes: [
    "How arrays map onto contiguous bytes of RAM and what that controls",
    "How multidimensional arrays serialise via row-major and column-major order",
    "The two pointer pattern in all three of its forms: direct, reduction, and subproblem",
    "Fixed-size and variable-size sliding windows, and when each applies",
    "Line sweep for interval merging and maximum overlap",
    "How to design a dynamic array with amortised O(1) append",
  ],
  overview: [
    "Most engineers can write `arr[i]` without thinking, then freeze when an interviewer asks why that index lookup is **O(1)**. The shortcut works until you hit a problem where the answer depends on knowing how the array sits in memory, how a sliding window updates in amortised constant time, or why sorting first turns an **O(N²)** search into **O(N)**.",
    "This course rebuilds your understanding of arrays from the byte layout up, then walks you through the eight problem-solving patterns that cover almost every array question you will ever see in a coding interview. You finish by implementing a dynamic array of your own.",
  ],
  requirements: [
    "Comfort writing loops, conditionals, and functions in at least one language",
    "No prior data structures experience — every term is introduced before it is used",
    "No prior big-O knowledge — asymptotic notation is built up from counting operations",
    "A willingness to attempt each problem before revealing its solution",
  ],
  topics: [
    ...chapterTopics("Introduction to arrays", [
      lesson("intro-memory-model", "Understanding the memory model"),
      lesson("intro-understanding-the-problem", "Understanding the problem"),
      lesson("intro-possible-solution", "Exploring a possible solution"),
      lesson("intro-supported-operations", "Overview of supported operations"),
      lesson("intro-internal-mechanics", "Internal mechanics of arrays"),
      lesson("intro-working-example", "Working example"),
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

    ...chapterTopics("Pattern: Matrix traversal", [
      lesson("mt-understanding", "Understanding matrix traversal"),
      problem("mt-spiral-order", "Spiral order traversal", "Medium"),
      problem("mt-rotate-in-place", "Rotate a matrix in place", "Medium"),
      problem("mt-diagonal-traversal", "Diagonal traversal", "Medium"),
      problem("mt-set-zeroes", "Set matrix zeroes in place", "Medium"),
    ]),

    ...chapterTopics("Designing a dynamic array", [
      lesson("da-fixed-capacity", "The fixed capacity problem"),
      lesson("da-growth-strategy", "Choosing a growth strategy"),
      lesson("da-amortised-analysis", "Amortised O(1) append, explained"),
      problem("da-implement", "Implement your own dynamic array", "Medium"),
    ]),
  ],
};
