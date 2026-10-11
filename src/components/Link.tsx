import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * next/link without automatic prefetching. Each prefetch is a server render,
 * and on the Workers free plan every render counts against the 10 ms CPU limit
 * per request: a lesson page's sidebar, header and footer would otherwise
 * prefetch ~37 pages on every visit, and many of those renders were stopped
 * mid-way (Cloudflare's "Workers CPU limit exceeded"). A page is now fetched
 * when its link is clicked; pass `prefetch` to opt a link back in.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
