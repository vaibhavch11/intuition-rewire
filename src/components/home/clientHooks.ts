"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/** True only in the browser, without a setState-in-effect or hydration mismatch. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** Whether the element is on screen, so a 3D scene can stop drawing when it isn't. */
export function useInView(ref: RefObject<Element | null>, rootMargin = "120px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
