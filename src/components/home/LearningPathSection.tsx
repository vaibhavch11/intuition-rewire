import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "@/components/Link";
import type { CourseSummary } from "@/lib/dsa/types";
import { buildPath } from "@/lib/dsa/path";

type Track = {
  id: string;
  title: string;
  points: string[];
  tint: string;
  art: ReactNode;
  /** Where the card goes; tracks without one are still being built. */
  href?: string;
};

const TRACKS: Track[] = [
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    points: ["Hand-drawn lessons", "Dry runs in 4 languages", "The patterns interviews ask"],
    tint: "#ecebff",
    href: "/dsa",
    art: (
      <svg viewBox="0 0 120 70" className="h-full w-full" aria-hidden>
        <g fill="#fff" stroke="#534AB7" strokeWidth="1.5">
          <rect x="12" y="14" width="14" height="14" rx="2" />
          <rect x="26" y="14" width="14" height="14" rx="2" />
          <rect x="40" y="14" width="14" height="14" rx="2" fill="#CECBF6" />
        </g>
        <path d="M16 46 Q32 36 48 50" fill="none" stroke="#7F77DD" strokeWidth="1.5" strokeDasharray="3 3" />
        <g stroke="#534AB7" strokeWidth="1.3">
          <line x1="90" y1="16" x2="76" y2="38" />
          <line x1="90" y1="16" x2="104" y2="38" />
          <line x1="76" y1="38" x2="68" y2="58" />
        </g>
        <g fill="#fff" stroke="#534AB7" strokeWidth="1.5">
          <circle cx="90" cy="16" r="6" />
          <circle cx="76" cy="38" r="6" fill="#CECBF6" />
          <circle cx="104" cy="38" r="6" />
          <circle cx="68" cy="58" r="5" />
        </g>
      </svg>
    ),
  },
  {
    id: "system-design",
    title: "System Design",
    points: ["Scaling from one server up", "Real case studies", "Senior interview prep"],
    tint: "#e3f5ee",
    art: (
      <svg viewBox="0 0 120 70" className="h-full w-full" aria-hidden>
        <g stroke="#0F6E56" strokeWidth="1.2">
          <line x1="60" y1="20" x2="25" y2="40" />
          <line x1="60" y1="20" x2="60" y2="40" />
          <line x1="60" y1="20" x2="95" y2="40" />
        </g>
        <g fill="#fff" stroke="#0F6E56" strokeWidth="1.5">
          <rect x="48" y="8" width="24" height="12" rx="3" />
          <rect x="14" y="40" width="22" height="16" rx="3" />
          <rect x="49" y="40" width="22" height="16" rx="3" />
          <rect x="84" y="40" width="22" height="16" rx="3" />
        </g>
      </svg>
    ),
  },
  {
    id: "ai-engineering",
    title: "AI Engineering",
    points: ["LLM apps end to end", "Retrieval and agents", "Evals that matter"],
    tint: "#fbf0dc",
    art: (
      <svg viewBox="0 0 120 70" className="h-full w-full" aria-hidden>
        <g stroke="#854F0B" strokeWidth="1">
          <line x1="25" y1="18" x2="60" y2="35" />
          <line x1="25" y1="52" x2="60" y2="35" />
          <line x1="60" y1="35" x2="95" y2="18" />
          <line x1="60" y1="35" x2="95" y2="52" />
        </g>
        <g fill="#fff" stroke="#854F0B" strokeWidth="1.5">
          <circle cx="25" cy="18" r="5" />
          <circle cx="25" cy="52" r="5" />
          <circle cx="60" cy="35" r="7" fill="#FAC775" />
          <circle cx="95" cy="18" r="5" />
          <circle cx="95" cy="52" r="5" />
        </g>
      </svg>
    ),
  },
  {
    id: "devops",
    title: "DevOps & AI Infrastructure",
    points: ["Containers to clusters", "GPUs and model serving", "CI/CD and monitoring"],
    tint: "#e6f0fb",
    art: (
      <svg viewBox="0 0 120 70" className="h-full w-full" aria-hidden>
        <g fill="#fff" stroke="#185FA5" strokeWidth="1.5">
          <rect x="14" y="14" width="26" height="18" rx="3" />
          <rect x="14" y="38" width="26" height="18" rx="3" />
          <rect x="47" y="14" width="26" height="18" rx="3" />
          <rect x="47" y="38" width="26" height="18" rx="3" fill="#B5D4F4" />
          <rect x="80" y="14" width="26" height="42" rx="3" />
        </g>
        <g stroke="#185FA5" strokeWidth="1.2">
          <line x1="86" y1="24" x2="100" y2="24" />
          <line x1="86" y1="32" x2="100" y2="32" />
          <line x1="86" y1="40" x2="100" y2="40" />
        </g>
      </svg>
    ),
  },
];

