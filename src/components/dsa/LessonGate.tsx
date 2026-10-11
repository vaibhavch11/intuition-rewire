import Link from "@/components/Link";
import { Lock } from "lucide-react";
import type { LessonPreview } from "@/lib/dsa/preview";

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/**
 * Ends a lesson's public opening: what the rest holds, and a free sign-up.
 * `.lesson-locked` is the gated part named in the lesson's structured data.
 */
export default function LessonGate({ path, rest }: { path: string; rest: LessonPreview["rest"] }) {
  const next = encodeURIComponent(path);
  const parts = [
    rest.sections.length > 0 ? plural(rest.sections.length, "more section") : null,
    rest.drawings > 0 ? plural(rest.drawings, "drawing") : null,
    rest.simulators > 0 ? (rest.simulators === 1 ? "a dry-run simulator" : `${rest.simulators} dry-run simulators`) : null,
    rest.languages === 4
      ? "code in JavaScript, Python, Java and C++"
      : rest.languages > 0
        ? `code in ${plural(rest.languages, "language")}`
        : null,
  ].filter((p): p is string => p !== null);
  const holds = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];

  return (
    <>
      {/* The opening fades out into the prompt. */}
      <div aria-hidden className="pointer-events-none relative -mt-space-2xl h-space-2xl bg-gradient-to-b from-transparent to-surface" />
      <section className="lesson-locked rounded-2xl border border-primary/25 bg-surface-container-lowest p-space-lg shadow-[0_24px_60px_-36px_rgba(53,37,205,0.55)]">
        <div className="flex items-center gap-space-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary">
            <Lock size={18} aria-hidden />
          </span>
          <p className="font-label-tag text-label-tag uppercase tracking-wide text-primary">Free account</p>
        </div>
        <h2 className="mt-space-md font-headline-md text-headline-md text-on-surface">Keep reading. It&apos;s free.</h2>
        <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
          Sign up to read the rest of this lesson{holds ? `: ${holds}.` : "."}
        </p>
        {rest.sections.length > 0 && (
          <div className="mt-space-md rounded-xl bg-surface-container-low px-space-md py-space-sm">
            <p className="font-label-md text-label-md text-on-surface-variant">Still to come</p>
            <ul className="mt-space-xs space-y-1 font-body-sm text-body-sm text-on-surface">
              {rest.sections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-space-lg flex flex-wrap gap-space-sm">
          <Link
            href={`/signup?next=${next}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-container px-space-lg font-label-md text-[15px] font-semibold text-on-primary transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Sign up free
          </Link>
          <Link
            href={`/login?next=${next}`}
            className="inline-flex h-11 items-center justify-center rounded-xl px-space-lg font-label-md text-[15px] font-semibold text-on-surface ring-1 ring-inset ring-outline-variant transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Sign in
          </Link>
        </div>
      </section>
    </>
  );
}
