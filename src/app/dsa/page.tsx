import type { Metadata } from "next";
import Link from "next/link";
import { getSections } from "@/lib/dsa/curriculum";
import { fitDescription, pageMetadata } from "@/lib/seo";
import { courseStats } from "@/lib/dsa/types";
import type { Section } from "@/lib/dsa/types";
import LargeScreenLattice from "@/components/dsa/LargeScreenLattice";

function CourseCard({ section }: { section: Section }) {
  const stats = courseStats(section);

  return (
    <Link
      href={`/dsa/${section.slug}`}
      className="reveal group relative flex flex-col rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-space-lg transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary">
        {section.title}
      </h3>
      <p className="font-body-md text-body-md mt-space-xs flex-1 text-on-surface-variant">
        {section.description}
      </p>

      <div className="font-body-sm text-body-sm mt-space-base flex flex-wrap items-center gap-space-md text-on-surface-variant">
        <span>
          <span className="font-semibold text-on-surface">{stats.lessons}</span>{" "}
          {stats.lessons === 1 ? "lesson" : "lessons"}
        </span>
        {stats.problems > 0 && (
          <span>
            <span className="font-semibold text-on-surface">
              {stats.problems}
            </span>{" "}
            {stats.problems === 1 ? "problem" : "problems"}
          </span>
        )}
        {stats.patterns > 0 && (
          <span>
            <span className="font-semibold text-on-surface">
              {stats.patterns}
            </span>{" "}
            {stats.patterns === 1 ? "pattern" : "patterns"}
          </span>
        )}
      </div>
    </Link>
  );
}

function CourseGrid({ title, items }: { title: string; items: Section[] }) {
  return (
    <section>
      <h2 className="font-headline-lg text-headline-lg text-on-surface">
        {title}
      </h2>
      <div className="mt-space-base grid gap-space-base sm:grid-cols-2">
        {items.map((section) => (
          <CourseCard key={section.slug} section={section} />
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const sections = await getSections();
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

export default async function DsaIndexPage() {
  const sections = await getSections();
  const totals = sections.reduce(
    (acc, section) => {
      const stats = courseStats(section);
      return {
        lessons: acc.lessons + stats.lessons,
        problems: acc.problems + stats.problems,
      };
    },
    { lessons: 0, problems: 0 }
  );

  return (
    <main>
      <section className="relative overflow-hidden border-b border-outline-variant/50 bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-space-xl px-gutter-mobile py-space-2xl lg:grid-cols-[1.05fr_1fr] lg:px-gutter-desktop">
          <div>
            <h1 className="font-headline-xl text-headline-xl-mobile text-on-surface lg:text-headline-xl">
              Data Structures &amp; Algorithms
            </h1>
            <p className="font-body-lg text-body-lg mt-space-md max-w-prose text-on-surface-variant">
              Every lesson is built around a dry run — you watch the memory
              change, step by step, instead of memorising the shape of a
              solution.
            </p>

            <div className="font-body-md text-body-md mt-space-lg flex flex-wrap gap-space-lg text-on-surface-variant">
              <span>
                <span className="font-headline-md text-headline-md font-bold text-primary">
                  {sections.length}
                </span>{" "}
                courses
              </span>
              <span>
                <span className="font-headline-md text-headline-md font-bold text-primary">
                  {totals.lessons}
                </span>{" "}
                lessons
              </span>
              <span>
                <span className="font-headline-md text-headline-md font-bold text-primary">
                  {totals.problems}
                </span>{" "}
                problems
              </span>
            </div>
          </div>

          <div
            aria-hidden
            className="hidden h-[300px] w-full lg:block"
            role="presentation"
          >
            <LargeScreenLattice />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-space-2xl px-gutter-mobile py-space-2xl lg:px-gutter-desktop">
        <CourseGrid
          title="Data Structures"
          items={sections.filter((s) => s.category === "data-structure")}
        />
        <CourseGrid
          title="Algorithms"
          items={sections.filter((s) => s.category === "algorithm")}
        />
      </div>
    </main>
  );
}
