"use client";

import NextLink from "next/link";
import { useRef, useState, type ComponentProps } from "react";

/** How long the pointer must rest on a link before its page is fetched, so sweeping past links costs nothing. */
const HOVER_DELAY_MS = 80;

/**
 * next/link that prefetches on intent rather than on sight. Prefetching every
 * link in view is a server render each, and on the Workers free plan every
 * render counts against the 10 ms CPU limit per request: a lesson page's
 * sidebar, header and footer would prefetch ~37 pages on every visit, and many
 * of those renders were stopped mid-way ("Workers CPU limit exceeded").
 *
 * Instead a link's page is fetched when the pointer rests on it, it gets
 * keyboard focus, or a finger touches it — usually a few hundred milliseconds
 * before the click — so the page is often ready when the click lands. Pass
 * `prefetch` to choose the behaviour yourself.
 */
export default function Link({ prefetch, onMouseEnter, onMouseLeave, onFocus, onTouchStart, ...props }: ComponentProps<typeof NextLink>) {
  const [intent, setIntent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (prefetch !== undefined) {
    return <NextLink prefetch={prefetch} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onFocus={onFocus} onTouchStart={onTouchStart} {...props} />;
  }

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <NextLink
      // Turning prefetch on makes next/link fetch the full page once (it's in view, under the pointer).
      prefetch={intent}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        if (!intent) timer.current = setTimeout(() => setIntent(true), HOVER_DELAY_MS);
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        cancel();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        setIntent(true);
      }}
      onTouchStart={(e) => {
        onTouchStart?.(e);
        setIntent(true);
      }}
      {...props}
    />
  );
}
