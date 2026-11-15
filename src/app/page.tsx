import { ArrowDown, Play } from "lucide-react";
import LearningPathSection from "@/components/home/LearningPathSection";
import WaterContainerSimulator from "@/components/home/WaterContainerSimulator";
import HardwareTeaserSection from "@/components/home/HardwareTeaserSection";
import FinalCTA from "@/components/home/FinalCTA";
import ProductTourSection from "@/components/home/ProductTourSection";
import HashLink from "@/components/HashLink";
import { getSections } from "@/lib/dsa/curriculum";
import { pageMetadata, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export const metadata = pageMetadata({
  title: "IntuitionRewire: Learn DSA by Watching It Run",
  description:
    "Learn data structures and algorithms by watching them run: hand-drawn lessons, step-by-step dry-run simulators and interview problems in four languages.",
  path: "/",
});

export default async function Home() {
  // Counts only, so the full curriculum never reaches the browser bundle.
  const courses = (await getSections()).map((s) => ({
    slug: s.slug,
    title: s.title,
    category: s.category,
    lessons: s.topics.length,
  }));

  return (
    <main className="w-full bg-surface min-h-[calc(100vh-56px)]">
      <JsonLd data={websiteJsonLd()} />
      <div className="flex flex-col w-full">
        {/* Hero backdrop: a soft lavender glow and a faint grid texture */}
        <div className="relative isolate w-full overflow-hidden">
          {/* Big blur filters are costly for phone GPUs, so below lg the same
              glows are drawn as soft radial gradients instead. */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-primary-fixed-dim/40 via-surface-variant/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full hidden lg:block" />
          <div
            className="absolute -top-56 left-1/2 -translate-x-1/2 w-[900px] h-[640px] pointer-events-none -z-10 lg:hidden"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary-fixed-dim) 40%, transparent), color-mix(in oklab, var(--color-surface-variant) 30%, transparent) 55%, transparent)",
            }}
          />
          <div className="hero-grid absolute inset-0 -z-10 pointer-events-none" aria-hidden="true" />

          <section className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop pt-[72px] sm:pt-[96px] lg:pt-[120px] pb-[56px] sm:pb-[80px] lg:pb-[96px] flex flex-col items-center text-center">
            <h1 className="max-w-5xl text-[40px] font-bold leading-[1.06] tracking-[-0.035em] text-on-surface sm:text-[56px] lg:text-[72px] motion-safe:animate-fade-up">
              Stop memorizing code.{" "}
              <span className="text-primary-container sm:block">Build <span className="whitespace-nowrap">pattern-based</span> intuition.</span>
            </h1>

            <p className="max-w-3xl mt-space-lg mb-space-xl text-[17px] leading-relaxed text-on-surface-variant sm:text-[19px] motion-safe:animate-fade-up [animation-delay:80ms]">
              Your campus doesn’t define your placement. Your skills do. Rewire how
              you think about coding through interactive visual patterns.
            </p>

            <div className="flex w-full flex-col items-stretch justify-center gap-space-sm sm:w-auto sm:flex-row sm:items-center sm:gap-space-md motion-safe:animate-fade-up [animation-delay:160ms]">
              <HashLink
                href="#learning-path"
                className="group inline-flex h-[44px] items-center justify-center gap-space-sm rounded-[10px] bg-primary-container px-[22px] font-label-md text-[15px] font-semibold text-on-primary shadow-[0_10px_24px_-10px_rgba(79,70,229,0.8)] transition-all duration-200 hover:-translate-y-px hover:bg-primary hover:shadow-[0_14px_28px_-10px_rgba(53,37,205,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Explore Visual Roadmap
                <ArrowDown size={16} className="transition-transform duration-200 group-hover:translate-y-0.5" />
              </HashLink>
              <HashLink
                href="#water-challenge"
                className="group inline-flex h-[44px] items-center justify-center gap-space-sm rounded-[10px] bg-surface-container-lowest pl-[12px] pr-[20px] font-label-md text-[15px] font-semibold text-on-surface shadow-[0_1px_2px_rgba(19,27,46,0.05)] ring-1 ring-inset ring-outline-variant transition-all duration-200 hover:-translate-y-px hover:bg-surface-container-low hover:ring-outline/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-primary-fixed text-primary transition-colors duration-200 group-hover:bg-primary-container group-hover:text-on-primary">
                  <Play size={11} fill="currentColor" className="translate-x-px" />
                </span>
                Try the Water Challenge
              </HashLink>
            </div>
          </section>
        </div>

        {/* Each section fades up as it scrolls into view (see .reveal). */}
        <div className="reveal">
          <LearningPathSection courses={courses} />
        </div>
        <div className="reveal">
          <ProductTourSection />
        </div>
        <div className="reveal">
          <WaterContainerSimulator />
        </div>
        <div className="reveal">
          <HardwareTeaserSection />
        </div>
        <div className="reveal">
          <FinalCTA />
        </div>
      </div>
    </main>
  );
}
