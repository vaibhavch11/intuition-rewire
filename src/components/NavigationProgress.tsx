"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "idle" | "loading" | "done" | "fading";

/**
 * A thin bar along the top of the window from the moment an internal link is
 * clicked until the new page is in place, so a click never looks ignored while
 * the next page is fetched and rendered.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [from, setFrom] = useState(pathname);

  // The new page is in place: finish the bar, then hide it.
  if (pathname !== from) {
    setFrom(pathname);
    if (phase === "loading") setPhase("done");
  }

  // Fill to the end, fade out at full width, then reset out of sight.
  useEffect(() => {
    if (phase !== "done" && phase !== "fading") return;
    const t = setTimeout(() => setPhase(phase === "done" ? "fading" : "idle"), phase === "done" ? 200 : 300);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    // If the page never changes (an error, a cancelled click), don't spin forever.
    const t = setTimeout(() => setPhase("idle"), 15000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Same page (or just a #section on it): nothing loads.
      if (url.pathname === location.pathname) return;
      setPhase("loading");
    };
    // Capture phase: next/link calls preventDefault on its clicks, so a bubbling
    // listener would see every in-app navigation as already handled.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ opacity: phase === "idle" || phase === "fading" ? 0 : 1, transition: phase === "fading" ? "opacity 300ms ease" : "none" }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(53,37,205,0.6)]"
        style={{
          width: phase === "idle" ? "0%" : phase === "loading" ? "85%" : "100%",
          // Races to 85% and waits there; jumps to the end when the page arrives.
          transition: phase === "loading" ? "width 2.5s cubic-bezier(0.1, 0.7, 0.2, 1)" : phase === "done" ? "width 200ms ease" : "none",
        }}
      />
    </div>
  );
}
