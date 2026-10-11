import type { MetadataRoute } from "next";
import { getSections } from "@/lib/dsa/curriculum";
import { listLessonDates } from "@/lib/dsa/content";
import authoredLessons from "@/lib/dsa/authored-lessons.json";
import { isComingSoon } from "@/lib/dsa/types";
import { absoluteUrl } from "@/lib/seo";

// Built on each request from the live course list, so a new course or lesson —
// including one added from /admin — appears without a redeploy.
export const dynamic = "force-dynamic";

const OTHER_PAGES = ["/pricing", "/contact", "/privacy", "/terms", "/refund-policy"];

// Lessons committed with the site (listed at build time) are always included,
// even when the storage listing (used for last-modified dates) fails or is short.
const AUTHORED = new Set<string>(authoredLessons);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sections, dates] = await Promise.all([getSections(), listLessonDates().catch(() => new Map<string, Date>())]);

  const courses: MetadataRoute.Sitemap = [];
  let newest = 0;
  for (const section of sections) {
    // A course with no lessons yet is kept out of search (it is noindexed too).
    if (isComingSoon(section)) continue;
    let courseNewest = 0;
    const lessons: MetadataRoute.Sitemap = [];
    for (const topic of section.topics) {
      const key = `${section.slug}/${topic.slug}`;
      const saved = dates.get(key);
      if (!saved && !topic.explanation && !AUTHORED.has(key)) continue; // nothing written yet
      if (saved) courseNewest = Math.max(courseNewest, saved.getTime());
      lessons.push({ url: absoluteUrl(`/dsa/${section.slug}/${topic.slug}`), lastModified: saved });
    }
    newest = Math.max(newest, courseNewest);
    courses.push(
      { url: absoluteUrl(`/dsa/${section.slug}`), lastModified: courseNewest ? new Date(courseNewest) : undefined },
      ...lessons
    );
  }

  const latest = newest ? new Date(newest) : undefined;
  return [
    { url: absoluteUrl("/"), lastModified: latest },
    { url: absoluteUrl("/dsa"), lastModified: latest },
    ...courses,
    ...OTHER_PAGES.map((page) => ({ url: absoluteUrl(page) })),
  ];
}
