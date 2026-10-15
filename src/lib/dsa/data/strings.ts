import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const stringsSection: Section = {
  slug: "strings",
  title: "Strings",
  category: "data-structure",
  description:
    "Character arrays with their own set of classic patterns — two pointers, sliding window, and more.",
  tagline:
    "Learn what a string really is in memory and what each operation costs, then master the 9 string patterns — from two pointers to dynamic programming — through the interview questions asked most.",
  illustrationCount: 60,
  outcomes: [
    "What a string is, how characters become bytes, and why length means different things in different languages",
    "Why strings are immutable in most languages, what s += c in a loop really costs, and how to build strings fast",
    "The everyday string operations in JavaScript, Python, Java and C++, and the time each one takes",
    "How to read a string question and pick the pattern that solves it",
    "9 patterns from easiest to hardest: two pointers, frequency counting, scan and build, stack, sliding window, expand around the centre, backtracking, string matching and dynamic programming",
    "The string questions interviews ask most, each with a dry-run simulator",
  ],
  overview: [
    "Strings are the data you handle most: names, messages, URLs, code, DNA. They look simple until a question asks you to reverse one in place, count letters in a window, or match a pattern in linear time — and then the details matter.",
    "The introduction is short but complete: **what** a string is, **how** it is stored as bytes, **why** most languages make it immutable, and **what** every common operation costs. Every later lesson builds on those details.",
    "Then come **9 patterns, from easiest to hardest** — each taught through the interview questions that use it, with code in four languages, the complexity of every approach and a simulator you can step through.",
  ],
  requirements: [
    "Comfort writing loops, conditionals and functions in at least one language",
    "The Arrays course helps: a string is an array of characters with a few extra rules",
    "The Hash Map and Stack courses help for the frequency-counting and stack patterns",
  ],
  topics: [
    ...chapterTopics("Introduction to strings", [
      lesson("what-is-a-string", "What is a string, and why does it matter?"),
      lesson("intro-characters-and-bytes", "Characters, bytes and encodings: how strings live in memory"),
      lesson("immutability-and-building", "Immutable strings and the cost of building them"),
      lesson("string-operations", "Everyday string operations and what they cost"),
      lesson("how-to-spot-a-string-pattern", "How to spot the string pattern"),
    ]),

    ...chapterTopics("Pattern 1 · Two pointers", [
      problem("reverse-string", "Reverse String", "Easy"),
      problem("valid-palindrome", "Valid Palindrome", "Easy"),
      problem("valid-palindrome-ii", "Valid Palindrome II", "Easy"),
      problem("reverse-words-in-a-string", "Reverse Words in a String", "Medium"),
    ]),

    ...chapterTopics("Pattern 2 · Frequency counting", [
      problem("valid-anagram", "Valid Anagram", "Easy"),
      problem("first-unique-character", "First Unique Character in a String", "Easy"),
      problem("group-anagrams", "Group Anagrams", "Medium"),
    ]),

    ...chapterTopics("Pattern 3 · Scan and build", [
      problem("longest-common-prefix", "Longest Common Prefix", "Easy"),
      problem("string-compression", "String Compression", "Medium"),
      problem("string-to-integer-atoi", "String to Integer (atoi)", "Medium"),
    ]),

    ...chapterTopics("Pattern 4 · Stack", [
      problem("backspace-string-compare", "Backspace String Compare", "Easy"),
      problem("remove-adjacent-duplicates-ii", "Remove All Adjacent Duplicates in String II", "Medium"),
      problem("minimum-remove-to-make-valid-parentheses", "Minimum Remove to Make Valid Parentheses", "Medium"),
    ]),

    ...chapterTopics("Pattern 5 · Sliding window", [
      problem("find-all-anagrams", "Find All Anagrams in a String", "Medium"),
      problem("longest-repeating-character-replacement", "Longest Repeating Character Replacement", "Medium"),
      problem("minimum-window-substring", "Minimum Window Substring", "Hard"),
    ]),

    ...chapterTopics("Pattern 6 · Expand around the centre", [
      problem("palindromic-substrings", "Palindromic Substrings", "Medium"),
      problem("longest-palindromic-substring", "Longest Palindromic Substring", "Medium"),
    ]),

    ...chapterTopics("Pattern 7 · Backtracking", [
      problem("letter-combinations-of-a-phone-number", "Letter Combinations of a Phone Number", "Medium"),
      problem("generate-parentheses", "Generate Parentheses", "Medium"),
    ]),

    ...chapterTopics("Pattern 8 · String matching", [
      problem("find-the-first-occurrence", "Find the Index of the First Occurrence in a String", "Easy"),
      problem("repeated-substring-pattern", "Repeated Substring Pattern", "Easy"),
      problem("shortest-palindrome", "Shortest Palindrome", "Hard"),
    ]),

    ...chapterTopics("Pattern 9 · Dynamic programming on strings", [
      problem("longest-common-subsequence", "Longest Common Subsequence", "Medium"),
      problem("word-break", "Word Break", "Medium"),
      problem("edit-distance", "Edit Distance", "Medium"),
    ]),
  ],
};
