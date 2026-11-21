import { ArrowRight, ChevronRight, Play } from "lucide-react";
import LearningPathSection from "@/components/home/LearningPathSection";
import WaterContainerSimulator from "@/components/home/WaterContainerSimulator";
import FinalCTA from "@/components/home/FinalCTA";
import LinkedListHero from "@/components/home/LinkedListHero";
import Link from "@/components/Link";
import PatternMarquee from "@/components/home/PatternMarquee";
import LearningFramework from "@/components/home/LearningFramework";
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

          <section className="max-w-7xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop pt-[24px] sm:pt-[32px] lg:pt-[40px] pb-[40px] sm:pb-[56px] lg:pb-[72px]">
            <div className="grid items-center gap-[48px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-[64px]">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <Link
                  href="/dsa/arrays"
                  className="group inline-flex max-w-full items-center gap-space-sm rounded-full border border-outline-variant/70 bg-surface-container-lowest/80 py-1 pl-1 pr-3 text-[13px] text-on-surface-variant shadow-[0_1px_2px_rgba(19,27,46,0.05)] backdrop-blur-sm transition-colors duration-200 hover:border-primary/40 motion-safe:animate-fade-up"
                >
                  <span className="shrink-0 rounded-full bg-primary-container px-2.5 py-0.5 text-[12px] font-semibold text-on-primary">New</span>
                  <span className="truncate">
                    Every dry run now plays in <span className="font-semibold text-on-surface">4 languages</span>
                  </span>
                  <ChevronRight size={14} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>

                <h1 className="mt-space-lg text-[40px] font-bold leading-[1.06] tracking-[-0.035em] text-on-surface sm:text-[56px] lg:text-[50px] xl:text-[62px] motion-safe:animate-fade-up [animation-delay:60ms]">
                  Stop <span className="strike-draw text-on-surface-variant/60">memorizing</span> code.{" "}
                  <span className="text-primary-container sm:block">
                    Build <span className="whitespace-nowrap">pattern-based</span> intuition.
                  </span>
                </h1>

                <p className="mt-space-lg max-w-xl text-[17px] leading-relaxed text-on-surface-variant sm:text-[18px] motion-safe:animate-fade-up [animation-delay:120ms]">
                  Your campus doesn&rsquo;t define your placement. Your skills do. Rewire how you think about coding
                  through interactive visual patterns.
                </p>

                <div className="mt-space-xl flex w-full flex-col items-stretch gap-space-sm sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-space-md lg:justify-start motion-safe:animate-fade-up [animation-delay:180ms]">
                  <Link
                    href="/dsa/arrays"
                    className="group inline-flex h-[48px] items-center justify-center gap-space-md whitespace-nowrap rounded-full bg-primary-container pl-[22px] pr-[6px] font-label-md text-[15px] font-semibold text-on-primary shadow-[0_10px_24px_-10px_rgba(79,70,229,0.8)] transition-all duration-200 hover:-translate-y-px hover:bg-primary hover:shadow-[0_14px_28px_-10px_rgba(53,37,205,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Start with Arrays, free
                    <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                  <HashLink
                    href="#water-challenge"
                    className="group inline-flex h-[48px] items-center justify-center gap-space-sm whitespace-nowrap rounded-full bg-surface-container-lowest pl-[8px] pr-[20px] font-label-md text-[15px] font-semibold text-on-surface shadow-[0_1px_2px_rgba(19,27,46,0.05)] ring-1 ring-inset ring-outline-variant transition-all duration-200 hover:-translate-y-px hover:bg-surface-container-low hover:ring-outline/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-primary-fixed text-primary transition-colors duration-200 group-hover:bg-primary-container group-hover:text-on-primary">
                      <Play size={12} fill="currentColor" className="translate-x-px" />
                    </span>
                    Try the Water Challenge
                  </HashLink>
                </div>

                <ul className="mt-space-lg flex flex-wrap items-center justify-center gap-x-space-sm gap-y-1 text-[13.5px] text-on-surface-variant lg:justify-start motion-safe:animate-fade-up [animation-delay:240ms]">
                  {["Arrays course free", "300+ step-by-step dry runs", "JS, Python, Java, C++", "Nothing to install"].map((fact, i) => (
                    <li key={fact} className="flex items-center gap-space-sm">
                      {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-outline" />}
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mx-auto w-full max-w-[460px] motion-safe:animate-fade-up [animation-delay:200ms] lg:mr-0">
                <LinkedListHero />
              </div>
            </div>
          </section>

          <PatternMarquee />
        </div>

        {/* Each section fades up as it scrolls into view (see .reveal). */}
        <div className="reveal">
          <LearningPathSection courses={courses} />
        </div>
        <div className="reveal">
          <ProductTourSection />
        </div>
        {/* Pinned while you scroll through it, so it sits outside .reveal (no transform on its ancestors). */}
        <LearningFramework />
        {/* Last: the hands-on challenge, which starts playing by itself once it scrolls into view. */}
        <div className="reveal">
          <WaterContainerSimulator />
        </div>
        <div className="reveal">
          <FinalCTA />
        </div>
      </div>
    </main>
  );
}
