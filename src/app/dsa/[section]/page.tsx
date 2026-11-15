import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Check,
  Image as ImageIcon,
  Presentation,
  Puzzle,
  SquareTerminal,
} from "lucide-react";
import { getSection, getSections } from "@/lib/dsa/curriculum";
import { relatedCourses } from "@/lib/dsa/related";
import { courseDescription, courseTitle, courseWorkload } from "@/lib/dsa/seo";
import { courseStats, groupByChapter, isComingSoon } from "@/lib/dsa/types";
import { courseJsonLd, courseOgImage, pageMetadata } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import RelatedCourses from "@/components/dsa/RelatedCourses";
import type { Difficulty, Topic } from "@/lib/dsa/types";
import ChapterProgress from "@/components/dsa/ChapterProgress";
import CourseProgressInvite from "@/components/dsa/CourseProgressInvite";
import RichText from "@/components/dsa/RichText";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Fundamental:
    "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/30",
  Easy: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30",
  Hard: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/15 dark:text-red-300 dark:ring-red-400/30",
};

function StatChip({
  icon: Icon,
  count,
  label,
}: {
  icon: typeof BookOpen;
  count: number;
  label: string;
}) {
  return (
    <li className="font-label-md text-label-md flex items-center gap-space-sm rounded-lg border border-outline-variant/70 px-space-md py-space-xs text-on-surface-variant">
      <Icon size={15} className="shrink-0 text-primary" />
      <span>
        <span className="font-semibold text-on-surface">{count}</span> {label}
      </span>
    </li>
  );
}

