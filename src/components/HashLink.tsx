"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

/**
 * Scrolls to `#section` itself when the link points at the page you're
 * already on. The router skips navigations to the URL already showing, so
 * without this a second click on "Learning Path" would do nothing.
 */
export function scrollToHashOnThisPage(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  pathname: string
) {
  const [path, hash] = href.split("#");
  if (!hash || (path || pathname) !== pathname) return;
  const target = document.getElementById(hash);
  if (!target) return;

  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  window.history.replaceState(window.history.state, "", `${pathname}#${hash}`);
}

export default function HashLink({
  href,
  onClick,
  ...rest
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) scrollToHashOnThisPage(event, href, pathname);
      }}
      {...rest}
    />
  );
}
