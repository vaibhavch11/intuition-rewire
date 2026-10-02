import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic } from "@/lib/dsa/curriculum";
import { getLessonContent } from "@/lib/dsa/content";
import LessonEditor from "@/components/admin/LessonEditor";

export default async function AdminLessonPage(
  props: PageProps<"/admin/[section]/[topic]">
) {
  const { section: sectionSlug, topic: topicSlug } = await props.params;
  const result = await getTopic(sectionSlug, topicSlug);
  if (!result) notFound();
  const { section, topic } = result;

  const content = await getLessonContent(sectionSlug, topicSlug);

  return (
    <main>
      <Link
        href="/admin"
        className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
      >
        ← All lessons
      </Link>

      <div className="mt-space-sm flex flex-wrap items-baseline justify-between gap-space-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            {topic.title}
          </h1>
          <p className="font-body-sm text-body-sm mt-space-2xs text-on-surface-variant">
            {section.title} · {topic.chapter}
          </p>
        </div>
        <Link
          href={`/dsa/${section.slug}/${topic.slug}`}
          className="font-label-md text-label-md text-primary hover:underline"
        >
          View lesson →
        </Link>
      </div>

      <LessonEditor
        sectionSlug={section.slug}
        sectionTitle={section.title}
        topicSlug={topic.slug}
        lessonTitle={topic.title}
        chapterTitle={topic.chapter}
        initialBlocks={content?.blocks ?? []}
        updatedAt={content?.updatedAt ?? null}
      />
    </main>
  );
}
