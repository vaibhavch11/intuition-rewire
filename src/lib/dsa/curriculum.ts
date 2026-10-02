import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { connection } from "next/server";
import { getContentBucket } from "@/lib/admin/storage";
import { deleteLessonContent, listAuthoredLessons, SLUG_PATTERN } from "./content";
import { builtInSections } from "./data";
import type { Chapter, Difficulty, Section, Topic, TopicKind } from "./types";

/**
 * The course structure readers see: the built-in sections from ./data with
 * the changes made in /admin — chapters and lessons added, others taken out —
 * layered on top. Only those changes are stored, so anything added to ./data
 * later still comes through.
 */

interface AddedLesson {
  slug: string;
  title: string;
  chapter: string;
  kind?: "problem";
  difficulty?: Difficulty;
}

interface SectionEdits {
  /** Built-in lessons taken out, by slug. */
  removedTopics: string[];
  /** Built-in chapters taken out, by title, together with every lesson in them. */
  removedChapters: string[];
  /** Chapters created in /admin, in the order they were added. */
  chapters: string[];
  /** Lessons created in /admin, in the order they were added. */
  topics: AddedLesson[];
}

type CurriculumEdits = Record<string, SectionEdits>;

const EDITS_KEY = "curriculum.json";
const EDITS_FILE = path.join(process.cwd(), "content", EDITS_KEY);

const DIFFICULTIES: readonly Difficulty[] = ["Fundamental", "Easy", "Medium", "Hard"];

const MAX_CHAPTER_TITLE = 80;
const MAX_LESSON_TITLE = 120;
const MAX_ADDED_CHAPTERS = 60;
const MAX_ADDED_LESSONS = 300;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function emptyEdits(): SectionEdits {
  return { removedTopics: [], removedChapters: [], chapters: [], topics: [] };
}

function parseAddedLesson(value: unknown): AddedLesson | null {
  if (!isRecord(value)) return null;
  const { slug, title, chapter } = value;
  if (
    typeof slug !== "string" ||
    !SLUG_PATTERN.test(slug) ||
    typeof title !== "string" ||
    typeof chapter !== "string"
  ) {
    return null;
  }
  if (value.kind !== "problem") return { slug, title, chapter };
  const difficulty = DIFFICULTIES.find((d) => d === value.difficulty) ?? "Easy";
  return { slug, title, chapter, kind: "problem", difficulty };
}

/** Only built-in section slugs are read back, so the file can't add a course. */
function parseEdits(raw: string): CurriculumEdits {
  const parsed: unknown = JSON.parse(raw);
  const stored = isRecord(parsed) && isRecord(parsed.sections) ? parsed.sections : {};

  const edits: CurriculumEdits = {};
  for (const { slug } of builtInSections) {
    const value = Object.hasOwn(stored, slug) ? stored[slug] : null;
    if (!isRecord(value)) continue;
    edits[slug] = {
      removedTopics: stringList(value.removedTopics),
      removedChapters: stringList(value.removedChapters),
      chapters: stringList(value.chapters),
      topics: Array.isArray(value.topics)
        ? value.topics
            .map(parseAddedLesson)
            .filter((lesson): lesson is AddedLesson => lesson !== null)
        : [],
    };
  }
  return edits;
}

/** Disk first (the `next dev` authoring copy), then R2 — the order lesson content uses too. */
async function readEdits(): Promise<CurriculumEdits> {
  let raw: string | null;
  try {
    raw = await fs.readFile(EDITS_FILE, "utf8");
  } catch {
    const object = await (await getContentBucket())?.get(EDITS_KEY);
    raw = object ? await object.text() : null;
  }
  return raw === null ? {} : parseEdits(raw);
}

/** Same two stores as saveLessonContent, for the same reasons. */
async function writeEdits(edits: CurriculumEdits): Promise<void> {
  const json = `${JSON.stringify(
    { sections: edits, updatedAt: new Date().toISOString() },
    null,
    2
  )}\n`;

  const bucket = await getContentBucket();
  if (bucket) {
    await bucket.put(EDITS_KEY, json, {
      httpMetadata: { contentType: "application/json" },
    });
  }

  try {
    await fs.mkdir(path.dirname(EDITS_FILE), { recursive: true });
    await fs.writeFile(EDITS_FILE, json, "utf8");
  } catch (error) {
    if (!bucket) throw error;
  }
}

function toTopic({ slug, title, chapter, kind, difficulty }: AddedLesson): Topic {
  return kind === "problem"
    ? { slug, title, chapter, kind, difficulty }
    : { slug, title, chapter };
}

