const REVIEWS = [
  {
    initials: "AK",
    badge: "bg-primary-container text-on-primary",
    quote:
      "I struggled with tree recursion for four years until I saw Intuition Rewire's call-stack frame simulation. Passed my Google L5 interview three weeks later.",
    name: "Alexandre K.",
    role: "Senior SRE, Datadog",
  },
  {
    initials: "MR",
    badge: "bg-secondary text-on-secondary",
    quote:
      "Connecting hardware memory layout to algorithm complexity completely flipped how I approach system design and code interviews. Essential curriculum.",
    name: "Maya R.",
    role: "Staff Systems Engineer, Meta",
  },
  {
    initials: "SL",
    badge: "bg-tertiary-container text-on-tertiary",
    quote:
      "The step-by-step visual dry-run engine makes graph cycle detection and dynamic programming states feel as tangible as legos. Simply incomparable.",
    name: "Siddharth L.",
    role: "Principal Architect, Stripe",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full bg-surface-container-low py-space-2xl">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="text-center max-w-2xl mx-auto mb-space-xl">
          <span className="font-label-tag text-label-tag text-primary uppercase">
            Staff &amp; Senior Engineers
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
            Built for Engineers Who Demand Real Understanding
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between"
            >
              <p className="font-body-md text-body-md text-on-surface-variant italic mb-space-md">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="flex items-center gap-space-sm pt-space-sm border-t border-surface-container-low">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs ${r.badge}`}
                >
                  {r.initials}
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold">
                    {r.name}
                  </div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant">
                    {r.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
