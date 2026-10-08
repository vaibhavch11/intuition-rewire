import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";

/** Where this page sits — Home › Courses › Queue › … — plus the same trail as BreadcrumbList data. */
export default function Breadcrumbs({ crumbs, className = "" }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-space-xs gap-y-1 font-label-md text-label-md text-on-surface-variant">
        {crumbs.map((crumb, i) =>
          i === crumbs.length - 1 ? (
            <li key={crumb.path} className="min-w-0 max-w-full">
              <span aria-current="page" className="block truncate text-on-surface">
                {crumb.name}
              </span>
            </li>
          ) : (
            <li key={crumb.path} className="flex items-center gap-x-space-xs">
              <Link href={crumb.path} className="hover:text-primary">
                {crumb.name}
              </Link>
              <ChevronRight size={14} aria-hidden className="shrink-0 opacity-60" />
            </li>
          )
        )}
      </ol>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </nav>
  );
}
