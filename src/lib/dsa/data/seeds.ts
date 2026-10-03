import type { Difficulty, Topic } from "../types";

export type TopicSeed = Omit<Topic, "chapter">;

export const lesson = (slug: string, title: string): TopicSeed => ({ slug, title });

export const problem = (slug: string, title: string, difficulty: Difficulty): TopicSeed => ({
  slug,
  title,
  kind: "problem",
  difficulty,
  hasCodeSolution: true,
});

export function chapterTopics(chapter: string, seeds: TopicSeed[]): Topic[] {
  return seeds.map((seed) => ({ ...seed, chapter }));
}
