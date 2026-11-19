import { Clock, MemoryStick } from "lucide-react";
import type { ComplexityRow } from "@/lib/dsa/types";
import RichText from "./RichText";

function Cost({
  icon: Icon,
  label,
  value,
  why,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  why: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-space-sm">
        <span className="inline-flex items-center gap-[6px] font-label-md text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          <Icon size={14} aria-hidden className="text-primary" />
          {label}
        </span>
        <code className="rounded-md bg-primary-fixed px-space-sm py-[2px] font-code-md text-[14px] font-semibold text-on-primary-fixed ring-1 ring-inset ring-primary/20">
          {value}
        </code>
      </div>
      <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
        <RichText text={why} />
      </p>
    </div>
  );
}

/**
 * Each approach's time and space, each with the one-line reason it costs
 * that much, so the numbers are understood rather than memorised.
 */
export default function ComplexityCard({ rows }: { rows: ComplexityRow[] }) {
  return (
    <div className="my-space-lg overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary-fixed/30 to-surface-container-lowest shadow-[0_18px_40px_-34px_rgba(53,37,205,0.6)]">
      <ol className="divide-y divide-outline-variant/50">
        {rows.map((row, i) => (
          <li key={i} className="px-space-md py-space-md sm:px-space-lg">
            <h3 className="flex items-center gap-space-sm font-headline-md text-[17px] leading-6 text-on-surface">
              {rows.length > 1 && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-md text-[12px] font-semibold text-on-primary">
                  {i + 1}
                </span>
              )}
              <RichText text={row.approach} />
            </h3>
            <div className="mt-space-sm grid gap-space-md sm:grid-cols-2 sm:gap-space-lg">
              <Cost icon={Clock} label="Time" value={row.time} why={row.timeWhy} />
              <Cost icon={MemoryStick} label="Space" value={row.space} why={row.spaceWhy} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
