import { notFound } from "next/navigation";
import { getSection } from "@/lib/dsa/data";
import { groupByChapter } from "@/lib/dsa/types";
import LessonIndex from "@/components/dsa/LessonIndex";

/**
 * The index lives here rather than in the page so that navigating between
 * lessons preserves it — including how far it is scrolled.
 */
export default async function LessonLayout(
  props: LayoutProps<"/dsa/[section]/[topic]">
) {
  const { section: sectionSlug } = await props.params;
  const section = getSection(sectionSlug);
  if (!section) notFound();

  const chapters = groupByChapter(section.topics).map((chapter) => ({
    title: chapter.title,
    items: chapter.topics.map((t) => ({ slug: t.slug, title: t.title })),
  }));

  return (
    <div className="flex flex-1">
      <LessonIndex
        sectionSlug={section.slug}
        sectionTitle={section.title}
        chapters={chapters}
        totalTopics={section.topics.length}
      />
      <main className="min-w-0 flex-1">{props.children}</main>
    </div>
  );
}
