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

const OLD_WAY: { icon: LucideIcon; title: string; body: ReactNode }[] = [
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

const NEW_WAY: { icon: LucideIcon; title: string; body: ReactNode }[] = [
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

export default function ComparisonSection() {
  return (
    <section className="w-full bg-surface-container-lowest py-space-2xl">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="text-center max-w-3xl mx-auto mb-space-xl">
          <span className="font-label-tag text-label-tag text-primary uppercase">
            The Paradigmatic Shift
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
            Why Standard DSA Prep Fails You
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
            Memorizing patterns leads to panic when an interviewer tweaks one
            parameter. Physical memory models make the solution inevitable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          <div className="p-space-xl rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-space-sm mb-space-md">
                <span className="w-8 h-8 rounded-full bg-error-container/50 flex items-center justify-center text-error">
                  <X size={18} />
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  The Standard Grind
                </h3>
              </div>
              <ul className="space-y-space-md text-on-surface-variant font-body-md text-body-md">
                {OLD_WAY.map((item) => (
                  <li key={item.title} className="flex items-start gap-space-sm">
                    <item.icon size={20} className="text-error shrink-0 mt-0.5" />
                    <span>
                      <strong>{item.title}:</strong> {item.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-space-lg pt-space-md border-t border-surface-container-high text-on-surface-variant font-code-sm text-code-sm">
              Outcome: High interview anxiety &amp; brittle code
            </div>
          </div>

          <div className="p-space-xl rounded-2xl bg-primary-container text-on-primary shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary-fixed-dim/20 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-space-sm mb-space-md">
                <span className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                  <Check size={18} />
                </span>
                <h3 className="font-headline-md text-headline-md text-on-primary">
                  Intuition Rewire
                </h3>
              </div>
              <ul className="space-y-space-md text-on-primary-container font-body-md text-body-md">
                {NEW_WAY.map((item) => (
                  <li key={item.title} className="flex items-start gap-space-sm">
                    <item.icon size={20} className="text-secondary-fixed shrink-0 mt-0.5" />
                    <span>
                      <strong>{item.title}:</strong> {item.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-space-lg pt-space-md border-t border-on-primary-container/20 text-on-primary-container font-code-sm text-code-sm">
              Outcome: Flawless structural interviews &amp; principal engineer instincts
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
