import { fitDescription, fitTitle, SITE_NAME } from "@/lib/seo";
import { groupByChapter, isProblem, type LessonContent, type Section, type Topic } from "./types";

/** Rough study time for the course schema: 15 minutes a lesson, 30 a problem. */
export function courseWorkload(section: Section) {
  const hoursFor = (topics: Topic[]) => topics.reduce((h, t) => h + (isProblem(t) ? 0.5 : 0.25), 0);
  const chapters = groupByChapter(section.topics).map((c) => ({ name: c.title, lessons: c.topics.length, hours: hoursFor(c.topics) }));
  return { hours: hoursFor(section.topics), chapters };
}

const BRAND = ` | ${SITE_NAME}`;

/** e.g. "Queue: DSA Patterns & Interview Questions | IntuitionRewire" — the brand drops off when it won't fit. */
export function courseTitle(section: Section): string {
  const base = `${section.title}: DSA Patterns & Interview Questions`;
  return fitTitle(`${base}${BRAND}`, base, `${section.title} in DSA${BRAND}`, `${section.title} in DSA`);
}

export function courseDescription(section: Section): string {
  return fitDescription(section.tagline ?? section.description, [
    "Visual lessons, step-by-step dry runs and interview problems with code in JavaScript, Python, Java and C++.",
    "Free to learn on IntuitionRewire.",
  ]);
}

/**
 * Problems read as solutions ("Two Sum: Visual Solution"); lessons name their
 * course when the title doesn't. A title that another course also uses (the same
 * problem taught twice) gets its course name, so no two pages share a title.
 */
export function lessonTitle(section: Section, topic: Topic, sharedTitle = false): string {
  const t = topic.title;
  if (sharedTitle) {
    return fitTitle(`${t} – ${section.title}${BRAND}`, `${t} – ${section.title}`, `${t} (${section.title})`);
  }
  if (topic.kind === "problem") {
    return fitTitle(`${t}: Visual Solution${BRAND}`, `${t}: Visual Solution`, `${t}${BRAND}`, t);
  }
  const courseWord = section.title.split(" ")[0].toLowerCase();
  const namesCourse = t.toLowerCase().includes(courseWord.replace(/s$/, ""));
  return fitTitle(
    ...(namesCourse ? [] : [`${t} – ${section.title}${BRAND}`, `${t} – ${section.title}`]),
    `${t}${BRAND}`,
    t
  );
}

/** Too little text to be worth a search result — a stub or a test lesson. Kept out of search. */
export function isThinLesson(content: LessonContent): boolean {
  const words = content.blocks
    .flatMap((b) => (b.type === "paragraph" || b.type === "heading" ? [b.text] : b.type === "list" ? b.items : []))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return words < 60;
}

/** Built from the lesson's own opening paragraph, so every lesson's description is different. */
export function lessonDescription(section: Section, topic: Topic, content: LessonContent | null): string {
  const first = content?.blocks.find((b) => b.type === "paragraph");
  const opening = (first?.type === "paragraph" ? first.text : topic.summary ?? topic.explanation ?? section.description)
    .replace(/^\*\*The problem\.\*\*\s*/i, "");
  return fitDescription(
    opening,
    topic.kind === "problem"
      ? ["Solved visually, from brute force to optimal, with a dry-run simulator and code in JavaScript, Python, Java and C++."]
      : [`Part of the free ${section.title} course on IntuitionRewire, with hand-drawn diagrams and a dry-run simulator.`]
  );
}
