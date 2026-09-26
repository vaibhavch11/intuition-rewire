import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic } from "@/lib/dsa/data";
import { getLessonContent } from "@/lib/dsa/content";
import { requireSignedIn } from "@/lib/auth/session";
import DryRunPlayer from "@/components/DryRunPlayer";
import LessonBody from "@/components/dsa/LessonBody";
import LessonFooter from "@/components/dsa/LessonFooter";
import LessonReactions from "@/components/dsa/LessonReactions";

/**
 * Lesson content now lives in R2 once deployed, editable live via /admin —
 * this can't be statically prerendered or it would freeze at whatever was
 * committed at build/deploy time and never show a post-deploy save.
 */
export const dynamic = "force-dynamic";

export default async function TopicPage(
  props: PageProps<"/dsa/[section]/[topic]">
) {
  const { section: sectionSlug, topic: topicSlug } = await props.params;
  const result = getTopic(sectionSlug, topicSlug);
  if (!result) notFound();
  const { section, topic } = result;

  // Lessons need an account; see requiresSignIn() for what stays public.
  await requireSignedIn(`/dsa/${section.slug}/${topic.slug}`);

  const content = await getLessonContent(sectionSlug, topicSlug);

  const topicIndex = section.topics.findIndex((t) => t.slug === topic.slug);
  const prevTopic = section.topics[topicIndex - 1];
  const nextTopic = section.topics[topicIndex + 1];

  return (
    <div className="mx-auto max-w-6xl px-gutter-mobile py-space-2xl lg:px-space-2xl">
          <div className="lg:hidden">
            <Link
              href={`/dsa/${section.slug}`}
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
            >
              ← {section.title}
            </Link>
          </div>

          <h1 className="font-headline-xl text-headline-xl-mobile mt-space-sm text-on-surface lg:text-headline-xl">
            {topic.title}
          </h1>

          <div className="mt-space-md">
            <LessonReactions sectionSlug={section.slug} topicSlug={topic.slug} />
          </div>

          <hr className="mt-space-base mb-space-2xl border-outline-variant/50" />

          {content ? (
            <LessonBody blocks={content.blocks} />
          ) : topic.explanation ? (
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {topic.explanation}
            </p>
          ) : (
            <p className="font-body-lg text-body-lg text-on-surface-variant italic">
              This lesson is still being written.
            </p>
          )}

          {topic.trace && (
            <section className="mt-space-2xl">
              <h2 className="font-headline-md text-headline-md mb-space-md text-on-surface">
                Dry Run
              </h2>
              <DryRunPlayer trace={topic.trace} />
            </section>
          )}

          {topic.challengeId && (
            <section className="mt-space-2xl rounded-xl border border-dashed border-outline-variant p-space-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Try it yourself
              </h2>
              <p className="font-body-md text-body-md mt-space-xs text-on-surface-variant">
                Attempt this problem hands-on using the challenge ID below.
              </p>
              <code className="font-code-md text-code-md mt-space-sm inline-block rounded bg-surface-container px-space-sm py-space-2xs">
                {topic.challengeId}
              </code>
            </section>
          )}

          <LessonFooter
            sectionSlug={section.slug}
            topicSlug={topic.slug}
            prev={
              prevTopic
                ? { slug: prevTopic.slug, title: prevTopic.title }
                : null
            }
            next={
              nextTopic
                ? { slug: nextTopic.slug, title: nextTopic.title }
                : null
            }
          />
    </div>
  );
}
