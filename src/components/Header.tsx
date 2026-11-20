"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Route, Search } from "lucide-react";
import HashLink from "@/components/HashLink";
import SearchPalette, { OPEN_SEARCH_EVENT } from "@/components/SearchPalette";
import UserMenu from "@/components/auth/UserMenu";
import { useUser } from "@/lib/auth/useUser";
import LogoMark, { Wordmark } from "@/components/LogoMark";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/#learning-path", label: "Roadmap" },
  { href: "/pricing", label: "Pricing" },
];

const LEARNING_PATH = "/#learning-path";

/** Page sections that light up their own nav link while you're reading them. */
const SPIED_SECTIONS = ["learning-path"];

/**
 * Which spied sections cross a thin band near the top of the screen — where
 * a section sits once you have scrolled (or jumped) to it.
 * Scoped to the path it was measured on, so a new page never inherits the
 * last page's answer.
 */
function useSectionsInView(pathname: string): Set<string> {
  const [seen, setSeen] = useState<{ path: string; ids: string[] }>({ path: "", ids: [] });

  useEffect(() => {
    const visible = new Set<string>();
    let observer: IntersectionObserver | undefined;
    // Wait a frame so the new page's sections are in the DOM.
    const timer = window.setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          setSeen({ path: pathname, ids: [...visible] });
        },
        { rootMargin: "-20% 0px -75% 0px" }
      );
      for (const id of SPIED_SECTIONS) {
        const element = document.getElementById(id);
        if (element) observer.observe(element);
      }
    }, 60);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);

  return new Set(seen.path === pathname ? seen.ids : []);
}

function activeHref(pathname: string, inView: Set<string>): string | null {
  if (pathname === "/") {
    return inView.has("learning-path") ? "/#learning-path" : "/";
  }
  if (pathname === "/dsa" || pathname.startsWith("/dsa/")) return "/dsa";
  if (pathname.startsWith("/pricing")) return "/pricing";
  return null;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = activeHref(pathname, useSectionsInView(pathname));
  // The site's sections are for members: signed-out visitors see the logo,
  // search and the sign-in buttons, and the links arrive with an account.
  const user = useUser();
  const signedIn = Boolean(user);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    // No frosted-glass blur below lg: re-blurring the page under a fixed bar on
    // every scroll frame is what makes phones stutter. A near-solid bar looks the same.
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/[0.97] shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:bg-surface-container-lowest/90 lg:backdrop-blur-xl">
      <div className="h-14 max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-sm sm:gap-space-lg">
        <div className="flex items-center gap-space-lg shrink-0">
          <Link href="/" className="flex items-center gap-space-sm">
            <LogoMark className="h-7 w-auto min-[400px]:h-8" />
            <span className="whitespace-nowrap font-headline-md text-[17px] leading-[26px] text-on-surface tracking-tight font-semibold min-[400px]:text-[18px] sm:text-headline-md">
              <Wordmark />
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-space-md">
          {signedIn && (
          <nav className="hidden lg:flex shrink-0 items-center gap-space-xs motion-safe:animate-fade-in">
            {NAV_LINKS.map((link) => {
              const active = link.href === current;
              return (
                <HashLink
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-lg px-space-md py-space-xs font-label-md text-label-md transition-colors duration-200 ${
                    active
                      ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  {link.label}
                </HashLink>
              );
            })}
          </nav>
          )}

          <SearchPalette />

          <div className="flex shrink-0 items-center gap-space-sm pl-space-xs">
            <ThemeToggle className="hidden sm:inline-flex" />
            {/* Same destination as the "Roadmap" link, so only shown when there's room. */}
            {signedIn && (
            <HashLink
              href={LEARNING_PATH}
              className={`hidden xl:inline-flex items-center gap-space-xs h-9 whitespace-nowrap rounded-lg px-space-md font-label-md text-label-md font-semibold text-primary transition-colors ${
                current === LEARNING_PATH
                  ? "bg-primary-fixed ring-1 ring-inset ring-primary/40"
                  : "bg-primary-fixed/60 hover:bg-primary-fixed"
              }`}
            >
              <Route size={16} aria-hidden />
              Learning Path
            </HashLink>
            )}
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
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
              }}
              style={{ transitionDelay: open ? "40ms" : "0ms" }}
              className={`flex items-center gap-space-sm rounded-lg bg-surface-container-low px-space-sm py-space-sm text-left font-label-md text-label-md text-on-surface-variant transition-all duration-300 ease-out motion-reduce:transition-none ${
                open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
              }`}
            >
              <Search size={16} />
              Search lessons…
            </button>
            <ThemeToggle
              variant="row"
              className={`transition-all duration-300 ease-out motion-reduce:transition-none ${
                open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
              }`}
            />
            {/* Narrow phones hide the bar's "Sign in" to keep it uncrowded, so it lives here instead. */}
            {user === null && (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? "120ms" : "0ms" }}
                className={`rounded-lg px-space-sm py-space-sm font-label-md text-label-md font-semibold text-on-surface ring-1 ring-inset ring-outline-variant transition-all duration-300 ease-out motion-reduce:transition-none min-[400px]:hidden ${
                  open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                }`}
              >
                Sign in
              </Link>
            )}
            {signedIn && [...NAV_LINKS, { href: LEARNING_PATH, label: "Learning Path" }].map(
              (link, i) => {
                const isCta = i === NAV_LINKS.length;
                const active = !isCta && link.href === current;
                return (
                  <HashLink
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                    className={`transition-all duration-300 ease-out motion-reduce:transition-none ${
                      open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                    } ${
                      isCta
                        ? "rounded-lg bg-primary-container text-on-primary px-space-md py-space-sm text-center font-label-md text-label-md mt-space-xs"
                        : active
                          ? "rounded-lg bg-primary-fixed/60 px-space-sm py-space-xs font-label-md text-label-md font-semibold text-primary"
                          : "px-space-sm py-space-xs font-label-md text-label-md text-on-surface-variant"
                    }`}
                  >
                    {link.label}
                  </HashLink>
                );
              }
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
