import Link from "next/link";
import { ArrowDown, PlayCircle, Box, Cpu, Brain } from "lucide-react";
import ParticleNetwork from "@/components/home/ParticleNetwork";
import LearningPathSection from "@/components/home/LearningPathSection";
import AlgorithmRace from "@/components/home/AlgorithmRace";
import ComparisonSection from "@/components/home/ComparisonSection";
import HardwareTeaserSection from "@/components/home/HardwareTeaserSection";
import FinalCTA from "@/components/home/FinalCTA";
import { getSections } from "@/lib/dsa/curriculum";

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
            <div className="inline-flex items-center gap-space-xs px-space-md py-space-2xs rounded-full bg-primary-fixed/60 shadow-sm mb-space-lg motion-safe:animate-fade-up">
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

            <div className="flex flex-wrap items-center justify-center gap-space-md mb-space-2xl motion-safe:animate-fade-up [animation-delay:240ms]">
              <Link
                href="#learning-path"
                className="inline-flex items-center gap-space-sm h-11 px-space-lg bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-md hover:bg-primary transition-all duration-200"
              >
                <span>Explore Visual Roadmap</span>
                <ArrowDown size={18} />
              </Link>
              <Link
                href="#algorithm-race"
                className="inline-flex items-center gap-space-sm h-11 px-space-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg shadow-sm hover:bg-surface-container-low transition-all duration-200"
              >
                <PlayCircle size={20} className="text-primary" />
                <span>Watch the Algorithm Race</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md w-full max-w-4xl p-space-md rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-sm motion-safe:animate-fade-up [animation-delay:320ms]">
              <div className="flex items-center gap-space-md p-space-sm">
                <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-on-secondary-container">
                  <Box size={22} />
                </div>
                <div className="text-left">
                  <div className="font-headline-md text-headline-md text-on-surface">
                    100%
                  </div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant">
                    Visual Dry-Runs
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-md p-space-sm">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary">
                  <Cpu size={22} />
                </div>
                <div className="text-left">
                  <div className="font-headline-md text-headline-md text-on-surface">
                    Hardware
                  </div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant">
                    To-Code RAM Mapping
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-md p-space-sm">
                <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/50 flex items-center justify-center text-tertiary">
                  <Brain size={22} />
                </div>
                <div className="text-left">
                  <div className="font-headline-md text-headline-md text-on-surface">
                    Zero
                  </div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant">
                    Pattern Memorization
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Each section fades up as it scrolls into view (see .reveal). */}
        <div className="reveal">
          <LearningPathSection courses={courses} />
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
