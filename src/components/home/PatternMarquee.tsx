import Link from "@/components/Link";
import TopicIcon from "@/components/home/TopicIcons";

/** Interview patterns taught on the site, each linked to the course that teaches it. */
const PATTERNS: { name: string; course: string }[] = [
  { name: "Two pointers", course: "arrays" },
  { name: "Sliding window", course: "strings" },
  { name: "Hash map lookup", course: "hash-table" },
  { name: "Fast and slow pointers", course: "singly-linked-list" },
  { name: "Monotonic stack", course: "stack" },
  { name: "Binary search", course: "searching" },
  { name: "Tree traversals", course: "binary-tree" },
  { name: "Top K with a heap", course: "heap" },
  { name: "Breadth-first search", course: "graph" },
  { name: "Backtracking", course: "recursion" },
  { name: "Merge sort", course: "sorting" },
  { name: "Memoization", course: "dynamic-programming" },
];

/**
 * One calm row of the interview patterns the site teaches, drifting slowly
 * under the hero. The list is drawn twice so the loop is seamless (the copy is
 * hidden from screen readers and keyboard focus). Hovering pauses it; with
 * reduced motion it sits still and scrolls sideways by hand.
 */
export default function PatternMarquee() {
  return (
    <section aria-label="Patterns you'll master" className="w-full pb-space-2xl pt-space-sm">
      <p className="mb-space-base text-center font-code-sm text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
        Patterns you&rsquo;ll master
      </p>
      <div className="pattern-marquee mx-auto max-w-7xl">
        <div className="pattern-marquee-row flex w-max gap-space-sm">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 gap-space-sm" aria-hidden={copy === 1 || undefined}>
              {PATTERNS.map((p) => (
                <li key={p.name}>
                  <Link
                    href={`/dsa/${p.course}`}
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="group inline-flex h-[38px] items-center gap-space-sm whitespace-nowrap rounded-full border border-outline-variant/50 bg-surface-container-lowest/70 pl-2.5 pr-space-base text-[13.5px] font-medium text-on-surface-variant transition-colors duration-200 hover:border-primary/35 hover:text-on-surface"
                  >
                    <span className="opacity-80 transition-opacity duration-200 group-hover:opacity-100">
                      <TopicIcon slug={p.course} size={18} />
                    </span>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
