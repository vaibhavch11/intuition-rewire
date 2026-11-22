import type { NextConfig } from "next";

/**
 * Strings lessons from before the course was rewritten (Oct 2026). Google still
 * had them on file, so each one points at the lesson that now covers it.
 */
const OLD_STRINGS_LESSONS: Record<string, string> = {
  "intro-understanding-the-problem": "strings/what-is-a-string",
  "intro-internal-mechanics": "strings/string-operations",
  "im-string-builders": "strings/immutability-and-building",
  "im-cost-of-concatenation": "strings/immutability-and-building",
  "im-run-length-encoding": "strings/string-compression",
  "tp-direct-application": "strings/how-to-spot-a-string-pattern",
  "tp-reverse-in-place": "strings/reverse-string",
  "tp-vowel-exchange": "strings/reverse-string",
  "tp-reverse-words": "strings/reverse-words-in-a-string",
  "tp-palindrome-checker": "strings/valid-palindrome",
  "fc-canonical-signature": "strings/group-anagrams",
  "fc-group-anagrams": "strings/group-anagrams",
  "fc-valid-anagram": "strings/valid-anagram",
  "fc-first-unique-character": "strings/first-unique-character",
  "sw-permutation-in-string": "strings/find-all-anagrams",
  "sw-longest-k-distinct": "strings/longest-repeating-character-replacement",
  "sw-minimum-window": "strings/minimum-window-substring",
  "ss-understanding": "strings/find-the-first-occurrence",
  "ss-brute-force-cost": "strings/find-the-first-occurrence",
  "ss-find-first-occurrence": "strings/find-the-first-occurrence",
  "ss-prefix-function": "strings/shortest-palindrome",
  "ss-repeated-pattern": "strings/repeated-substring-pattern",
  "pp-understanding": "strings/how-to-spot-a-string-pattern",
  "pp-valid-number": "strings/string-to-integer-atoi",
  "pp-decode-string": "stack/decode-string",
};

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Doubly and circular linked lists are taught inside the Linked List course.
      { source: "/dsa/doubly-linked-list", destination: "/dsa/singly-linked-list", permanent: true },
      { source: "/dsa/doubly-linked-list/:path*", destination: "/dsa/singly-linked-list", permanent: true },
      ...Object.entries(OLD_STRINGS_LESSONS).map(([from, to]) => ({
        source: `/dsa/strings/${from}`,
        destination: `/dsa/${to}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
