"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#learning-path", label: "Roadmap" },
  { href: "/dsa", label: "Visualizer & Lessons" },
  { href: "/#dry-run-demo", label: "Dry-Run Engine" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-14 max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-lg">
        <div className="flex items-center gap-space-lg shrink-0">
          <Link href="/" className="flex items-center gap-space-sm">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary text-base">
              ⌁
            </span>
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              Intuition Rewire
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-space-xs">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "px-space-md py-space-xs transition-colors bg-primary-container text-on-primary font-semibold rounded-lg"
                      : "px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-space-md justify-end flex-1 max-w-md">
          <div className="relative w-full max-w-[220px] hidden xl:block">
            <div className="flex items-center justify-between w-full h-8 px-space-md bg-surface-container-low rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-space-xs text-on-surface-variant">
                <Search size={16} />
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  Search syntax...
                </span>
              </div>
              <kbd className="font-label-tag text-label-tag px-space-2xs py-0.5 bg-surface-container-highest text-on-surface-variant rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-space-sm pl-space-xs">
            <Link
              href="/#learning-path"
              className="hidden lg:inline-flex items-center h-8 px-space-md font-label-md text-label-md bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary hover:text-on-secondary transition-colors"
            >
              Learning Path
            </Link>
            <div className="relative flex items-center">
              <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center text-xs font-semibold">
                IR
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest" />
            </div>
          </div>
        </div>

        <button
          className="lg:hidden p-2 -mr-2 text-on-surface"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block w-5 h-0.5 bg-current mb-1.5" />
          <span className="block w-5 h-0.5 bg-current mb-1.5" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-outline-variant px-gutter-mobile lg:px-gutter-desktop py-space-md flex flex-col gap-space-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-label-md text-label-md text-on-surface-variant py-space-xs"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#learning-path"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-primary-container text-on-primary px-space-md py-space-sm text-center font-label-md text-label-md mt-space-xs"
          >
            Learning Path
          </Link>
        </nav>
      )}
    </header>
  );
}
