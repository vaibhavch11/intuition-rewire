import type { Metadata } from "next";
import { OG_COURSE_IMAGES } from "./og-images";

/**
 * The site's public address — the one place to change when the domain changes.
 * Canonical URLs, the sitemap, robots.txt and link previews are all built from it.
 */
export const SITE_URL = "https://intuitionrewire.com";
export const SITE_NAME = "IntuitionRewire";

const MAX_TITLE = 60;
const MIN_DESCRIPTION = 140;
export const MAX_DESCRIPTION = 160;

/** Turns a path like "/dsa/queue" into an absolute URL on SITE_URL. */
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

/** Lesson and course copy uses **bold**, `code` and [links](...); search snippets want plain text. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** The first candidate that fits in a search result title (60 characters). */
export function fitTitle(...candidates: string[]): string {
  for (const candidate of candidates) {
    if (candidate.length <= MAX_TITLE) return candidate;
  }
  const last = candidates[candidates.length - 1];
  return `${last.slice(0, last.lastIndexOf(" ", MAX_TITLE - 1)).replace(/[,:;–—-]+$/, "")}…`;
}

/**
 * A 140–160 character description: `extras` top up a short one, and a long one
 * is cut at a sentence end if that keeps it over 140, else at a word.
 */
export function fitDescription(primary: string, extras: string[] = []): string {
  let text = plainText(primary);
  for (const extra of extras) {
    if (text.length >= MIN_DESCRIPTION) break;
    text = `${text.replace(/[.\s]*$/, ".")} ${extra}`;
  }
  if (text.length <= MAX_DESCRIPTION) return text;
  const cut = text.slice(0, MAX_DESCRIPTION);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "), cut.endsWith(".") ? cut.length - 1 : -1);
  if (sentenceEnd + 1 >= MIN_DESCRIPTION) return cut.slice(0, sentenceEnd + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ", MAX_DESCRIPTION - 2)).replace(/[,:;–—-]+$/, "")}…`;
}

// ------------------------------------------------------------------ link-preview images (1200x630)
export interface OgImage {
  url: string;
  alt: string;
}
export const DEFAULT_OG_IMAGE: OgImage = {
  url: "/og/default.png?v=2",
  alt: "IntuitionRewire — master DSA by watching it run: visual lessons, dry-run simulators and interview questions",
};
/** A course's own preview image (its name on the brand background), or the default. */
export function courseOgImage(sectionSlug: string, sectionTitle: string): OgImage {
  return OG_COURSE_IMAGES.has(sectionSlug)
    ? { url: `/og/${sectionSlug}.png?v=2`, alt: `${sectionTitle} — DSA patterns and interview questions on IntuitionRewire` }
    : DEFAULT_OG_IMAGE;
}

// ------------------------------------------------------------------ page metadata
interface PageSeo {
  title: string;
  description: string;
  /** The page's clean path, e.g. "/dsa/queue" — becomes the canonical URL. */
  path: string;
  image?: OgImage;
  noindex?: boolean;
  /** Lessons are articles; everything else is a website page. */
  article?: { modifiedTime?: string; section?: string };
}

/** Title, description, canonical URL, Open Graph and X card for one page. */
export function pageMetadata({ title, description, path, image = DEFAULT_OG_IMAGE, noindex, article }: PageSeo): Metadata {
  const images = [{ url: image.url, width: 1200, height: 630, alt: image.alt }];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      ...(article ? { type: "article", modifiedTime: article.modifiedTime, section: article.section } : { type: "website" }),
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

// ------------------------------------------------------------------ structured data (JSON-LD)
const ORGANIZATION = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/og/logo.png"),
};

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  };
}

export function websiteJsonLd() {
  return [
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "en" },
    { "@context": "https://schema.org", ...ORGANIZATION },
  ];
}

/** A video on its watch page: the fields Google's video results require, and the recommended ones. */
export function videoJsonLd(video: {
  name: string;
  description: string;
  path: string;
  contentUrl: string;
  thumbnailUrl: string;
  uploadDate: string;
  seconds: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    url: absoluteUrl(video.path),
    contentUrl: absoluteUrl(video.contentUrl),
    thumbnailUrl: [absoluteUrl(video.thumbnailUrl)],
    uploadDate: video.uploadDate,
    duration: `PT${video.seconds}S`,
    inLanguage: "en",
    publisher: ORGANIZATION,
  };
}

/** Hours as an ISO 8601 duration, e.g. 8 -> "PT8H". */
const hours = (h: number) => `PT${Math.max(1, Math.round(h))}H`;

/**
 * A course, with every field Google's Course info result requires (provider,
 * offers, hasCourseInstance) and the recommended ones it can fill in.
 */
export function courseJsonLd(course: {
  name: string;
  description: string;
  path: string;
  image: OgImage;
  workloadHours: number;
  chapters: { name: string; lessons: number; hours: number }[];
  teaches?: string[];
  prerequisites?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    url: absoluteUrl(course.path),
    image: absoluteUrl(course.image.url),
    inLanguage: "en",
    isAccessibleForFree: true,
    educationalLevel: "Beginner to intermediate",
    provider: ORGANIZATION,
    offers: [{ "@type": "Offer", category: "Free" }],
    hasCourseInstance: [{ "@type": "CourseInstance", courseMode: "Online", courseWorkload: hours(course.workloadHours) }],
    syllabusSections: course.chapters.map((c) => ({
      "@type": "Syllabus",
      name: c.name,
      description: `${c.lessons} ${c.lessons === 1 ? "lesson" : "lessons"}`,
      timeRequired: hours(c.hours),
    })),
    ...(course.teaches?.length ? { teaches: course.teaches } : {}),
    ...(course.prerequisites?.length ? { coursePrerequisites: course.prerequisites } : {}),
  };
}

/** The course catalog as an ItemList of course pages: Google's course list markup. */
export function courseListJsonLd(courses: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(c.path), name: c.name })),
  };
}

/**
 * A lesson. Free courses are open to all. Every other lesson's full text needs
 * a free account, so it is marked as not freely accessible, with the sign-in
 * prompt (`.lesson-locked`) as the gated part — Google's markup for
 * registration walls.
 */
export function lessonJsonLd(lesson: {
  title: string;
  description: string;
  path: string;
  image: OgImage;
  courseName: string;
  modifiedTime?: string;
  free: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: lesson.title.slice(0, 110),
    description: lesson.description,
    url: absoluteUrl(lesson.path),
    mainEntityOfPage: absoluteUrl(lesson.path),
    image: absoluteUrl(lesson.image.url),
    articleSection: lesson.courseName,
    inLanguage: "en",
    ...(lesson.modifiedTime ? { dateModified: lesson.modifiedTime } : {}),
    author: ORGANIZATION,
    publisher: ORGANIZATION,
    ...(lesson.free
      ? { isAccessibleForFree: true }
      : {
          isAccessibleForFree: false,
          hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: ".lesson-locked" },
        }),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}
