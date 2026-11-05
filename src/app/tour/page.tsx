import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "@/components/Link";
import TourVideo, { TOUR_VIDEO } from "@/components/TourVideo";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata, videoJsonLd } from "@/lib/seo";

const TITLE = "IntuitionRewire Product Tour: 23-Second Video";
const DESCRIPTION =
  "A 23-second tour of IntuitionRewire: a visual DSA lesson, the Container With Most Water challenge, a BST insert dry run and the 3D memory board, recorded from the site.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tour",
  image: { url: TOUR_VIDEO.poster, alt: TOUR_VIDEO.label },
});

/**
 * The tour's watch page: the video is the main content here, which is what
 * Google needs to index it (the homepage only loads it when it's played).
 */
export default function TourPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-gutter-mobile py-space-2xl lg:px-gutter-desktop">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Product tour", path: "/tour" },
        ]}
      />
      <h1 className="font-headline-xl text-headline-xl-mobile mt-space-sm text-on-surface lg:text-headline-xl">
        IntuitionRewire in 23 seconds
      </h1>

      <div className="mt-space-lg overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_1px_2px_rgba(19,27,46,0.04),0_28px_56px_-32px_rgba(19,27,46,0.35)] ring-1 ring-outline-variant/70">
        <TourVideo />
      </div>

      <p className="mt-space-lg font-body-lg text-body-lg text-on-surface-variant">
        Everything in this tour is recorded straight from the site: the homepage in light and dark mode, a lesson with
        its hand-drawn diagrams, the Container With Most Water challenge, a binary search tree insert played step by step
        in the dry-run simulator, and the 3D memory board.
      </p>

      <div className="mt-space-xl flex flex-wrap gap-space-md">
        <Link
          href="/dsa"
          className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-lg py-space-sm font-label-md text-label-md text-on-primary hover:bg-primary-container"
        >
          Browse the courses <ArrowRight size={16} aria-hidden />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-outline-variant px-space-lg py-space-sm font-label-md text-label-md text-on-surface hover:border-primary hover:text-primary"
        >
          Back to the homepage
        </Link>
      </div>

      <JsonLd
        data={videoJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          path: "/tour",
          contentUrl: TOUR_VIDEO.src,
          thumbnailUrl: TOUR_VIDEO.poster,
          uploadDate: "2026-10-02T18:02:25+05:30",
          seconds: 23,
        })}
      />
    </main>
  );
}
