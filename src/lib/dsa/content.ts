import { promises as fs } from "node:fs";
import path from "node:path";
import { getTopic } from "./data";
import type { LessonBlock, LessonContent } from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content", "lessons");

/**
 * Only slugs that exist in the curriculum are addressable, which is also what
 * keeps `../` out of the resolved path.
 */
function contentPath(sectionSlug: string, topicSlug: string): string | null {
  if (!getTopic(sectionSlug, topicSlug)) return null;
  return path.join(CONTENT_ROOT, sectionSlug, `${topicSlug}.json`);
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
    default:
      throw new Error(`Block ${index} has unknown type "${String(input.type)}"`);
  }
}

export function parseBlocks(input: unknown): LessonBlock[] {
  if (!Array.isArray(input)) throw new Error("blocks must be an array");
  return input.map(parseBlock);
}

export async function getLessonContent(
  sectionSlug: string,
  topicSlug: string
): Promise<LessonContent | null> {
  const file = contentPath(sectionSlug, topicSlug);
  if (!file) return null;

  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }

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

export async function saveLessonContent(
  sectionSlug: string,
  topicSlug: string,
  blocks: LessonBlock[]
): Promise<LessonContent> {
  const file = contentPath(sectionSlug, topicSlug);
  if (!file) throw new Error(`Unknown lesson ${sectionSlug}/${topicSlug}`);

  const content: LessonContent = { blocks, updatedAt: new Date().toISOString() };
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  return content;
}

export async function listAuthoredLessons(): Promise<Set<string>> {
  const authored = new Set<string>();
  let sectionDirs: string[];
  try {
    sectionDirs = await fs.readdir(CONTENT_ROOT);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return authored;
    throw error;
  }

  for (const sectionSlug of sectionDirs) {
    const files = await fs.readdir(path.join(CONTENT_ROOT, sectionSlug));
    for (const file of files) {
      if (file.endsWith(".json")) {
        authored.add(`${sectionSlug}/${file.slice(0, -".json".length)}`);
      }
    }
  }
  return authored;
}
