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

export const stringsSection: Section = {
  slug: "strings",
  title: "Strings",
  category: "data-structure",
  description:
    "Character arrays with their own set of classic patterns — two pointers, sliding window, and more.",
  tagline:
    "Continue with the data structure you use every day but rarely look inside.",
  illustrationCount: 76,
  slideCount: 38,
  outcomes: [
    "How characters become bytes, and why length and index can disagree",
    "What immutability costs you, and when to reach for a builder instead",
    "The two pointer pattern applied to reversal, palindromes, and partitioning",
    "Sliding windows over character frequency maps",
    "Anagram and grouping problems solved by canonical signatures",
    "How substring search moves from O(N·M) brute force to O(N + M)",
  ],
  overview: [
    "A string looks like the easiest data structure in the language until a problem asks you to reverse it in place, and you discover `str[i] = 'a'` silently does nothing. Strings are arrays with extra rules — an encoding underneath, and in most languages immutability on top — and both rules change which solutions are even available to you.",
    "This course starts at the byte level, shows you what your language actually allocates when you concatenate in a loop, then works through the five patterns that cover nearly every string question in an interview. Each pattern is introduced on a small example before you apply it to progressively harder problems.",
  ],
  requirements: [
    "Comfort writing loops, conditionals, and functions in at least one language",
    "The Arrays course, or equivalent familiarity with indexing and two pointers",
    "No prior knowledge of character encodings — they are introduced from scratch",
  ],
  topics: [
    ...chapterTopics("Introduction to strings", [
      lesson("intro-characters-and-bytes", "Understanding characters and bytes"),
      lesson("intro-understanding-the-problem", "Understanding the problem"),
      lesson("intro-encodings", "How encodings change what length means"),
      lesson("intro-supported-operations", "Overview of supported operations"),
      lesson("intro-internal-mechanics", "Internal mechanics of strings"),
      lesson("intro-working-example", "Working example"),
    ]),

    ...chapterTopics("Immutability and building", [
      lesson("im-understanding-the-problem", "Understanding the problem"),
      lesson("im-cost-of-concatenation", "The hidden cost of concatenation"),
      lesson("im-string-builders", "How string builders avoid the cost"),
      problem("im-repeat-a-string", "Repeat a string n times", "Fundamental"),
      problem("im-run-length-encoding", "Run length encoding", "Easy"),
    ]),

    ...chapterTopics("Pattern: Two pointers", [
      lesson("tp-understanding", "Understanding the two pointer pattern"),
      lesson("tp-direct-application", "Identifying direct application"),
      problem("tp-reverse-in-place", "Reverse a string in place", "Easy"),
      problem("tp-palindrome-checker", "Palindrome checker", "Easy"),
      problem("tp-vowel-exchange", "Vowel exchange", "Easy"),
      problem("tp-reverse-words", "Reverse words", "Medium"),
      problem("tp-valid-palindrome-ii", "Palindrome after one deletion", "Medium"),
    ]),

    ...chapterTopics("Pattern: Sliding window", [
      lesson("sw-understanding", "Understanding the sliding window pattern"),
      lesson("sw-window-as-frequency-map", "Carrying a frequency map in the window"),
      problem("sw-longest-unique", "Longest substring without repeats", "Medium"),
      problem("sw-longest-k-distinct", "Longest substring with k distinct characters", "Medium"),
      problem("sw-permutation-in-string", "Permutation in a string", "Medium"),
      problem("sw-minimum-window", "Minimum window substring", "Hard"),
    ]),

    ...chapterTopics("Pattern: Frequency counting", [
      lesson("fc-understanding", "Understanding frequency counting"),
      lesson("fc-canonical-signature", "Choosing a canonical signature"),
      problem("fc-valid-anagram", "Valid anagram", "Easy"),
      problem("fc-group-anagrams", "Group anagrams", "Medium"),
      problem("fc-first-unique-character", "First unique character", "Easy"),
    ]),

    ...chapterTopics("Pattern: Substring search", [
      lesson("ss-understanding", "Understanding substring search"),
      lesson("ss-brute-force-cost", "Why brute force degrades to O(N·M)"),
      lesson("ss-prefix-function", "Building the prefix function"),
      problem("ss-find-first-occurrence", "Find the first occurrence", "Medium"),
      problem("ss-repeated-pattern", "Detect a repeated pattern", "Medium"),
    ]),

    ...chapterTopics("Pattern: Parsing and partitioning", [
      lesson("pp-understanding", "Understanding parse-as-you-scan"),
      problem("pp-valid-number", "Validate a number", "Medium"),
      problem("pp-partition-labels", "Partition labels", "Medium"),
      problem("pp-decode-string", "Decode a nested string", "Medium"),
    ]),
  ],
};
