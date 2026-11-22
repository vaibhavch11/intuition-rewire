import { notFound } from "next/navigation";
import { getSection } from "@/lib/dsa/curriculum";
import { groupByChapter } from "@/lib/dsa/types";
import LessonIndex from "@/components/dsa/LessonIndex";

/**
 * The index lives here rather than in the page so that navigating between
 * lessons preserves it — including how far it is scrolled.
 */
export default async function LessonLayout(
  props: LayoutProps<"/dsa/[section]/[topic]">
) {
  const { section: sectionSlug, topic: topicSlug } = await props.params;
  const section = await getSection(sectionSlug);
  // Checked here, above the page's loading skeleton, so an unknown lesson gets a
  // real 404 status before anything streams (in the page it would already be a 200).
  if (!section || !section.topics.some((t) => t.slug === topicSlug)) notFound();

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