function SyllabusRow({
  topic,
  sectionSlug,
  isFirst,
  isLast,
}: {
  topic: Topic;
  sectionSlug: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="relative pl-space-xl">
      {!isFirst && (
        <span
          aria-hidden
          className="absolute left-[7px] top-0 h-1/2 w-px bg-outline-variant"
        />
      )}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[7px] top-1/2 h-1/2 w-px bg-outline-variant"
        />
      )}
      <span
        aria-hidden
        className="absolute left-0 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full border-[1.5px] border-outline bg-surface-container-lowest"
      />

      <Link
        href={`/dsa/${sectionSlug}/${topic.slug}`}
        className="group flex items-center justify-between gap-space-md py-space-sm"
      >
        <span className="font-body-md text-body-md text-primary group-hover:underline">
          {topic.title}
        </span>

        <span className="flex shrink-0 items-center gap-space-md">
          {topic.hasCodeSolution && (
            <span className="hidden text-[9px] leading-[10px] text-on-surface-variant/70 sm:block">
              code
              <br />
              solution
            </span>
          )}
          {topic.difficulty && (
            <span
              className={`font-label-tag text-label-tag rounded px-space-sm py-space-2xs ring-1 ring-inset ${
                DIFFICULTY_STYLES[topic.difficulty]
              }`}
            >
              {topic.difficulty}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

export async function generateMetadata(props: PageProps<"/dsa/[section]">): Promise<Metadata> {
  const { section: sectionSlug } = await props.params;
  const section = await getSection(sectionSlug);
  if (!section) return {};
  return pageMetadata({
    title: courseTitle(section),
    description: courseDescription(section),
    path: `/dsa/${section.slug}`,
    image: courseOgImage(section.slug, section.title),
    // A course with no lessons yet is a thin page: out of search until it's written.
    noindex: isComingSoon(section),
  });
}

export default async function SectionPage(props: PageProps<"/dsa/[section]">) {
  const { section: sectionSlug } = await props.params;
  const section = await getSection(sectionSlug);
  if (!section) notFound();

  const chapters = groupByChapter(section.topics);
  const stats = courseStats(section);
  const hasIntro =
    (section.overview?.length ?? 0) > 0 ||
    (section.requirements?.length ?? 0) > 0;
  const related = relatedCourses(section.slug, await getSections());

  return (
    <main>
      <div className="mx-auto max-w-4xl px-gutter-mobile py-space-xl lg:px-gutter-desktop">
        <Breadcrumbs
          crumbs={[
            { name: "Home", path: "/" },
            { name: "Courses", path: "/dsa" },
            { name: section.title, path: `/dsa/${section.slug}` },
          ]}
        />

        <header className="mt-space-md rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            {section.title}
          </h1>
          <p className="font-body-md text-body-md mt-space-sm text-on-surface-variant">
            {section.tagline ?? section.description}
          </p>

          <ul className="mt-space-base flex flex-wrap gap-space-sm">
            <StatChip
              icon={BookOpen}
              count={stats.lessons}
              label={stats.lessons === 1 ? "Lesson" : "Lessons"}
            />
            {stats.problems > 0 && (
              <StatChip
                icon={SquareTerminal}
                count={stats.problems}
                label={stats.problems === 1 ? "Problem" : "Problems"}
              />
            )}
            {stats.patterns > 0 && (
              <StatChip
                icon={Puzzle}
                count={stats.patterns}
                label={stats.patterns === 1 ? "Pattern" : "Patterns"}
              />
            )}
            {stats.illustrations > 0 && (
              <StatChip
                icon={ImageIcon}
                count={stats.illustrations}
                label="Illustrations"
              />
            )}
            {stats.slides > 0 && (
              <StatChip
                icon={Presentation}
                count={stats.slides}
                label="Slides"
              />
            )}
          </ul>
        </header>

        {section.outcomes && section.outcomes.length > 0 && (
          <section className="mt-space-lg rounded-xl border border-outline-variant/40 bg-surface-container-low p-space-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              What you will learn
            </h2>
            <ul className="mt-space-base grid gap-x-space-xl gap-y-space-md sm:grid-cols-2">
              {section.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-space-sm">
                  <Check size={16} className="mt-0.5 shrink-0 text-secondary" />
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    {outcome}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasIntro && (
          <div className="mt-space-xl">
            <section>
              {section.overview && section.overview.length > 0 && (
                <>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Why this course
                  </h2>
                  <div className="mt-space-md space-y-space-md">
                    {section.overview.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="font-body-lg text-body-lg text-on-surface-variant"
                      >
                        <RichText text={paragraph} />
                      </p>
                    ))}
                  </div>
                </>
              )}

              {section.requirements && section.requirements.length > 0 && (
                <>
                  <h2 className="font-headline-md text-headline-md mt-space-xl text-on-surface">
                    Requirements
                  </h2>
                  <ul className="mt-space-md list-disc space-y-space-sm pl-space-lg">
                    {section.requirements.map((requirement) => (
                      <li
                        key={requirement}
                        className="font-body-md text-body-md text-on-surface-variant"
                      >
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        )}

        <section className="mt-space-xl">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Course Contents
          </h2>
          <CourseProgressInvite />

          {chapters.length === 0 && (
            <p className="font-body-md text-body-md mt-space-base text-on-surface-variant">
              Lessons for this course are on their way.
            </p>
          )}

          <div className="mt-space-base space-y-space-md">
            {chapters.map((chapter, i) => (
              <article
                key={chapter.title}
                className="reveal rounded-xl border border-outline-variant/70 bg-surface-container-lowest"
              >
                <header className="flex items-center justify-between gap-space-md px-space-lg py-space-md">
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    {i + 1}. {chapter.title}
                  </h3>
                  <ChapterProgress
                    sectionSlug={section.slug}
                    topicSlugs={chapter.topics.map((t) => t.slug)}
                  />
                </header>

                <ol className="border-t border-outline-variant/40 px-space-lg py-space-md">
                  {chapter.topics.map((topic, j) => (
                    <SyllabusRow
                      key={topic.slug}
                      topic={topic}
                      sectionSlug={section.slug}
                      isFirst={j === 0}
                      isLast={j === chapter.topics.length - 1}
                    />
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <RelatedCourses courses={related} />

        {!isComingSoon(section) && (
          <JsonLd
            data={courseJsonLd({
              name: section.title,
              description: courseDescription(section),
              path: `/dsa/${section.slug}`,
              image: courseOgImage(section.slug, section.title),
              workloadHours: courseWorkload(section).hours,
              chapters: courseWorkload(section).chapters,
              teaches: section.outcomes,
              prerequisites: section.requirements,
            })}
          />
        )}
      </div>
    </main>
  );
}
