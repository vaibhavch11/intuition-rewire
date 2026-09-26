"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#learning-path", label: "Roadmap" },
  { href: "/dsa", label: "Visualizer & Lessons" },
  { href: "/dsa/arrays#dry-run-engine", label: "Dry-Run Engine" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-14 max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-lg">
        <div className="flex items-center gap-space-lg shrink-0">
          <Link href="/" className="flex items-center gap-space-sm">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary text-base">
              ⌁
            </span>
            <span className="whitespace-nowrap font-headline-md text-[18px] leading-[26px] text-on-surface tracking-tight font-semibold sm:text-headline-md">
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
                      ? "whitespace-nowrap px-space-md py-space-xs transition-colors bg-primary-container text-on-primary font-semibold rounded-lg"
                      : "whitespace-nowrap px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-space-md">
          <div className="relative w-full min-w-0 max-w-[220px] hidden xl:block">
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

          <div className="flex shrink-0 items-center gap-space-sm pl-space-xs">
            {/* Same destination as the "Roadmap" link, so only shown when there's room. */}
            <Link
              href="/#learning-path"
              className="hidden xl:inline-flex items-center h-9 whitespace-nowrap px-space-md font-label-md text-label-md font-semibold bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary hover:text-on-secondary transition-colors"
            >
              Learning Path
            </Link>
            <UserMenu />
          </div>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 -mr-2 text-on-surface"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {/* Three bars that fold into an ✕ while the menu is open. */}
          <span
            className={`block w-5 h-0.5 bg-current mb-1.5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              open ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current mb-1.5 transition-all duration-200 motion-reduce:transition-none ${
              open ? "scale-x-0 opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
              open ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Always rendered so it can slide closed as well as open; `inert`
          keeps the hidden links out of the tab order. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <nav className="overflow-hidden">
          <div className="border-t border-outline-variant px-gutter-mobile py-space-md flex flex-col gap-space-sm">
            {[...NAV_LINKS, { href: "/#learning-path", label: "Learning Path" }].map(
              (link, i) => {
                const isCta = i === NAV_LINKS.length;
                return (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                    className={`transition-all duration-300 ease-out motion-reduce:transition-none ${
                      open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                    } ${
                      isCta
                        ? "rounded-lg bg-primary-container text-on-primary px-space-md py-space-sm text-center font-label-md text-label-md mt-space-xs"
                        : "font-label-md text-label-md text-on-surface-variant py-space-xs"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
