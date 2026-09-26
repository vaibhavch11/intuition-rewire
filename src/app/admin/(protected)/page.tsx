import { getOutlines } from "@/lib/dsa/curriculum";
import { listAuthoredLessons } from "@/lib/dsa/content";
import CourseOutlineEditor from "@/components/admin/CourseOutlineEditor";

export const metadata = { title: "Content admin" };

export default async function AdminHomePage(props: PageProps<"/admin">) {
  const [outlines, authored, { discarded }] = await Promise.all([
    getOutlines(),
    listAuthoredLessons(),
    props.searchParams,
  ]);

  // Set by "Discard lesson" in the editor: reopen the course it came from.
  const discardedFrom = outlines.find(({ section }) => section.slug === discarded)?.section;

  return (
    <main>
      {discardedFrom && (
        <p
          role="status"
          className="font-body-md text-body-md mb-space-md rounded-lg bg-secondary-container/60 px-space-md py-space-sm text-on-secondary-container motion-safe:animate-fade-in"
        >
          Lesson discarded from {discardedFrom.title}.
        </p>
      )}

      <p className="font-body-md text-body-md text-on-surface-variant">
        Open a course to write its lessons, add new chapters and lessons, or
        remove the ones you don&apos;t need. Lessons marked{" "}
        <span className="font-semibold text-secondary">written</span> already
        have content saved.
      </p>

      <div className="mt-space-lg space-y-space-lg">
        {outlines.map(({ section, chapters }) => {
          const isWritten = (slug: string) => authored.has(`${section.slug}/${slug}`);
          const written = section.topics.filter((t) => isWritten(t.slug)).length;

          return (
            <details
              key={section.slug}
              open={section.slug === discardedFrom?.slug || undefined}
              className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-space-md px-space-lg py-space-md">
                <span className="font-headline-md text-headline-md text-on-surface">
                  {section.title}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {written}/{section.topics.length} written
                </span>
              </summary>

              <div className="border-t border-outline-variant/40 px-space-lg py-space-md">
                <CourseOutlineEditor
                  sectionSlug={section.slug}
                  sectionTitle={section.title}
                  chapters={chapters.map((chapter) => ({
                    title: chapter.title,
                    lessons: chapter.topics.map((topic) => ({
                      slug: topic.slug,
                      title: topic.title,
                      difficulty: topic.difficulty,
                      written: isWritten(topic.slug),
                    })),
                  }))}
                />
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
