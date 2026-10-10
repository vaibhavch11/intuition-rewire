import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { courseStats, type Section } from "@/lib/dsa/types";

/** Cards for the courses that build on this one, so readers (and crawlers) can move across topics. */
export default function RelatedCourses({ courses, heading = "Related courses" }: { courses: Section[]; heading?: string }) {
  if (courses.length === 0) return null;
  return (
    <section aria-labelledby="related-courses" className="mt-space-2xl">
      <h2 id="related-courses" className="font-headline-md text-headline-md text-on-surface">
        {heading}
      </h2>
      <ul className="mt-space-base grid gap-space-md sm:grid-cols-3">
        {courses.map((course) => {
          const stats = courseStats(course);
          const counts = [
            `${stats.lessons} ${stats.lessons === 1 ? "lesson" : "lessons"}`,
            ...(stats.problems > 0 ? [`${stats.problems} ${stats.problems === 1 ? "problem" : "problems"}`] : []),
          ].join(" · ");
          return (
            <li key={course.slug}>
              <Link
                href={`/dsa/${course.slug}`}
                className="group flex h-full flex-col rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-space-md transition-colors hover:border-primary/60"
              >
                <span className="font-label-md text-[17px] font-semibold text-on-surface">{course.title}</span>
                <span className="mt-space-xs line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                  {course.description}
                </span>
                <span className="mt-auto inline-flex items-center gap-space-xs pt-space-sm font-label-md text-label-md text-primary">
                  {counts}
                  <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
