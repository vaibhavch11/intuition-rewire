"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_KEY } from "@/lib/themeScript";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** Whether the page is currently dark. False on the server and during hydration. */
export function useIsDark() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
}

/**
 * Switches the theme and remembers the choice; without a saved choice the site is light.
 *
 * Where the browser supports view transitions, the whole page cross-fades from
 * the old theme to the new one (timing in globals.css), so everything —
 * gradients, shadows, drawings — changes together. Elsewhere the colours fade
 * one by one, and with reduced motion the switch is instant.
 */
function applyTheme(dark: boolean) {
  const root = document.documentElement;
  const commit = () => {
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  };
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commit();
    return;
  }

  if (!document.startViewTransition) {
    root.classList.add("theme-switching");
    commit();
    window.setTimeout(() => root.classList.remove("theme-switching"), 300);
    return;
  }

  // If the browser skips the fade (a hidden tab, say), the theme still switches.
  document.startViewTransition(commit).ready.catch(() => {});
}

/** Sun/moon button for the header, or a labelled row for the phone menu. */
export default function ThemeToggle({ variant = "icon", className = "" }: { variant?: "icon" | "row"; className?: string }) {
  const dark = useIsDark();
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  const icons = (
    <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
      <Sun
        size={17}
        className={`absolute transition-all duration-300 motion-reduce:transition-none ${
          dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        size={17}
        className={`absolute transition-all duration-300 motion-reduce:transition-none ${
          dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </span>
  );

  if (variant === "row") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        onClick={() => applyTheme(!dark)}
        className={`flex items-center justify-between gap-space-sm rounded-lg px-space-sm py-space-sm text-left font-label-md text-label-md text-on-surface-variant ${className}`}
      >
        <span className="inline-flex items-center gap-space-sm">
          {icons}
          Dark mode
        </span>
        <span
          aria-hidden
          className={`relative h-5 w-9 rounded-full transition-colors ${dark ? "bg-primary-container" : "bg-outline-variant"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              dark ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => applyTheme(!dark)}
      aria-label={label}
      title={label}
      className={`h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant ring-1 ring-inset ring-outline-variant/70 transition-colors hover:bg-surface-container hover:text-on-surface ${className}`}
    >
      {icons}
    </button>
  );
}