function CardBody({ track, live, meta }: { track: Track; live: boolean; meta: string }) {
  return (
    <>
      <span
        className={`relative block h-[72px] overflow-hidden rounded-xl sm:h-[104px] ${live ? "" : "opacity-75 saturate-[0.45]"}`}
        style={{ background: track.tint }}
      >
        {track.art}
        <span
          className={`absolute right-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${
            live ? "text-[#0F6E56]" : "text-[#5f5e5a]"
          }`}
        >
          {live ? "● Live" : "Coming soon"}
        </span>
      </span>
      <span className="mt-2.5 block text-[14px] font-bold leading-snug tracking-tight text-on-surface sm:text-[16px]">{track.title}</span>
      <span className="mt-1.5 hidden flex-col gap-0.5 text-[13px] leading-snug text-on-surface-variant sm:flex">
        {track.points.map((p) => (
          <span key={p}>+ {p}</span>
        ))}
      </span>
      <span className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="font-code-sm text-[10.5px] uppercase tracking-[0.08em] text-on-surface-variant sm:text-[11px]">{meta}</span>
        {live && <ArrowRight size={16} aria-hidden className="shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />}
      </span>
    </>
  );
}

/**
 * "Pick your path": one card per track. Data Structures & Algorithms is live
 * and opens its curriculum at /dsa; the others are still being built.
 */
export default function LearningPathSection({ courses }: { courses: CourseSummary[] }) {
  const path = buildPath(courses);
  const courseCount = path.reduce((n, s) => n + s.rows.length, 0);
  const lessonCount = path.reduce((n, s) => n + s.rows.reduce((m, r) => m + r.course.lessons, 0), 0);

  return (
    <section className="home-band w-full py-space-2xl" id="learning-path">
      <div className="mx-auto max-w-7xl px-gutter-mobile lg:px-gutter-desktop">
        <p className="font-code-sm text-[11px] uppercase tracking-[0.18em] text-primary">Pick your path</p>
        <h2 className="mt-space-sm text-[28px] font-bold leading-tight tracking-tight text-on-surface sm:text-[36px]">
          Choose where to <span className="text-primary-container">start</span>
        </h2>
        <p className="mt-space-sm max-w-2xl text-[16px] leading-relaxed text-on-surface-variant">
          One track is live today and more are on the way. Every track runs in order, from your first lesson to interview-ready.
        </p>

        <div className="mt-space-xl grid grid-cols-2 gap-space-sm sm:gap-space-md lg:grid-cols-4">
          {TRACKS.map((track) =>
            track.href ? (
              <Link
                key={track.id}
                href={track.href}
                className="group flex flex-col rounded-2xl border border-primary/40 bg-surface-container-lowest p-2.5 shadow-[0_14px_30px_-20px_rgba(53,37,205,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 sm:p-3"
              >
                <CardBody track={track} live meta={`${courseCount} courses · ${Math.floor(lessonCount / 10) * 10}+ lessons`} />
              </Link>
            ) : (
              <div
                key={track.id}
                aria-label={`${track.title}, coming soon`}
                className="flex cursor-default flex-col rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-2.5 sm:p-3"
              >
                <CardBody track={track} live={false} meta="Coming soon" />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
