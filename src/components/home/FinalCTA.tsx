import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="max-w-7xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-2xl">
      <div className="relative isolate overflow-hidden rounded-3xl bg-inverse-surface px-space-lg py-space-2xl text-center shadow-[0_32px_64px_-32px_rgba(19,27,46,0.55)] sm:px-space-2xl lg:py-[72px]">
        {/* Indigo glow from the top and a faint grid, both behind the copy. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(60% 75% at 50% 0%, rgba(79,70,229,0.55), rgba(79,70,229,0) 70%), radial-gradient(40% 50% at 85% 100%, rgba(78,222,163,0.16), rgba(78,222,163,0) 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(70% 70% at 50% 35%, black, transparent)",
            WebkitMaskImage: "radial-gradient(70% 70% at 50% 35%, black, transparent)",
          }}
        />

        <h2 className="mx-auto max-w-3xl font-headline-xl text-headline-xl-mobile tracking-tight text-inverse-on-surface lg:text-headline-xl">
          Ready to Rewire Your Mental Models?
        </h2>
        <p className="mx-auto mt-space-md max-w-xl font-body-lg text-body-lg text-inverse-on-surface/75">
          Join thousands of software engineers learning DSA the right way. Start exploring interactive visual
          modules without memorization.
        </p>
        <div className="mt-space-xl flex flex-col items-stretch justify-center gap-space-sm sm:flex-row sm:items-center sm:gap-space-md">
          <Link
            href="/dsa"
            className="group inline-flex h-12 items-center justify-center gap-space-sm rounded-xl bg-inverse-on-surface px-space-lg font-label-md text-[15px] font-semibold text-inverse-surface shadow-lg transition-all duration-200 hover:-translate-y-px hover:bg-white"
          >
            Get Started Free
            <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/dsa"
            className="inline-flex h-12 items-center justify-center rounded-xl px-space-lg font-label-md text-[15px] font-semibold text-inverse-on-surface ring-1 ring-inset ring-inverse-on-surface/25 transition-colors duration-200 hover:bg-inverse-on-surface/10"
          >
            View Curriculum Specs
          </Link>
        </div>
      </div>
    </section>
  );
}
