/**
 * Is this request from Google's or Bing's real search crawler?
 *
 * A user agent is easy to fake, so it only starts the check. The crawler's IP
 * must also resolve (reverse DNS) to the search engine's own domain, and that
 * name must resolve back to the same IP — the verification Google and Bing
 * document for their crawlers. Lookups go over DNS-over-HTTPS, so they work
 * inside the Worker, and each IP's answer is remembered for a few hours.
 */

const CRAWLER_AGENT = /Googlebot|Google-InspectionTool|GoogleOther|Storebot-Google|bingbot/i;
const CRAWLER_DOMAINS = [".googlebot.com", ".google.com", ".googleusercontent.com", ".search.msn.com"];
const DOH = "https://cloudflare-dns.com/dns-query";
const TTL_MS = 6 * 60 * 60 * 1000;
const verdicts = new Map<string, { ok: boolean; until: number }>();

/** Every IPv6 address written out in full, so two spellings of one address compare equal. */
function expandIpv6(ip: string): string | null {
  const [head, tail] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail !== undefined && tail ? tail.split(":") : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (tail === undefined && missing !== 0)) return null;
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => g.padStart(4, "0")).join(":");
}

function reverseName(ip: string): string | null {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return `${ip.split(".").reverse().join(".")}.in-addr.arpa`;
  const full = expandIpv6(ip);
  return full ? `${full.replace(/:/g, "").split("").reverse().join(".")}.ip6.arpa` : null;
}

async function resolve(name: string, type: "PTR" | "A" | "AAAA"): Promise<string[]> {
  const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(1500),
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { Answer?: { data: string }[] };
  return (body.Answer ?? []).map((a) => a.data.replace(/\.$/, "").toLowerCase());
}

async function verify(ip: string): Promise<boolean> {
  const reverse = reverseName(ip);
  if (!reverse) return false;
  const v6 = ip.includes(":");
  const same = (other: string) => (v6 ? expandIpv6(other) === expandIpv6(ip) : other === ip);
  for (const host of await resolve(reverse, "PTR")) {
    if (!CRAWLER_DOMAINS.some((d) => host.endsWith(d))) continue;
    if ((await resolve(host, v6 ? "AAAA" : "A")).some(same)) return true;
  }
  return false;
}

export async function isVerifiedSearchCrawler(headers: Headers): Promise<boolean> {
  if (!CRAWLER_AGENT.test(headers.get("user-agent") ?? "")) return false;
  const ip = headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return false;

  const now = Date.now();
  const known = verdicts.get(ip);
  if (known && known.until > now) return known.ok;
  // A failed lookup (timeout, DNS error) is only remembered briefly, so the next visit retries.
  const ok = await verify(ip).then(
    (v) => ({ v, ttl: TTL_MS }),
    () => ({ v: false, ttl: 10 * 60 * 1000 })
  );
  if (verdicts.size > 1000) verdicts.clear();
  verdicts.set(ip, { ok: ok.v, until: now + ok.ttl });
  return ok.v;
}
