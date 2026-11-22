import { fitDescription, fitTitle, MAX_DESCRIPTION, plainText, SITE_NAME } from "@/lib/seo";
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
 * Problems read as visual dry runs ("Two Sum: Visual Dry Run in Python, Java & C++"); lessons name their
 * course when the title doesn't. A title that another course also uses (the same
 * problem taught twice) gets its course name, so no two pages share a title.
 */
export function lessonTitle(section: Section, topic: Topic, sharedTitle = false): string {
  const t = topic.title;
  if (sharedTitle) {
    return fitTitle(`${t} – ${section.title}${BRAND}`, `${t} – ${section.title}`, `${t} (${section.title})`);
  }
  if (topic.kind === "problem") {
    // Lead with what no big solution site offers ("visual dry run", "step by
    // step"), which is what searches like "two sum dry run" ask for, and name
    // the languages when they fit.
    return fitTitle(
      `${t}: Visual Dry Run in Python, Java & C++${BRAND}`,
      `${t}: Visual Dry Run in Python, Java & C++`,
      `${t}: Step-by-Step Visual Dry Run${BRAND}`,
      `${t}: Step-by-Step Visual Dry Run`,
      `${t}: Visual Dry Run${BRAND}`,
      `${t}: Visual Dry Run`,
      `${t}${BRAND}`,
      t
    );
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

/**
 * The approaches a problem lesson teaches, from its numbered headings
 * ("2. Bottom-up table" → "bottom-up table").
 */
function approachNames(content: LessonContent): string[] {
  return content.blocks.flatMap((b) => {
    const m = b.type === "heading" ? plainText(b.text).match(/^\d+\.\s+(.+)$/) : null;
    if (!m) return [];
    // "Plain recursion: take it or skip it" → "plain recursion", unless that leaves one word.
    const [before, after] = m[1].split(/:\s+/, 2);
    const name = after !== undefined && before.includes(" ") ? before : m[1];
    // Lower-case the first letter, but not an acronym ("BFS over amounts") or a
    // name ("Kahn's algorithm", "Dijkstra").
    const first = name.split(" ")[0];
    const keep = first.includes("'") || /-[A-Z]/.test(first) || /^(Dijkstra|Floyd|Bellman|Prim|Kruskal|Kadane|Morris|Manacher|Boyer|Hoare|Lomuto|Euclid|Tarjan|Kosaraju)/.test(first);
    return [!keep && /^[A-Z](?=[a-z\s])/.test(name) ? name[0].toLowerCase() + name.slice(1) : name];
  });
}

/**
 * A problem's description names its approaches and languages — what a searcher
 * wants to know before clicking. Other lessons (and problems with a single
 * approach) use their own opening paragraph, so every description is different.
 */
export function lessonDescription(section: Section, topic: Topic, content: LessonContent | null): string {
  const ways = topic.kind === "problem" && content ? approachNames(content) : [];
  if (ways.length >= 2) {
    const title = plainText(topic.title);
    const solved = `${title} solved ${ways.length} ways in Python, Java, C++ and JavaScript`;
    // Name the approaches only when every name is short; a heading that is a
    // sentence ("optimal: sort, then walk…") or holds its own "and" would garble the list.
    const tidy = ways.every((w) => !/[,:;]| and /.test(w) && w.split(" ").length <= 5);
    const list = `${ways.slice(0, -1).join(", ")}${ways.length > 2 ? "," : ""} and ${ways[ways.length - 1]}`;
    const candidates = [
      ...(tidy ? [`${solved}: ${list}. Each with its time and space complexity.`, `${solved}: ${list}.`] : []),
      `${solved}, with the time and space complexity of each and a step-by-step visual dry run.`,
      `${solved}, with the time and space complexity of each.`,
    ];
    const text = candidates.find((c) => c.length <= MAX_DESCRIPTION && c.length >= 100);
    if (text) return text;
  }
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
