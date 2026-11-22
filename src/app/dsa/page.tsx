import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "@/components/Link";
import { getSections } from "@/lib/dsa/curriculum";
import { courseListJsonLd, fitDescription, pageMetadata } from "@/lib/seo";
import { courseStats, groupByChapter, isComingSoon, isProblem } from "@/lib/dsa/types";
import JsonLd from "@/components/seo/JsonLd";
import { isFreeCourse, isFreeLesson } from "@/lib/dsa/access";
import { buildPath } from "@/lib/dsa/path";
import CurriculumExplorer, { type CurriculumCourse } from "@/components/dsa/CurriculumExplorer";

export async function generateMetadata(): Promise<Metadata> {
  // Same courses the page lists: ones still waiting for lessons don't count.
  const sections = (await getSections()).filter((s) => !isComingSoon(s));
  const lessons = sections.reduce((n, s) => n + courseStats(s).lessons, 0);
  const problems = sections.reduce((n, s) => n + courseStats(s).problems, 0);
  return pageMetadata({
    title: "DSA Courses & Interview Problems | IntuitionRewire",
    description: fitDescription(
      `${sections.length} data structures and algorithms courses, ${lessons} lessons and ${problems} interview problems. Every lesson is built around a dry run: watch the memory change, step by step.`,
      ["Free to learn."]
    ),
    path: "/dsa",
  });
}

/**
 * The Data Structures & Algorithms track: what it is, then the curriculum
 * board (Beginner, Intermediate, Advanced, in the order to take them) with the
 * chosen course's chapters and lessons underneath.
 */
export default async function DsaIndexPage() {
  const sections = (await getSections()).filter((s) => !isComingSoon(s));

  // Only what the board needs, so the page stays light in the browser.
  const courses: CurriculumCourse[] = sections.map((section) => {
    const stats = courseStats(section);
    const topics = section.topics.filter((t) => t.slug !== "coming-soon");
    return {
      slug: section.slug,
      title: section.title,
      description: section.tagline ?? section.description,
      free: isFreeCourse(section.slug),
      lessons: stats.lessons,
      problems: stats.problems,
      chapters: groupByChapter(topics).map((chapter) => ({
        title: chapter.title,
        topics: chapter.topics.map((t) => ({
          slug: t.slug,
          title: t.title,
          problem: isProblem(t),
          open: isFreeLesson(section.slug, t.slug),
          ...(t.difficulty ? { difficulty: t.difficulty } : {}),
        })),
      })),
    };
  });
  const stages = buildPath(courses);
  const inPath = stages.flatMap((s) => s.rows.map((r) => r.course));
  const totals = inPath.reduce((acc, c) => ({ lessons: acc.lessons + c.lessons, problems: acc.problems + c.problems }), {
    lessons: 0,
    problems: 0,
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-gutter-mobile py-space-xl lg:px-gutter-desktop">
      {/* What this track is */}
      <section className="max-w-3xl">
        <p className="font-code-sm text-[11px] uppercase tracking-[0.18em] text-primary">Data Structures &amp; Algorithms</p>
        <h1 className="mt-space-sm text-[32px] font-bold leading-[1.1] tracking-tight text-on-surface sm:text-[44px]">
          Learn Data Structures &amp; Algorithms from <span className="text-primary-container">first principles</span>.
        </h1>
        <p className="mt-space-md text-[16px] leading-relaxed text-on-surface-variant sm:text-[17px]">
          Start with why each structure exists and what it costs, then watch the code run line by line. The courses build on
          each other, so take them in order, from Arrays to Dynamic Programming.
        </p>
        <div className="mt-space-lg flex flex-wrap items-center gap-x-space-xl gap-y-space-md">
          <dl className="flex gap-space-xl">
            {[
              { value: inPath.length, label: "courses" },
              { value: totals.lessons, label: "lessons" },
              { value: totals.problems, label: "problems" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="text-[13px] text-on-surface-variant">{stat.label}</dt>
                <dd className="text-[24px] font-bold tracking-tight text-on-surface">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/dsa/arrays"
            className="group inline-flex h-11 items-center gap-space-sm rounded-[10px] bg-primary-container px-[20px] text-[15px] font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            Start with Arrays
            <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <div className="mt-space-2xl">
        <CurriculumExplorer stages={stages} />
      </div>

      {/* The courses with lessons, as a list Google can show as course results. */}
      <JsonLd data={courseListJsonLd(inPath.map((c) => ({ name: c.title, path: `/dsa/${c.slug}` })))} />
    </main>
  );
}