/**
 * Every chapter in reading order, including ones with no lessons yet.
 * Built-in chapters keep their place (even once emptied, until removed as a
 * whole), added chapters follow in the order they were created, and added
 * lessons go at the end of their chapter.
 */
function buildOutline(base: Section, edits = emptyEdits()): Chapter[] {
  const removedChapters = new Set(edits.removedChapters);
  const removedTopics = new Set(edits.removedTopics);
  const chapters = new Map<string, Topic[]>();

  for (const topic of base.topics) {
    if (removedChapters.has(topic.chapter)) continue;
    let topics = chapters.get(topic.chapter);
    if (!topics) {
      topics = [];
      chapters.set(topic.chapter, topics);
    }
    if (!removedTopics.has(topic.slug)) topics.push(topic);
  }

  for (const title of edits.chapters) {
    if (!chapters.has(title)) chapters.set(title, []);
  }

  const taken = new Set(base.topics.map((t) => t.slug));
  for (const lesson of edits.topics) {
    const topics = chapters.get(lesson.chapter);
    // If ./data has since claimed this slug, the built-in lesson wins.
    if (!topics || taken.has(lesson.slug)) continue;
    taken.add(lesson.slug);
    topics.push(toTopic(lesson));
  }

  return [...chapters].map(([title, topics]) => ({ title, topics }));
}

interface Curriculum {
  sections: Section[];
  outlines: Map<string, Chapter[]>;
}

/**
 * Read once per request. `connection()` keeps every page built on this out of
 * build-time prerendering, which would freeze the course at deploy time.
 */
const loadCurriculum = cache(async (): Promise<Curriculum> => {
  await connection();
  const edits = await readEdits();

  const outlines = new Map<string, Chapter[]>();
  const sections = builtInSections.map((base) => {
    const outline = buildOutline(base, edits[base.slug]);
    outlines.set(base.slug, outline);
    return { ...base, topics: outline.flatMap((chapter) => chapter.topics) };
  });
  return { sections, outlines };
});

export async function getSections(): Promise<Section[]> {
  return (await loadCurriculum()).sections;
}

export async function getSection(slug: string): Promise<Section | undefined> {
  return (await getSections()).find((s) => s.slug === slug);
}

export async function getTopic(sectionSlug: string, topicSlug: string) {
  const section = await getSection(sectionSlug);
  const topic = section?.topics.find((t) => t.slug === topicSlug);
  return section && topic ? { section, topic } : undefined;
}

/** Every course with all of its chapters, including empty ones — for /admin. */
export async function getOutlines(): Promise<
  { section: Section; chapters: Chapter[] }[]
> {
  const { sections, outlines } = await loadCurriculum();
  return sections.map((section) => ({
    section,
    chapters: outlines.get(section.slug) ?? [],
  }));
}

export type CurriculumChange =
  | { op: "add-chapter"; section: string; title: string }
  | { op: "remove-chapter"; section: string; chapter: string }
  | {
      op: "add-lesson";
      section: string;
      chapter: string;
      title: string;
      kind: TopicKind;
      difficulty?: Difficulty;
    }
  | { op: "remove-lesson"; section: string; topic: string };

/** A change that can't be made, with the message and status to answer with. */
export class CurriculumError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409
  ) {
    super(message);
  }
}

/** Collapses whitespace (newlines included), then rejects empty, overlong or control characters. */
function cleanTitle(value: unknown, what: string, max: number): string {
  const title = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!title) throw new CurriculumError(`Give the ${what} a title.`, 400);
  if (title.length > max) {
    throw new CurriculumError(`Keep the ${what} title to ${max} characters or fewer.`, 400);
  }
  if (/\p{Cc}/u.test(title)) {
    throw new CurriculumError(`The ${what} title has characters that can't be shown.`, 400);
  }
  return title;
}

function requireName(value: unknown): string {
  if (typeof value !== "string") {
    throw new CurriculumError("That request isn't a course change.", 400);
  }
  return value;
}

