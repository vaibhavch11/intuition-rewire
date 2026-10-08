import { promises as fs } from "node:fs";
import path from "node:path";
import { getContentBucket } from "@/lib/admin/storage";
import { isPracticeProgram } from "./practicePrograms";
import type { LessonBlock, LessonContent } from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content", "lessons");

/** Every section and lesson slug, built-in or added in /admin, has this shape. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Callers check that the lesson is in the curriculum; the slug pattern is
 * what keeps `../` out of the resolved path regardless.
 */
function contentPath(sectionSlug: string, topicSlug: string): string | null {
  if (!SLUG_PATTERN.test(sectionSlug) || !SLUG_PATTERN.test(topicSlug)) return null;
  return path.join(CONTENT_ROOT, sectionSlug, `${topicSlug}.json`);
}

function lessonKey(sectionSlug: string, topicSlug: string): string {
  return `lessons/${sectionSlug}/${topicSlug}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  return value;
}

const DRAWING_SRC = /^\/drawings\/[0-9a-f-]{36}\.svg$/;

function requireSize(
  input: Record<string, unknown>,
  field: string
): { width: number; height: number } {
  const width = Number(input.width);
  const height = Number(input.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`${field} must be numbers`);
  }
  return { width, height };
}

function optionalCaption(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseBlock(input: unknown, index: number): LessonBlock {
  if (!isRecord(input)) throw new Error(`Block ${index} must be an object`);
  const at = (field: string) => `Block ${index}.${field}`;

  switch (input.type) {
    case "heading":
      return { type: "heading", text: requireString(input.text, at("text")) };
    case "paragraph":
      return { type: "paragraph", text: requireString(input.text, at("text")) };
    case "list": {
      if (!Array.isArray(input.items)) {
        throw new Error(`${at("items")} must be an array`);
      }
      return {
        type: "list",
        ordered: input.ordered === true,
        items: input.items.map((item, i) => requireString(item, at(`items[${i}]`))),
      };
    }
    case "code":
      return {
        type: "code",
        language: requireString(input.language, at("language")),
        code: requireString(input.code, at("code")),
      };
    case "figure": {
      const src = requireString(input.src, at("src"));
      if (!src.startsWith("/")) {
        throw new Error(`${at("src")} must be a site-relative path`);
      }
      const { width, height } = requireSize(input, at("width/height"));
      return {
        type: "figure",
        src,
        alt: requireString(input.alt, at("alt")),
        caption: optionalCaption(input.caption),
        width,
        height,
      };
    }
    case "drawing": {
      const src = requireString(input.src, at("src"));
      if (!DRAWING_SRC.test(src)) {
        throw new Error(`${at("src")} must be a /drawings/<id>.svg path`);
      }
      const { width, height } = requireSize(input, at("width/height"));
      if (!isRecord(input.scene) || !Array.isArray(input.scene.elements)) {
        throw new Error(`${at("scene")} must hold an elements array`);
      }
      return {
        type: "drawing",
        src,
        alt: requireString(input.alt, at("alt")),
        caption: optionalCaption(input.caption),
        width,
        height,
        scene: {
          elements: input.scene.elements,
          files: isRecord(input.scene.files) ? input.scene.files : {},
        },
      };
    }
    case "simulator": {
      if (!isPracticeProgram(input.program)) {
        throw new Error(`${at("program")} is not a known simulator`);
      }
      return {
        type: "simulator",
        program: input.program,
        caption: optionalCaption(input.caption),
      };
    }
    default:
      throw new Error(`Block ${index} has unknown type "${String(input.type)}"`);
  }
}

export function parseBlocks(input: unknown): LessonBlock[] {
  if (!Array.isArray(input)) throw new Error("blocks must be an array");
  return input.map(parseBlock);
}

function parseLessonDocument(file: string, raw: string): LessonContent {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error(`${file} is not a lesson document`);

  return {
    blocks: parseBlocks(parsed.blocks),
    updatedAt:
      typeof parsed.updatedAt === "string"
        ? parsed.updatedAt
        : new Date(0).toISOString(),
  };
}

/**
 * Workers has no filesystem, so a read failure there (rather than a genuine
 * ENOENT for an unauthored lesson) is indistinguishable from "not on disk" —
 * either way the caller falls through to R2 next.
 */
async function readLessonFromDisk(file: string): Promise<LessonContent | null> {
  try {
    return parseLessonDocument(file, await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function readLessonFromBucket(
  sectionSlug: string,
  topicSlug: string
): Promise<LessonContent | null> {
  const bucket = await getContentBucket();
  if (!bucket) return null;

  const key = lessonKey(sectionSlug, topicSlug);
  const object = await bucket.get(key);
  if (!object) return null;

  return parseLessonDocument(key, await object.text());
}

export async function getLessonContent(
  sectionSlug: string,
  topicSlug: string
): Promise<LessonContent | null> {
  const file = contentPath(sectionSlug, topicSlug);
  if (!file) return null;

  return (await readLessonFromDisk(file)) ?? readLessonFromBucket(sectionSlug, topicSlug);
}

/**
 * Writes to R2 when a bucket is bound (the durable store once deployed) and,
 * best-effort, to disk (the `next dev` authoring workflow, unchanged). In the
 * deployed Worker the disk write silently fails — that's fine, R2 already has
 * it. If neither succeeded, the save genuinely didn't happen and callers need
 * to know that rather than think it was saved.
 */
export async function saveLessonContent(
  sectionSlug: string,
  topicSlug: string,
  blocks: LessonBlock[]
): Promise<LessonContent> {
  const file = contentPath(sectionSlug, topicSlug);
  if (!file) throw new Error(`Unknown lesson ${sectionSlug}/${topicSlug}`);

  const content: LessonContent = { blocks, updatedAt: new Date().toISOString() };
  const json = `${JSON.stringify(content, null, 2)}\n`;

  const bucket = await getContentBucket();
  if (bucket) {
    await bucket.put(lessonKey(sectionSlug, topicSlug), json, {
      httpMetadata: { contentType: "application/json" },
    });
  }

  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, json, "utf8");
  } catch (error) {
    if (!bucket) throw error;
  }

  return content;
}

/** Deletes from both stores; a lesson that was never written is simply skipped. */
export async function deleteLessonContent(
  sectionSlug: string,
  topicSlugs: string[]
): Promise<void> {
  const targets = topicSlugs.flatMap((slug) => {
    const file = contentPath(sectionSlug, slug);
    return file ? [{ key: lessonKey(sectionSlug, slug), file }] : [];
  });
  if (targets.length === 0) return;

  const bucket = await getContentBucket();
  if (bucket) await bucket.delete(targets.map((t) => t.key));

  // No filesystem in the deployed Worker; R2 above was the real store there.
  await Promise.all(
    targets.map(({ file }) => fs.rm(file, { force: true }).catch(() => {}))
  );
}

async function listAuthoredOnDisk(authored: Set<string>): Promise<void> {
  try {
    const sectionDirs = await fs.readdir(CONTENT_ROOT);
    for (const sectionSlug of sectionDirs) {
      const files = await fs.readdir(path.join(CONTENT_ROOT, sectionSlug));
      for (const file of files) {
        if (file.endsWith(".json")) {
          authored.add(`${sectionSlug}/${file.slice(0, -".json".length)}`);
        }
      }
    }
  } catch {
    // No real filesystem (deployed Worker) or nothing authored yet — R2 covers the rest.
  }
}

async function listAuthoredInBucket(authored: Set<string>): Promise<void> {
  const bucket = await getContentBucket();
  if (!bucket) return;

  let cursor: string | undefined;
  do {
    const listed = await bucket.list({ prefix: "lessons/", cursor });
    for (const object of listed.objects) {
      const slug = object.key.slice("lessons/".length).replace(/\.json$/, "");
      if (slug) authored.add(slug);
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
}

/**
 * When each written lesson last changed, keyed "course/lesson", for the
 * sitemap: the `updatedAt` saved in the file on disk, else the time the R2 copy
 * was uploaded or last saved from /admin. A listing, not a read of every lesson,
 * so it stays cheap on every request.
 */
export async function listLessonDates(): Promise<Map<string, Date>> {
  const dates = new Map<string, Date>();
  try {
    for (const sectionSlug of await fs.readdir(CONTENT_ROOT)) {
      for (const file of await fs.readdir(path.join(CONTENT_ROOT, sectionSlug))) {
        if (!file.endsWith(".json")) continue;
        const raw = await fs.readFile(path.join(CONTENT_ROOT, sectionSlug, file), "utf8");
        const saved = new Date(raw.match(/"updatedAt"\s*:\s*"([^"]+)"/)?.[1] ?? "");
        if (!Number.isNaN(saved.getTime())) dates.set(`${sectionSlug}/${file.slice(0, -".json".length)}`, saved);
      }
    }
  } catch {
    // No real filesystem (deployed Worker) — R2 has the dates.
  }

  const bucket = await getContentBucket();
  if (bucket) {
    let cursor: string | undefined;
    do {
      const listed = await bucket.list({ prefix: "lessons/", cursor });
      for (const object of listed.objects) {
        const slug = object.key.slice("lessons/".length).replace(/\.json$/, "");
        if (slug && !dates.has(slug)) dates.set(slug, object.uploaded);
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  }
  return dates;
}

export async function listAuthoredLessons(): Promise<Set<string>> {
  const authored = new Set<string>();
  await listAuthoredOnDisk(authored);
  await listAuthoredInBucket(authored);
  return authored;
}
