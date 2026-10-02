import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** The eyebrow, title and lead that open every homepage section. */
export default function SectionHeader({
  eyebrow,
  icon: Icon,
  title,
  lead,
  align = "center",
}: {
  eyebrow: string;
  icon?: LucideIcon;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-xl"}>
      <span className="inline-flex items-center gap-space-xs rounded-full border border-primary/15 bg-primary-fixed/50 px-space-md py-1 font-label-tag text-label-tag uppercase tracking-wider text-primary">
        {Icon && <Icon size={14} aria-hidden />}
        {eyebrow}
      </span>
      <h2 className="mt-space-md font-headline-xl text-headline-xl-mobile tracking-tight text-on-surface lg:text-headline-xl">
        {title}
      </h2>
      {lead && (
        <p className="mt-space-md font-body-lg text-body-lg text-on-surface-variant">{lead}</p>
      )}
    </div>
  );
}
