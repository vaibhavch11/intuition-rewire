import type { Section, SectionCategory } from "../types";
import { arraysSection } from "./arrays";
import { binarySearchTreeSection } from "./binary-search-tree";
import { binaryTreeSection } from "./binary-tree";
import { dynamicProgrammingSection } from "./dynamic-programming";
import { graphSection } from "./graph";
import { hashTableSection } from "./hash-table";
import { heapSection } from "./heap";
import { linkedListSection } from "./linked-list";
import { queueSection } from "./queue";
import { recursionSection } from "./recursion";
import { searchingSection } from "./searching";
import { sortingSection } from "./sorting";
import { stackSection } from "./stack";
import { stringsSection } from "./strings";

function placeholderSection(
  slug: string,
  title: string,
  description: string,
  category: SectionCategory
): Section {
  return {
    slug,
    title,
    description,
    category,
    topics: [
      {
        slug: "coming-soon",
        title: "Coming soon",
        chapter: "Foundations",
        summary: "This section's dry-run lessons are still being written.",
        explanation:
          "Content for this section hasn't been added yet. Follow the same pattern as src/lib/dsa/data/arrays.ts to add topics with a full trace.",
      },
    ],
  };
}

/**
 * The course structure as shipped in code. Readers see this plus whatever was
 * added or removed in /admin, so read it through `@/lib/dsa/curriculum`.
 */
export const builtInSections: Section[] = [
  arraysSection,
  stringsSection,
  linkedListSection,
  hashTableSection,
  stackSection,
  queueSection,
  binaryTreeSection,
  binarySearchTreeSection,
  heapSection,
  graphSection,
  placeholderSection(
    "trie",
    "Trie (Prefix Tree)",
    "A tree specialized for prefix search over strings — autocomplete's favorite data structure.",
    "data-structure"
  ),
  sortingSection,
  searchingSection,
  recursionSection,
  dynamicProgrammingSection,
];
