"use client";

import { readStored, writeStored } from "./browserStore";

export const PROGRESS_KEY = "ir:progress";

type ProgressMap = Record<string, string[]>;

function parse(raw: string | null): ProgressMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

export function completedFrom(
  raw: string | null,
  sectionSlug: string
): string[] {
  return parse(raw)[sectionSlug] ?? [];
}

export function setTopicComplete(
  sectionSlug: string,
  topicSlug: string,
  complete: boolean
): void {
  const all = parse(readStored(PROGRESS_KEY));
  const completed = all[sectionSlug] ?? [];
  if (completed.includes(topicSlug) === complete) return;

  const next = complete
    ? [...completed, topicSlug]
    : completed.filter((slug) => slug !== topicSlug);

  writeStored(PROGRESS_KEY, JSON.stringify({ ...all, [sectionSlug]: next }));
}
