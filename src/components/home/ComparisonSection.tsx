import type { ReactNode } from "react";
import {
  X,
  Check,
  Frown,
  Ban,
  TimerOff,
  Cpu,
  Eye,
  Infinity as InfinityIcon,
  type LucideIcon,
} from "lucide-react";
import SectionHeader from "@/components/home/SectionHeader";

type Point = { icon: LucideIcon; title: string; body: ReactNode };

const OLD_WAY: Point[] = [
  {
    icon: Frown,
    title: "Rote Pattern Matching",
    body: "Memorizing 14 arbitrary templates without understanding hardware implications.",
  },
  {
    icon: Ban,
    title: "Opaque Pointer Bugs",
    body: (
      <>
        Guessing loop invariants (
        <code className="font-code-sm text-code-sm">while l &lt;= r</code> vs{" "}
        <code className="font-code-sm text-code-sm">l &lt; r</code>) by spamming the
        submit button.
      </>
    ),
  },
  {
    icon: TimerOff,
    title: "Fast Decay",
    body: "Forgetting everything 3 weeks after an interview loop concludes.",
  },
];

const NEW_WAY: Point[] = [
  {
    icon: Cpu,
    title: "Cache & RAM Physics",
    body: "Understand L1/L2 cache spatial locality, explaining why contiguous arrays crush node graphs in actual benchmarks.",
  },
  {
    icon: Eye,
    title: "Full Visual Dry-Runs",
    body: "Interactive step-by-step simulations let you observe invariants converge naturally.",
  },
  {
    icon: InfinityIcon,
    title: "Permanent Mental Models",
    body: "Core architectural mental models stay wired in your subconscious indefinitely.",
  },
];

function Column({
  tone,
  label,
  title,
  points,
  outcome,
}: {
  tone: "old" | "new";
  label: string;
  title: string;
  points: Point[];
  outcome: string;
}) {
  const isNew = tone === "new";
  const Badge = isNew ? Check : X;
  return (
    <div
      className={`flex flex-col rounded-3xl p-space-lg sm:p-space-xl ${
        isNew
          ? "bg-surface-container-lowest shadow-[0_28px_56px_-28px_rgba(79,70,229,0.45)] ring-2 ring-primary-container"
          : "bg-surface-container-low ring-1 ring-outline-variant/70"
      }`}
    >
      <div className="flex items-center gap-space-md">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isNew ? "bg-primary-container text-on-primary" : "bg-error-container/70 text-error"
          }`}
        >
          <Badge size={20} strokeWidth={2.4} />
        </span>
        <div>
          <p
            className={`font-label-tag text-label-tag uppercase tracking-wider ${
              isNew ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            {label}
          </p>
          <h3 className="font-headline-md text-headline-md tracking-tight text-on-surface">{title}</h3>
        </div>
      </div>

      <ul className="mt-space-lg flex-1 space-y-space-lg">
        {points.map((point) => (
          <li key={point.title} className="flex gap-space-md">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
                isNew
                  ? "bg-primary-fixed/60 text-primary ring-primary/10"
                  : "bg-surface-container-lowest text-error ring-outline-variant/70"
              }`}
            >
              <point.icon size={18} strokeWidth={1.9} />
            </span>
            <div>
              <p className="font-label-md text-[15px] font-semibold text-on-surface">{point.title}</p>
              <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">{point.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div
        className={`mt-space-xl flex items-start gap-space-sm border-t pt-space-md ${
          isNew ? "border-primary-container/20" : "border-outline-variant/70"
        }`}
      >
        <span className="mt-0.5 shrink-0 font-label-tag text-label-tag uppercase tracking-wider text-on-surface-variant">
          Outcome
        </span>
        <p className={`font-body-md text-body-md font-semibold ${isNew ? "text-primary" : "text-on-surface-variant"}`}>
          {outcome}
        </p>
      </div>
    </div>
  );
}

export default function ComparisonSection() {
  return (
    <section className="w-full py-space-2xl">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <SectionHeader
          eyebrow="The paradigm shift"
          title="Why Standard DSA Prep Fails You"
          lead="Memorizing patterns leads to panic when an interviewer tweaks one parameter. Physical memory models make the solution inevitable."
        />

        <div className="relative mx-auto mt-space-xl grid max-w-6xl gap-space-lg md:grid-cols-2 md:gap-space-xl">
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-lowest font-label-tag text-label-tag uppercase text-on-surface-variant shadow-md ring-1 ring-outline-variant md:flex"
          >
            vs
          </span>
          <Column
            tone="old"
            label="Typical prep"
            title="The Standard Grind"
            points={OLD_WAY}
            outcome="High interview anxiety & brittle code"
          />
          <Column
            tone="new"
            label="With IntuitionRewire"
            title="Intuition Rewire"
            points={NEW_WAY}
            outcome="Flawless structural interviews & principal engineer instincts"
          />
        </div>
      </div>
    </section>
  );
}
