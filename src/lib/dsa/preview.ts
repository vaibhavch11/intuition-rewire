import { plainText } from "@/lib/seo";
import type { LessonBlock } from "./types";

export interface LessonPreview {
  shown: LessonBlock[];
  /** What the rest of the lesson holds, for the sign-in prompt. Empty when nothing is held back. */
  rest: { sections: string[]; drawings: number; simulators: number; languages: number; blocks: number };
}

/**
 * What a signed-out reader — and a search engine — sees of a lesson: its opening,
 * up to the second section. For a problem that is the statement, its diagram and
 * the worked example. It stops sooner at the first real code or simulator, which
 * belong to the full lesson.
 */
export function lessonPreview(blocks: LessonBlock[]): LessonPreview {
  let end = blocks.length;
  let headings = 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "heading" && ++headings === 2) { end = i; break; }
    if ((b.type === "code" && b.language !== "text") || b.type === "simulator") { end = i; break; }
  }
  // A lesson without sections: show its first few blocks.
  if (headings < 2 && end === blocks.length && blocks.length > 4) end = 3;
  end = Math.max(1, end);

  const hidden = blocks.slice(end);
  const languages = new Set(hidden.flatMap((b) => (b.type === "code" && b.language !== "text" ? [b.language] : [])));
  return {
    shown: blocks.slice(0, end),
    rest: {
      sections: hidden.flatMap((b) => (b.type === "heading" ? [plainText(b.text)] : [])),
      drawings: hidden.filter((b) => b.type === "drawing" || b.type === "figure").length,
      simulators: hidden.filter((b) => b.type === "simulator").length,
      languages: languages.size,
      blocks: hidden.length,
    },
  };
}
