// The Worker entry (wrangler.jsonc `main`). OpenNext renders the site; this
// wraps it with an edge cache for pages every signed-out visitor sees the same
// way, so a repeat visit — or a search crawler — is answered from Cloudflare's
// cache in a millisecond or two instead of a fresh server render.
import openNext from "./.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

// Lessons and courses: an edit saved in /admin shows within 10 minutes.
const PAGE_SECONDS = 600;
const SITEMAP_SECONDS = 3600;
const PAGES = new Set(["/", "/dsa", "/pricing", "/contact", "/privacy", "/terms", "/refund-policy"]);

/** How long this request's response may be shared from the cache; 0 skips the cache. */
function sharedSeconds(request, url) {
  if (request.method !== "GET") return 0;
  // Client-side navigations fetch a different payload (React Server Components).
  if (request.headers.has("rsc") || url.searchParams.has("_rsc")) return 0;
  // Signed-in readers (Supabase's sb-* cookies) get pages of their own.
  if (/(?:^|;\s*)sb-/.test(request.headers.get("cookie") ?? "")) return 0;
  if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") return SITEMAP_SECONDS;
  if (PAGES.has(url.pathname) || url.pathname.startsWith("/dsa/")) return PAGE_SECONDS;
  return 0;
}

/** Browsers always come back for the page (signing in changes it), so they never keep it as fresh. */
function forBrowser(response, status) {
  const out = new Response(response.body, response);
  out.headers.set("cache-control", "private, no-cache");
  out.headers.set("x-edge-cache", status);
  return out;
}

/**
 * Videos (wrangler.jsonc routes /videos/* here first): static assets ignore a
 * Range header and always send the whole file, and Safari and iPhones won't
 * stream or autoplay a video that way. So ranges are answered here, with 206s.
 */
async function serveVideo(request, env) {
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (!asset.ok) return asset;

  const headers = new Headers(asset.headers);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=604800");
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  if (!range || (range[1] === "" && range[2] === "")) {
    return new Response(asset.body, { status: 200, headers });
  }

  // The asset may arrive without a length, so read it to know its size.
  const known = Number(asset.headers.get("content-length"));
  const bytes = known ? null : await asset.arrayBuffer();
  const size = known || bytes.byteLength;

  let start;
  let end;
  if (range[1] === "") {
    start = Math.max(0, size - Number(range[2])); // "bytes=-500": the last 500 bytes
    end = size - 1;
  } else {
    start = Number(range[1]);
    end = range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
  }
  if (start > end || start >= size) {
    headers.set("content-range", `bytes */${size}`);
    headers.delete("content-length");
    return new Response(null, { status: 416, headers });
  }

  headers.set("content-range", `bytes ${start}-${end}/${size}`);
  headers.set("content-length", String(end - start + 1));
  // The whole file from the start (a browser's usual first request) streams as is.
  if (!bytes && start === 0 && end === size - 1) return new Response(asset.body, { status: 206, headers });
  const all = bytes ?? (await asset.arrayBuffer());
  return new Response(all.slice(start, end + 1), { status: 206, headers });
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/videos/") && (request.method === "GET" || request.method === "HEAD")) {
      return serveVideo(request, env);
    }
    const seconds = sharedSeconds(request, url);
    if (!seconds) return openNext.fetch(request, env, ctx);

    // Keyed by deployment too, so a new deploy never serves pages that point at old scripts.
    const params = new URLSearchParams(url.search);
    params.set("__deploy", env.CF_VERSION_METADATA?.id ?? "dev");
    const key = new Request(`${url.origin}${url.pathname}?${params}`);
    const cache = caches.default;

    const hit = await cache.match(key);
    if (hit) return forBrowser(hit, "HIT");

    const response = await openNext.fetch(request, env, ctx);
    const type = response.headers.get("content-type") ?? "";
    if (response.status === 200 && !response.headers.has("set-cookie") && /text\/html|xml|text\/plain/.test(type)) {
      const stored = new Response(response.clone().body, response);
      stored.headers.set("cache-control", `public, max-age=${seconds}`);
      stored.headers.delete("vary");   // the cache keys on the URL alone; RSC requests never get here
      ctx.waitUntil(cache.put(key, stored));
    }
    return forBrowser(response, "MISS");
  },
};

export default worker;
