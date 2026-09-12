import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl w-full">
      <div className="rounded-2xl bg-gradient-to-r from-primary-container via-primary to-surface-tint p-space-xl lg:p-space-2xl text-center text-on-primary shadow-lg relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="font-headline-xl text-headline-xl text-on-primary font-bold">
            Ready to Rewire Your Mental Models?
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary-container mt-space-sm mb-space-xl">
            Join thousands of software engineers learning DSA the right way. Start
            exploring interactive visual modules without memorization.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-space-md">
            <Link
              href="/dsa"
              className="h-12 px-space-xl inline-flex items-center justify-center font-label-md text-label-md bg-surface-container-lowest text-on-surface rounded-lg shadow-md hover:bg-surface-container-low transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/dsa"
              className="h-12 px-space-xl inline-flex items-center justify-center font-label-md text-label-md text-on-primary bg-primary/40 hover:bg-primary/60 rounded-lg transition-all"
            >
              View Curriculum Specs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
