import { getSections } from "@/lib/dsa/curriculum";

export interface SearchItem {
  kind: "page" | "course" | "lesson" | "problem";
  title: string;
  subtitle: string;
  href: string;
  difficulty?: string;
}

const PAGES: SearchItem[] = [
  { kind: "page", title: "Home", subtitle: "Start page", href: "/" },
  { kind: "page", title: "Structured learning path", subtitle: "The DSA roadmap", href: "/#learning-path" },
  { kind: "page", title: "All courses", subtitle: "Visualizer & lessons", href: "/dsa" },
  { kind: "page", title: "Privacy policy", subtitle: "What we collect and why", href: "/privacy" },
  { kind: "page", title: "Terms of service", subtitle: "Using IntuitionRewire", href: "/terms" },
];

/**
 * Everything the header search can find. Only titles that the public course
 * pages already list, so it's safe to cache briefly.
 */
export async function GET() {
  const sections = await getSections();
  const items: SearchItem[] = [...PAGES];

  for (const section of sections) {
    items.push({
      kind: "course",
      title: section.title,
      subtitle: section.description,
      href: `/dsa/${section.slug}`,
    });
    for (const topic of section.topics) {
      if (topic.slug === "coming-soon") continue;
      items.push({
        kind: topic.kind === "problem" ? "problem" : "lesson",
        title: topic.title,
        subtitle: `${section.title} · ${topic.chapter}`,
        href: `/dsa/${section.slug}/${topic.slug}`,
        ...(topic.difficulty ? { difficulty: topic.difficulty } : {}),
      });
    }
  }

  return Response.json({ items }, { headers: { "Cache-Control": "public, max-age=60" } });
}
