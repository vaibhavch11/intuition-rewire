/**
 * Courses anyone can read in full, signed in or not. Every other course shows
 * its contents to everyone, but its lessons need a free account to read.
 */
export const FREE_COURSES: ReadonlySet<string> = new Set(["arrays"]);

export function isFreeCourse(slug: string): boolean {
  return FREE_COURSES.has(slug);
}
