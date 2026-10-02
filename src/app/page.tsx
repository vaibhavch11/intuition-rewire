import { ArrowDown, Play, SquareTerminal, Cpu, Brain } from "lucide-react";
import ParticleNetwork from "@/components/home/ParticleNetwork";
import LearningPathSection from "@/components/home/LearningPathSection";
import AlgorithmRace from "@/components/home/AlgorithmRace";
import ComparisonSection from "@/components/home/ComparisonSection";
import HardwareTeaserSection from "@/components/home/HardwareTeaserSection";
import FinalCTA from "@/components/home/FinalCTA";
import ProductTourSection from "@/components/home/ProductTourSection";
import HashLink from "@/components/HashLink";
import { getSections } from "@/lib/dsa/curriculum";

const HIGHLIGHTS = [
  { icon: SquareTerminal, value: "100%", label: "Visual dry-runs" },
  { icon: Cpu, value: "RAM-level", label: "Hardware intuition" },
  { icon: Brain, value: "Zero", label: "Templates to memorize" },
];

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
      <div className="flex flex-col w-full">
        {/* Top ambient glow field + three.js particle network */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-primary-fixed-dim/40 via-surface-variant/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-secondary-fixed/20 blur-2xl pointer-events-none -z-10 rounded-full" />
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <ParticleNetwork />
          </div>

          <section className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-2xl pb-space-xl flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-space-xs px-space-md py-space-2xs rounded-full border border-primary/15 bg-primary-fixed/50 mb-space-lg motion-safe:animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label-tag text-label-tag text-primary uppercase tracking-wider">
                Intuition Over Rote Memorization
              </span>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-on-surface max-w-4xl tracking-tight motion-safe:animate-fade-up [animation-delay:80ms]">
              Rewire Your Intuition for{" "}
              <span className="text-primary-container">Algorithms</span> &amp;
              Memory Physics
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-space-md mb-space-xl motion-safe:animate-fade-up [animation-delay:160ms]">
              Stop blindly memorizing LeetCode templates. Build visceral
              hardware-level intuition through step-by-step problem dry-runs, RAM
              spatial locality, and interactive data structure anatomy.
            </p>

            <div className="mb-space-2xl flex w-full flex-col items-stretch justify-center gap-space-sm sm:w-auto sm:flex-row sm:items-center sm:gap-space-md motion-safe:animate-fade-up [animation-delay:240ms]">
              <HashLink
                href="#learning-path"
                className="group inline-flex h-12 items-center justify-center gap-space-sm rounded-xl bg-primary-container px-space-lg font-label-md text-[15px] font-semibold text-on-primary shadow-[0_10px_24px_-10px_rgba(79,70,229,0.8)] transition-all duration-200 hover:-translate-y-px hover:bg-primary hover:shadow-[0_14px_28px_-10px_rgba(53,37,205,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Explore Visual Roadmap
                <ArrowDown size={18} className="transition-transform duration-200 group-hover:translate-y-0.5" />
              </HashLink>
              <HashLink
                href="#algorithm-race"
                className="group inline-flex h-12 items-center justify-center gap-space-sm rounded-xl bg-surface-container-lowest pl-space-md pr-space-lg font-label-md text-[15px] font-semibold text-on-surface shadow-[0_1px_2px_rgba(19,27,46,0.05)] ring-1 ring-inset ring-outline-variant transition-all duration-200 hover:-translate-y-px hover:bg-surface-container-low hover:ring-outline/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-primary transition-colors duration-200 group-hover:bg-primary-container group-hover:text-on-primary">
                  <Play size={12} fill="currentColor" className="translate-x-px" />
                </span>
                Watch the Algorithm Race
              </HashLink>
            </div>

            <dl className="grid w-full max-w-4xl grid-cols-1 divide-y divide-outline-variant/60 overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest/85 text-left shadow-[0_1px_2px_rgba(19,27,46,0.04),0_18px_40px_-24px_rgba(19,27,46,0.25)] backdrop-blur-md sm:grid-cols-3 sm:divide-x sm:divide-y-0 motion-safe:animate-fade-up [animation-delay:320ms]">
              {HIGHLIGHTS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-space-md px-space-lg py-space-md sm:py-space-lg">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed/60 text-primary ring-1 ring-inset ring-primary/10">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <div className="flex min-w-0 flex-col-reverse">
                    <dt className="font-body-sm text-body-sm text-on-surface-variant">{label}</dt>
                    <dd className="text-[22px] font-semibold leading-7 tracking-tight text-on-surface">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
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
          <AlgorithmRace />
        </div>
        <div className="reveal">
          <ComparisonSection />
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
