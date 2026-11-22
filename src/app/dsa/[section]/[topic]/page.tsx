import { cache } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSections, getTopic } from "@/lib/dsa/curriculum";
import { getLessonContent } from "@/lib/dsa/content";
import { isFreeLesson } from "@/lib/dsa/access";
import { lessonPreview } from "@/lib/dsa/preview";
import { getSignedInUser } from "@/lib/auth/session";
import { isVerifiedSearchCrawler } from "@/lib/crawler";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { relatedCourses } from "@/lib/dsa/related";
import { isThinLesson, lessonDescription, lessonTitle } from "@/lib/dsa/seo";
import { courseOgImage, lessonJsonLd, pageMetadata } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import DryRunPlayer from "@/components/DryRunPlayer";
import JsonLd from "@/components/seo/JsonLd";
import LessonBody from "@/components/dsa/LessonBody";
import LessonFooter from "@/components/dsa/LessonFooter";
import LessonGate from "@/components/dsa/LessonGate";
import LessonReactions from "@/components/dsa/LessonReactions";
import RelatedCourses from "@/components/dsa/RelatedCourses";

/**
 * Lesson content now lives in R2 once deployed, editable live via /admin —
 * this can't be statically prerendered or it would freeze at whatever was
 * committed at build/deploy time and never show a post-deploy save.
 */
export const dynamic = "force-dynamic";

// Read once per request, shared by the metadata and the page.
const loadLesson = cache(getLessonContent);

export async function generateMetadata(props: PageProps<"/dsa/[section]/[topic]">): Promise<Metadata> {
  const { section: sectionSlug, topic: topicSlug } = await props.params;
  const result = await getTopic(sectionSlug, topicSlug);
  // Not found here, before anything is sent, so crawlers get a real 404 rather
  // than a "200 OK" page that only says not found (a soft 404).
  if (!result) notFound();
  const { section, topic } = result;
  const content = await loadLesson(sectionSlug, topicSlug);
  const sharedTitle = (await getSections()).some(
    (s) => s.slug !== section.slug && s.topics.some((t) => t.title === topic.title)
  );
  return pageMetadata({
    title: lessonTitle(section, topic, sharedTitle),
    description: lessonDescription(section, topic, content),
    path: `/dsa/${section.slug}/${topic.slug}`,
    image: courseOgImage(section.slug, section.title),
    // Placeholders, stubs and lessons with nothing written yet stay out of search.
    noindex: topic.slug === "coming-soon" || (content ? isThinLesson(content) : !topic.explanation),
    article: { modifiedTime: content?.updatedAt, section: section.title },
  });
}

export default async function TopicPage(
  props: PageProps<"/dsa/[section]/[topic]">
) {
  const { section: sectionSlug, topic: topicSlug } = await props.params;
  const result = await getTopic(sectionSlug, topicSlug);
  if (!result) notFound();
  const { section, topic } = result;
  const path = `/dsa/${section.slug}/${topic.slug}`;

  const content = await loadLesson(sectionSlug, topicSlug);
  // Free courses and open lessons are for everyone. Every other lesson shows its opening,
  // and the rest needs a free account. While sign-in isn't set up, nothing is held back.
  const free = isFreeLesson(section.slug, topic.slug);
  const locked = !free && isSupabaseConfigured() && (await getSignedInUser()) === null;
  const preview = locked && content ? lessonPreview(content.blocks) : null;
  // Verified Google and Bing crawlers read the whole lesson, with the part a
  // visitor signs up for inside `.lesson-locked` — the gated part named in the
  // lesson's structured data (Google's flexible sampling for registration
  // walls), so search indexes the full lesson without it being cloaking.
  const crawler = preview !== null && preview.rest.blocks > 0 && (await isVerifiedSearchCrawler(await headers()));
  const signedIn = !locked || crawler;

  const topicIndex = section.topics.findIndex((t) => t.slug === topic.slug);
  const prevTopic = section.topics[topicIndex - 1];
  const nextTopic = section.topics[topicIndex + 1];
  const related = relatedCourses(section.slug, await getSections());

  return (
    // Keyed by lesson so moving between lessons replays the entrance.
    <div
      key={`${section.slug}/${topic.slug}`}
      className="mx-auto max-w-6xl px-gutter-mobile py-space-2xl motion-safe:animate-lesson-in lg:px-space-2xl"
    >
          <Breadcrumbs
            crumbs={[
              { name: "Home", path: "/" },
              { name: "Courses", path: "/dsa" },
              { name: section.title, path: `/dsa/${section.slug}` },
              { name: topic.title, path },
            ]}
          />

          <h1 className="font-headline-xl text-headline-xl-mobile mt-space-sm text-on-surface lg:text-headline-xl">
            {topic.title}
          </h1>

          <div className="mt-space-md">
            <LessonReactions sectionSlug={section.slug} topicSlug={topic.slug} />
          </div>

          <hr className="mt-space-base mb-space-2xl border-outline-variant/50" />

          {content ? (
            <>
              <LessonBody blocks={preview ? preview.shown : content.blocks} />
              {crawler && preview && (
                <div className="lesson-locked">
                  <LessonBody blocks={content.blocks.slice(preview.shown.length)} />
                </div>
              )}
            </>
          ) : locked ? null : topic.explanation ? (
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {topic.explanation}
            </p>
          ) : (
            <p className="font-body-lg text-body-lg text-on-surface-variant italic">
              This lesson is still being written.
            </p>
          )}

          {!signedIn && <LessonGate path={path} rest={preview?.rest.blocks ? preview.rest : null} />}

          {topic.trace && signedIn && (
            <section className="mt-space-2xl">
              <h2 className="font-headline-md text-headline-md mb-space-md text-on-surface">
                Dry Run
              </h2>
              <DryRunPlayer trace={topic.trace} />
            </section>
          )}

          {topic.challengeId && signedIn && (
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

          <RelatedCourses courses={related} heading="Keep exploring" />

          {content && (
            <JsonLd
              data={lessonJsonLd({
                title: topic.title,
                description: lessonDescription(section, topic, content),
                path,
                image: courseOgImage(section.slug, section.title),
                courseName: section.title,
                modifiedTime: content.updatedAt,
                free,
              })}
            />
          )}
    </div>
  );
}
