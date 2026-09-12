import Link from "next/link";
import { sections } from "@/lib/dsa/data";
import { listAuthoredLessons } from "@/lib/dsa/content";
import { groupByChapter } from "@/lib/dsa/types";

export const metadata = { title: "Content admin" };

export default async function AdminHomePage() {
  const authored = await listAuthoredLessons();

  return (
    <main>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Pick a lesson to write its body. Lessons marked{" "}
        <span className="font-semibold text-secondary">written</span> already
        have content saved.
      </p>

      <div className="mt-space-lg space-y-space-lg">
        {sections.map((section) => {
          const written = section.topics.filter((t) =>
            authored.has(`${section.slug}/${t.slug}`)
          ).length;

          return (
            <details
              key={section.slug}
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
                {groupByChapter(section.topics).map((chapter) => (
                  <div key={chapter.title} className="mb-space-md last:mb-0">
                    <h3 className="font-label-md text-label-md font-bold text-on-surface">
                      {chapter.title}
                    </h3>
                    <ul className="mt-space-xs">
                      {chapter.topics.map((topic) => (
                        <li key={topic.slug}>
                          <Link
                            href={`/admin/${section.slug}/${topic.slug}`}
                            className="flex items-center justify-between gap-space-md rounded px-space-sm py-space-xs hover:bg-surface-container"
                          >
                            <span className="font-body-md text-body-md text-primary">
                              {topic.title}
                            </span>
                            {authored.has(`${section.slug}/${topic.slug}`) && (
                              <span className="font-label-tag text-label-tag rounded bg-secondary-container px-space-sm py-space-2xs text-on-secondary-container">
                                written
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