export function parseCurriculumChange(input: unknown): CurriculumChange {
  if (!isRecord(input)) {
    throw new CurriculumError("That request isn't a course change.", 400);
  }
  const section = requireName(input.section);

  switch (input.op) {
    case "add-chapter":
      return {
        op: "add-chapter",
        section,
        title: cleanTitle(input.title, "chapter", MAX_CHAPTER_TITLE),
      };
    case "remove-chapter":
      return { op: "remove-chapter", section, chapter: requireName(input.chapter) };
    case "add-lesson": {
      const kind = input.kind === "problem" ? "problem" : "lesson";
      const difficulty = DIFFICULTIES.find((d) => d === input.difficulty);
      if (kind === "problem" && !difficulty) {
        throw new CurriculumError("Pick a difficulty for the problem.", 400);
      }
      return {
        op: "add-lesson",
        section,
        chapter: requireName(input.chapter),
        title: cleanTitle(input.title, "lesson", MAX_LESSON_TITLE),
        kind,
        difficulty: kind === "problem" ? difficulty : undefined,
      };
    }
    case "remove-lesson":
      return { op: "remove-lesson", section, topic: requireName(input.topic) };
    default:
      throw new CurriculumError("That request isn't a course change.", 400);
  }
}

function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return slug || "lesson";
}

/**
 * Never reuses a slug that ./data, another added lesson, or leftover saved
 * content already has, so a new lesson can't inherit an old lesson's body.
 */
async function uniqueSlug(
  base: Section,
  edits: SectionEdits,
  title: string
): Promise<string> {
  const authored = await listAuthoredLessons();
  const taken = (slug: string) =>
    base.topics.some((t) => t.slug === slug) ||
    edits.topics.some((t) => t.slug === slug) ||
    authored.has(`${base.slug}/${slug}`);

  const root = slugify(title);
  let slug = root;
  for (let n = 2; taken(slug); n++) slug = `${root}-${n}`;
  return slug;
}

/**
 * Applies one change from /admin. Taking a lesson or chapter out also deletes
 * the content saved for it — the course page is what readers see, and a
 * removed lesson has nowhere left to show it.
 */
export async function changeCurriculum(
  change: CurriculumChange
): Promise<{ slug?: string }> {
  const base = builtInSections.find((s) => s.slug === change.section);
  if (!base) throw new CurriculumError("That course doesn't exist.", 404);

  const all = await readEdits();
  const edits = all[base.slug] ?? emptyEdits();
  const outline = buildOutline(base, edits);
  const findChapter = (title: string) => {
    const chapter = outline.find((c) => c.title === title);
    if (!chapter) throw new CurriculumError("That chapter no longer exists.", 404);
    return chapter;
  };

  let removed: string[] = [];
  let slug: string | undefined;

  switch (change.op) {
    case "add-chapter": {
      const wanted = change.title.toLowerCase();
      if (outline.some((c) => c.title.toLowerCase() === wanted)) {
        throw new CurriculumError(
          `${base.title} already has a chapter called “${change.title}”.`,
          409
        );
      }
      if (edits.chapters.length >= MAX_ADDED_CHAPTERS) {
        throw new CurriculumError("This course can't take any more chapters.", 409);
      }
      edits.chapters.push(change.title);
      break;
    }

    case "remove-chapter": {
      const chapter = findChapter(change.chapter);
      removed = chapter.topics.map((t) => t.slug);
      edits.chapters = edits.chapters.filter((title) => title !== chapter.title);
      edits.topics = edits.topics.filter((t) => t.chapter !== chapter.title);
      if (
        base.topics.some((t) => t.chapter === chapter.title) &&
        !edits.removedChapters.includes(chapter.title)
      ) {
        edits.removedChapters.push(chapter.title);
      }
      break;
    }

    case "add-lesson": {
      const chapter = findChapter(change.chapter);
      if (edits.topics.length >= MAX_ADDED_LESSONS) {
        throw new CurriculumError("This course can't take any more lessons.", 409);
      }
      slug = await uniqueSlug(base, edits, change.title);
      edits.topics.push(
        change.kind === "problem"
          ? {
              slug,
              title: change.title,
              chapter: chapter.title,
              kind: "problem",
              difficulty: change.difficulty,
            }
          : { slug, title: change.title, chapter: chapter.title }
      );
      break;
    }

    case "remove-lesson": {
      const exists = outline.some((c) => c.topics.some((t) => t.slug === change.topic));
      if (!exists) throw new CurriculumError("That lesson no longer exists.", 404);
      removed = [change.topic];
      edits.topics = edits.topics.filter((t) => t.slug !== change.topic);
      if (base.topics.some((t) => t.slug === change.topic)) {
        edits.removedTopics.push(change.topic);
      }
      break;
    }
  }

  all[base.slug] = edits;
  await writeEdits(all);

  if (removed.length > 0) {
    try {
      await deleteLessonContent(base.slug, removed);
    } catch (error) {
      // The lesson is already out of the course; leftover content is never
      // shown, and uniqueSlug won't hand its slug to a new lesson.
      console.error("Could not delete content for removed lessons", error);
    }
  }

  return { slug };
}
