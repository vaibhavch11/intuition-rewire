export type Difficulty = "Fundamental" | "Easy" | "Medium" | "Hard";

export type SectionCategory = "data-structure" | "algorithm";

/** Concept lessons render as a circle node; problems render as a square node. */
export type TopicKind = "lesson" | "problem";

export type TraceValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TraceValue[]
  | { [key: string]: TraceValue };

export interface TraceStep {
  /** 1-indexed line number in `Trace.code` to highlight for this step. */
  line: number;
  /** Named variables and their current values at this step. */
  variables: Record<string, TraceValue>;
  /** Human-readable call stack, innermost call last. */
  callStack: string[];
  /** Indices of any array-shaped variable being read/written at this step. */
  highlightIndices?: number[];
  /** Anything printed/returned at this step. */
  output?: string;
  /** Plain-language explanation of what just happened. */
  note: string;
}

export interface Trace {
  language: "javascript" | "python";
  code: string;
  steps: TraceStep[];
}

/** Authored lesson body. `text` fields support **bold** and `code` inline. */
export type LessonBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "code"; language: string; code: string }
  | {
      type: "figure";
      src: string;
      alt: string;
      caption?: string;
      width: number;
      height: number;
    }
  /** An Excalidraw diagram: `scene` stays editable, `src` is the exported SVG readers see. */
  | {
      type: "drawing";
      src: string;
      alt: string;
      caption?: string;
      width: number;
      height: number;
      scene: DrawingScene;
    }
  /** A step-through dry run readers can feed their own input; see practicePrograms. */
  | { type: "simulator"; program: string; caption?: string };

export interface DrawingScene {
  elements: unknown[];
  files: Record<string, unknown>;
}

export type LessonBlockType = LessonBlock["type"];

export interface LessonContent {
  blocks: LessonBlock[];
  updatedAt: string;
}

export interface Topic {
  slug: string;
  title: string;
  /** Defaults to "lesson" when omitted. */
  kind?: TopicKind;
  /** Problems carry a difficulty; concept lessons usually don't. */
  difficulty?: Difficulty;
  /** Shows the "code solution" marker in the syllabus. */
  hasCodeSolution?: boolean;
  summary?: string;
  explanation?: string;
  imageUrl?: string;
  trace?: Trace;
  /** ID handed to the learner to attempt the same problem hands-on. */
  challengeId?: string;
  /** Groups this topic into a syllabus chapter, e.g. "Pattern: Two pointers". */
  chapter: string;
}

export interface Section {
  slug: string;
  title: string;
  description: string;
  category: SectionCategory;
  /** One-line hook under the course title. */
  tagline?: string;
  /** Bullets for the "What you will learn" panel. */
  outcomes?: string[];
  /** Paragraphs for "Why this course". Supports `code` and **bold** inline. */
  overview?: string[];
  requirements?: string[];
  illustrationCount?: number;
  slideCount?: number;
  imageUrl?: string;
  topics: Topic[];
}

export interface Chapter {
  title: string;
  topics: Topic[];
}

/** What a course card needs, small enough to hand to a client component. */
export interface CourseSummary {
  slug: string;
  title: string;
  category: SectionCategory;
  lessons: number;
}

export interface CourseStats {
  lessons: number;
  problems: number;
  patterns: number;
  illustrations: number;
  slides: number;
}

export function groupByChapter(topics: Topic[]): Chapter[] {
  const chapters: Chapter[] = [];
  for (const topic of topics) {
    let chapter = chapters.find((c) => c.title === topic.chapter);
    if (!chapter) {
      chapter = { title: topic.chapter, topics: [] };
      chapters.push(chapter);
    }
    chapter.topics.push(topic);
  }
  return chapters;
}

export function isProblem(topic: Topic): boolean {
  return topic.kind === "problem";
}

/** A course that has no lessons yet — only its "coming soon" placeholder. Kept out of search until it's written. */
export function isComingSoon(section: Section): boolean {
  return section.topics.every((t) => t.slug === "coming-soon");
}

export function courseStats(section: Section): CourseStats {
  const problems = section.topics.filter(isProblem);
  const patternChapters = groupByChapter(section.topics).filter((c) =>
    c.title.toLowerCase().startsWith("pattern:")
  );
  return {
    lessons: section.topics.length - problems.length,
    problems: problems.length,
    patterns: patternChapters.length,
    illustrations: section.illustrationCount ?? 0,
    slides: section.slideCount ?? 0,
  };
}
