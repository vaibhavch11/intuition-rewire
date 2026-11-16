import Link from "@/components/Link";
import { ArrowRight, Check, Lock } from "lucide-react";
import type { LessonPreview } from "@/lib/dsa/preview";

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

const PERKS = ["Every lesson in every course", "Step-by-step dry runs and simulators", "Progress saved across devices"];

/**
 * Where a locked lesson's public opening ends: what the rest holds, and a
 * free account to read it. `.lesson-locked` is the gated part named in the
 * lesson's structured data.
 */
export default function LessonGate({
  path,
  rest,
}: {
  path: string;
  rest: LessonPreview["rest"] | null;
}) {
  const next = encodeURIComponent(path);
  const parts = rest
    ? [
        rest.sections.length > 0 ? plural(rest.sections.length, "more section") : null,
        rest.drawings > 0 ? plural(rest.drawings, "drawing") : null,
        rest.simulators > 0 ? (rest.simulators === 1 ? "a dry-run simulator" : `${rest.simulators} dry-run simulators`) : null,
        rest.languages === 4
          ? "code in JavaScript, Python, Java and C++"
          : rest.languages > 0
            ? `code in ${plural(rest.languages, "language")}`
            : null,
      ].filter((p): p is string => p !== null)
    : [];
  const holds = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  const sections = rest?.sections.slice(0, 6) ?? [];

  return (
    <>
      {/* The opening fades out into the prompt. */}
      <div aria-hidden className="pointer-events-none relative -mt-space-2xl h-space-2xl bg-gradient-to-b from-transparent to-surface" />

      <section className="lesson-locked relative mt-space-lg overflow-hidden rounded-2xl bg-gradient-to-b from-primary/40 via-outline-variant/70 to-outline-variant/30 p-px shadow-[0_2px_6px_rgba(19,27,46,0.05),0_32px_70px_-40px_rgba(53,37,205,0.55)]">
        <div className="relative overflow-hidden rounded-[15px] bg-surface-container-lowest">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40"
            style={{
              background:
                "radial-gradient(70% 100% at 50% 0%, color-mix(in oklab, var(--color-primary-fixed-dim) 45%, transparent), transparent 75%)",
            }}
          />

          <div className="relative grid gap-space-xl p-space-lg sm:p-space-xl md:grid-cols-[1.15fr_1fr]">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary shadow-[0_10px_24px_-10px_rgba(53,37,205,0.7)]">
                <Lock size={20} aria-hidden />
              </span>
              <p className="mt-space-md font-label-tag text-label-tag uppercase tracking-[0.14em] text-primary">
                Members only · free account
              </p>
              <h2 className="mt-space-xs font-headline-md text-headline-md text-on-surface">
                Sign in to keep reading
              </h2>
              <p className="mt-space-sm max-w-prose font-body-md text-body-md text-on-surface-variant">
                {holds
                  ? `The rest of this lesson, with ${holds}, opens with a free account.`
                  : "This lesson opens with a free account. It takes a few seconds."}
              </p>

              <ul className="mt-space-md space-y-space-xs">
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <Check size={12} strokeWidth={3} aria-hidden />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-space-lg flex flex-wrap gap-space-sm">
                <Link
                  href={`/signup?next=${next}`}
                  className="inline-flex h-11 items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-lg font-label-md text-[15px] font-semibold text-on-primary shadow-sm shadow-primary/30 transition-all hover:bg-primary hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Sign up free
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  href={`/login?next=${next}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl px-space-lg font-label-md text-[15px] font-semibold text-on-surface ring-1 ring-inset ring-outline-variant transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  I have an account
                </Link>
              </div>
              <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant">
                Not ready yet? The{" "}
                <Link href="/dsa/arrays" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                  Arrays course
                </Link>{" "}
                is free to read, no account needed.
              </p>
            </div>

            {sections.length > 0 && (
              <div className="self-start rounded-xl bg-surface-container-low p-space-md ring-1 ring-inset ring-outline-variant/50">
                <p className="font-label-md text-label-md font-semibold text-on-surface">In the rest of this lesson</p>
                <ol className="mt-space-sm space-y-space-xs">
                  {sections.map((section, i) => (
                    <li key={section} className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-container-lowest font-label-md text-[11px] font-semibold text-on-surface-variant ring-1 ring-inset ring-outline-variant/60">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{section}</span>
                      <Lock size={12} aria-hidden className="shrink-0 text-on-surface-variant/60" />
                    </li>
                  ))}
                  {rest && rest.sections.length > sections.length && (
                    <li className="pl-[32px] font-body-sm text-body-sm text-on-surface-variant/80">
                      and {rest.sections.length - sections.length} more
                    </li>
                  )}
                </ol>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
